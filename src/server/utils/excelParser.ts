import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';

// Hebrew column name to field mapping
export const COLUMN_MAPPING: Record<string, string> = {
  תאריך: 'date',
  'תאריך תנועה': 'date',       // OZ bank
  תיאור: 'description',
  'אמצעי תשלום': 'payment_method',
  קטגוריה: 'category',
  פירוט: 'details',
  אסמכתא: 'reference',
  חובה: 'expense',
  זכות: 'income',
  'סכום פעולה': 'amount',      // OZ bank — signed: negative = expense
  יתרה: 'balance',
};

// Hebrew month names for parsing dates
const HEBREW_MONTHS: Record<string, number> = {
  ינו: 1, ינואר: 1, פבר: 2, פברואר: 2,
  מרץ: 3, מרס: 3, אפר: 4, אפריל: 4,
  מאי: 5, יונ: 6, יוני: 6, יול: 7, יולי: 7,
  אוג: 8, אוגוסט: 8, ספט: 9, ספטמבר: 9,
  אוק: 10, אוקטובר: 10, נוב: 11, נובמבר: 11,
  דצמ: 12, דצמבר: 12,
};

const ENGLISH_MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2,
  mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Returns ISO date string YYYY-MM-DD or null */
export function parseDate(dateValue: unknown): string | null {
  if (dateValue == null) return null;

  // Excel serial number — use UTC epoch to avoid timezone drift
  if (typeof dateValue === 'number') {
    const ms = Date.UTC(1899, 11, 30) + dateValue * 86400000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return toIsoUtc(d);
  }

  // JS Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : toIso(dateValue);
  }

  const str = String(dateValue).trim().toLowerCase();

  // DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = str.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch.map(Number);
    const year = y! < 100 ? y! + 2000 : y!;
    const date = new Date(year, m! - 1, d!);
    if (!isNaN(date.getTime())) return toIso(date);
  }

  // DD Month YYYY (Hebrew or English)
  const textMatch = str.match(/(\d{1,2})\s+([א-תa-z]+)\s+(\d{2,4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1]!, 10);
    const monthStr = textMatch[2]!.toLowerCase();
    let year = parseInt(textMatch[3]!, 10);
    if (year < 100) year += 2000;
    const month = HEBREW_MONTHS[monthStr] ?? ENGLISH_MONTHS[monthStr];
    if (month) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return toIso(date);
    }
  }

  return null;
}

/** Local-time ISO — for dates constructed from string components (new Date(y,m,d)) */
function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** UTC ISO — for dates derived from Excel serial numbers (already in UTC) */
function toIsoUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns agorot (integer). Uses string-based arithmetic to avoid float drift. */
export function parseAmount(value: unknown): number {
  if (value == null) return 0;
  const str = (typeof value === 'number' ? value.toString() : String(value))
    .replace(/"/g, '').replace(/,/g, '').replace(/\s/g, '').trim();
  if (!str || str === '-') return 0;
  const neg = str.startsWith('-');
  const abs = neg ? str.slice(1) : str;
  const dotIdx = abs.indexOf('.');
  const intPart = dotIdx === -1 ? abs : abs.slice(0, dotIdx);
  const fracRaw = dotIdx === -1 ? '' : abs.slice(dotIdx + 1);
  const frac2 = fracRaw.slice(0, 2).padEnd(2, '0');
  const intVal = parseInt(intPart || '0', 10);
  const fracVal = parseInt(frac2, 10);
  if (isNaN(intVal) || isNaN(fracVal)) return 0;
  const result = intVal * 100 + fracVal;
  return neg ? -result : result;
}

/** Strips Unicode bidirectional control characters from a string (common in RTL bank exports). */
function stripBidiMarks(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/g, '').trim();
}

export interface ParsedTransaction {
  date: string;           // YYYY-MM-DD
  description: string;    // bidi control chars stripped
  rawDescription: string; // original, unstripped — for client-side bidi preview
  paymentMethod: string | null;
  category: string;
  details: string | null;
  reference: string | null;
  expenseAgorot: number;  // absolute value (always >= 0)
  incomeAgorot: number;   // absolute value (always >= 0)
  balanceAgorot: number;
}

/**
 * Scans the first 20 rows for a candidate header row (first row with 2+ non-numeric
 * text cells) and partitions its cells into known (in COLUMN_MAPPING) and unknown.
 * Returns knownFields = the internal field names the known columns map to.
 */
export function detectColumns(sheet: XLSX.WorkSheet): {
  known: string[];
  unknown: string[];
  knownFields: string[];
} {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] ?? [];
    const cells = row
      .filter(c => c != null)
      .map(c => String(c).trim())
      .filter(s => s.length > 0 && isNaN(Number(s)));
    if (cells.length >= 2) {
      const known = cells.filter(c => c in COLUMN_MAPPING);
      const unknown = cells.filter(c => !(c in COLUMN_MAPPING));
      const knownFields = known.map(c => COLUMN_MAPPING[c]!);
      return { known, unknown, knownFields };
    }
  }
  return { known: [], unknown: [], knownFields: [] };
}

export function parseSheet(sheet: XLSX.WorkSheet, customMap?: Record<string, string>): ParsedTransaction[] {
  const effectiveMap = customMap ?? COLUMN_MAPPING;
  // raw: false so date cells come back as formatted strings (e.g. "3/10/25") rather than
  // Excel serial integers — lets parseDate() interpret them as DD/MM/YY correctly.
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];
  if (!rows || rows.length === 0) return [];

  // Find header row
  let headerRowIdx: number | null = null;
  const columnIndices = new Map<number, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    for (let col = 0; col < row.length; col++) {
      const cell = row[col];
      if (cell == null) continue;
      const cellStr = String(cell).trim();
      if (cellStr in effectiveMap) {
        columnIndices.set(col, effectiveMap[cellStr]!);
      }
    }
    if (columnIndices.size > 0) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === null) return [];

  const result: ParsedTransaction[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c == null)) continue;

    const txn: Partial<ParsedTransaction & { expense: unknown; income: unknown; amount: unknown; balance: unknown }> = {};

    for (const [col, field] of columnIndices) {
      const val = col < row.length ? row[col] : null;

      if (field === 'date') {
        txn.date = parseDate(val) ?? undefined;
      } else if (field === 'expense') {
        txn.expense = val;
      } else if (field === 'income') {
        txn.income = val;
      } else if (field === 'amount') {
        txn.amount = val;
      } else if (field === 'balance') {
        txn.balance = val;
      } else {
        (txn as Record<string, string | null>)[field] = val != null ? String(val).trim() : null;
      }
    }

    if (!txn.date || !txn.description) continue;

    const signedAmount = parseAmount(txn.amount);
    const expenseAgorot = txn.expense != null ? parseAmount(txn.expense) : (signedAmount < 0 ? -signedAmount : 0);
    const incomeAgorot  = txn.income  != null ? parseAmount(txn.income)  : (signedAmount > 0 ? signedAmount  : 0);

    const rawDesc = String(txn.description ?? '');
    result.push({
      date: txn.date,
      description: stripBidiMarks(rawDesc),
      rawDescription: rawDesc,
      paymentMethod: ((txn as Record<string, unknown>)['payment_method'] as string | null) ?? null,
      category: (txn.category as string | null) ?? '',
      details: (txn.details as string | null) ?? null,
      reference: (txn.reference as string | null) ?? null,
      expenseAgorot,
      incomeAgorot,
      balanceAgorot: parseAmount(txn.balance),
    });
  }

  return result;
}

// ── HTML-as-XLS support ───────────────────────────────────────────────────────

/** Returns true if the buffer is an HTML file (bank XLS exports disguised as .xls). */
export function isHtmlFile(buffer: Buffer): boolean {
  const head = buffer.slice(0, 10).toString('utf8').replace(/^\uFEFF/, '').trimStart();
  return head.startsWith('<');
}

/**
 * Parses an HTML-as-XLS file using jsdom.
 * Finds the table whose header row has the most COLUMN_MAPPING matches and
 * returns its rows as clean text arrays keyed under 'Sheet1'.
 */
export function extractHtmlSheets(buffer: Buffer): Record<string, string[][]> {
  const content = buffer.toString('utf8');
  const dom = new JSDOM(content);
  const allTables = Array.from(dom.window.document.querySelectorAll('table'));
  const knownCols = new Set(Object.keys(COLUMN_MAPPING));

  let bestRows: string[][] = [];
  let bestScore = 0;

  for (const table of allTables) {
    const rows: string[][] = [];
    for (const tr of table.querySelectorAll('tr')) {
      const cells = Array.from(tr.querySelectorAll(':scope > td, :scope > th')).map(
        td => (td.textContent ?? '').replace(/[\u200F\u200E\u00AD\u00A0]/g, ' ').replace(/\s+/g, ' ').trim()
      );
      if (cells.some(c => c)) rows.push(cells);
    }
    // Score by known Hebrew column names in first 5 rows
    for (const row of rows.slice(0, 5)) {
      const score = row.filter(c => knownCols.has(c)).length;
      if (score > bestScore) {
        bestScore = score;
        bestRows = rows;
      }
    }
  }

  return bestScore >= 1 ? { Sheet1: bestRows } : {};
}

/**
 * Scans rows (as string arrays) from the top and returns the index of the
 * first row that has 2+ non-empty cells and at least 1 cell in COLUMN_MAPPING.
 */
export function detectHeaderRow(rows: string[][]): number {
  const knownCols = new Set(Object.keys(COLUMN_MAPPING));
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const nonEmpty = row.map(c => c.trim()).filter(Boolean);
    if (nonEmpty.length >= 2 && nonEmpty.some(c => knownCols.has(c))) return i;
  }
  return 0;
}

/**
 * Parses transactions from a pre-extracted string row array (HTML or otherwise).
 * headerRowIdx is the 0-based index of the row that contains column headers.
 */
export function parseRawRows(rows: string[][], headerRowIdx: number, customMap?: Record<string, string>): ParsedTransaction[] {
  const effectiveMap = customMap ?? COLUMN_MAPPING;
  const headerRow = rows[headerRowIdx];
  if (!headerRow) return [];

  const columnIndices = new Map<number, string>();
  for (let col = 0; col < headerRow.length; col++) {
    const cell = (headerRow[col] ?? '').trim();
    if (cell in effectiveMap) columnIndices.set(col, effectiveMap[cell]!);
  }
  if (columnIndices.size === 0) return [];

  const result: ParsedTransaction[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !c)) continue;

    const txn: Partial<ParsedTransaction & { expense: unknown; income: unknown; amount: unknown; balance: unknown }> = {};

    for (const [col, field] of columnIndices) {
      const val = row[col] ?? null;
      if (field === 'date')           { txn.date = parseDate(val) ?? undefined; }
      else if (field === 'expense')   { txn.expense = val; }
      else if (field === 'income')    { txn.income  = val; }
      else if (field === 'amount')    { txn.amount  = val; }
      else if (field === 'balance')   { txn.balance = val; }
      else { (txn as Record<string, string | null>)[field] = val ? String(val).trim() : null; }
    }

    if (!txn.date || !txn.description) continue;

    const signedAmount = parseAmount(txn.amount);
    const expenseAgorot = txn.expense != null ? parseAmount(txn.expense) : (signedAmount < 0 ? -signedAmount : 0);
    const incomeAgorot  = txn.income  != null ? parseAmount(txn.income)  : (signedAmount > 0 ? signedAmount  : 0);

    result.push({
      date: txn.date,
      description: stripBidiMarks(String(txn.description ?? '')),
      rawDescription: String(txn.description ?? ''),
      paymentMethod: ((txn as Record<string, unknown>)['payment_method'] as string | null) ?? null,
      category: (txn.category as string | null) ?? '',
      details: (txn.details as string | null) ?? null,
      reference: (txn.reference as string | null) ?? null,
      expenseAgorot,
      incomeAgorot,
      balanceAgorot: parseAmount(txn.balance),
    });
  }
  return result;
}

export function parseExcelFile(buffer: Buffer): Record<string, ParsedTransaction[]> {
  if (isHtmlFile(buffer)) {
    const htmlSheets = extractHtmlSheets(buffer);
    const result: Record<string, ParsedTransaction[]> = {};
    for (const [name, rows] of Object.entries(htmlSheets)) {
      const txns = parseRawRows(rows, detectHeaderRow(rows));
      if (txns.length > 0) result[name] = txns;
    }
    return result;
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const result: Record<string, ParsedTransaction[]> = {};
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const txns = parseSheet(sheet);
    if (txns.length > 0) result[sheetName] = txns;
  }
  return result;
}

export interface SheetMeta {
  sheetName: string;
  rowCount: number;
  dateRange: { from: string; to: string } | null;
  sampleRows: Array<{
    date: string;
    description: string;
    category: string;
    expenseAgorot: number;
    incomeAgorot: number;
  }>;
  error: string | null;
}

export function getSheetMeta(buffer: Buffer, sheetName: string, customMap?: Record<string, string>, headerRowIdx?: number): SheetMeta {
  try {
    let txns: ParsedTransaction[];

    if (isHtmlFile(buffer)) {
      const htmlSheets = extractHtmlSheets(buffer);
      const rows = htmlSheets[sheetName];
      if (!rows) return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: `Sheet "${sheetName}" not found` };
      const idx = headerRowIdx ?? detectHeaderRow(rows);
      txns = parseRawRows(rows, idx, customMap);
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      if (!workbook.SheetNames.includes(sheetName)) {
        return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: `Sheet "${sheetName}" not found` };
      }
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: 'Empty sheet' };
      txns = parseSheet(sheet, customMap);
    }

    if (txns.length === 0) {
      return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: null };
    }

    const dates = txns.map(t => t.date).sort();
    const dateRange = { from: dates[0]!, to: dates[dates.length - 1]! };
    const sampleRows = txns.slice(0, 5).map(t => ({
      date: t.date,
      description: t.rawDescription,
      category: t.category,
      expenseAgorot: t.expenseAgorot,
      incomeAgorot: t.incomeAgorot,
    }));

    return { sheetName, rowCount: txns.length, dateRange, sampleRows, error: null };
  } catch (e) {
    return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: String(e) };
  }
}
