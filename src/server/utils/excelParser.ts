import * as XLSX from 'xlsx';

// Hebrew column name to field mapping
export const COLUMN_MAPPING: Record<string, string> = {
  תאריך: 'date',
  תיאור: 'description',
  'אמצעי תשלום': 'payment_method',
  קטגוריה: 'category',
  פירוט: 'details',
  אסמכתא: 'reference',
  חובה: 'expense',
  זכות: 'income',
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

  // Excel serial number
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + dateValue * 86400000);
    if (!isNaN(d.getTime())) return toIso(d);
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

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns agorot (integer). Positive = income, negative = expense when context is known. */
export function parseAmount(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Math.round(value * 100);
  const cleaned = String(value).replace(/"/g, '').replace(/,/g, '').replace(/\s/g, '').trim();
  if (!cleaned || cleaned === '-') return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export interface ParsedTransaction {
  date: string;           // YYYY-MM-DD
  description: string;
  paymentMethod: string | null;
  category: string;
  details: string | null;
  reference: string | null;
  expenseAgorot: number;  // absolute value (always >= 0)
  incomeAgorot: number;   // absolute value (always >= 0)
  balanceAgorot: number;
}

export function parseSheet(sheet: XLSX.WorkSheet): ParsedTransaction[] {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];
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
      if (cellStr in COLUMN_MAPPING) {
        columnIndices.set(col, COLUMN_MAPPING[cellStr]!);
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

    const txn: Partial<ParsedTransaction & { expense: unknown; income: unknown; balance: unknown }> = {};

    for (const [col, field] of columnIndices) {
      const val = col < row.length ? row[col] : null;

      if (field === 'date') {
        txn.date = parseDate(val) ?? undefined;
      } else if (field === 'expense') {
        txn.expense = val;
      } else if (field === 'income') {
        txn.income = val;
      } else if (field === 'balance') {
        txn.balance = val;
      } else {
        (txn as Record<string, string | null>)[field] = val != null ? String(val).trim() : null;
      }
    }

    if (!txn.date || !txn.description) continue;

    result.push({
      date: txn.date,
      description: txn.description as string,
      paymentMethod: ((txn as Record<string, unknown>)['payment_method'] as string | null) ?? null,
      category: (txn.category as string | null) ?? 'לא מסווג',
      details: (txn.details as string | null) ?? null,
      reference: (txn.reference as string | null) ?? null,
      expenseAgorot: parseAmount(txn.expense),
      incomeAgorot: parseAmount(txn.income),
      balanceAgorot: parseAmount(txn.balance),
    });
  }

  return result;
}

export function parseExcelFile(buffer: Buffer): Record<string, ParsedTransaction[]> {
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

export function getSheetMeta(buffer: Buffer, sheetName: string): SheetMeta {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.includes(sheetName)) {
      return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: `Sheet "${sheetName}" not found` };
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: 'Empty sheet' };

    const txns = parseSheet(sheet);

    if (txns.length === 0) {
      return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: null };
    }

    const dates = txns.map(t => t.date).sort();
    const dateRange = { from: dates[0]!, to: dates[dates.length - 1]! };
    const sampleRows = txns.slice(0, 5).map(t => ({
      date: t.date,
      description: t.description,
      category: t.category,
      expenseAgorot: t.expenseAgorot,
      incomeAgorot: t.incomeAgorot,
    }));

    return { sheetName, rowCount: txns.length, dateRange, sampleRows, error: null };
  } catch (e) {
    return { sheetName, rowCount: 0, dateRange: null, sampleRows: [], error: String(e) };
  }
}
