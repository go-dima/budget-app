import * as XLSX from "xlsx";

// Hebrew column name to field mapping
export const COLUMN_MAPPING: Record<string, string> = {
  תאריך: "date",
  תיאור: "description",
  "אמצעי תשלום": "payment_method",
  קטגוריה: "category",
  פירוט: "details",
  אסמכתא: "reference",
  חובה: "expense",
  זכות: "income",
  יתרה: "balance",
};

// Hebrew month names for parsing dates
const HEBREW_MONTHS: Record<string, number> = {
  ינו: 1,
  ינואר: 1,
  פבר: 2,
  פברואר: 2,
  מרץ: 3,
  מרס: 3,
  אפר: 4,
  אפריל: 4,
  מאי: 5,
  יונ: 6,
  יוני: 6,
  יול: 7,
  יולי: 7,
  אוג: 8,
  אוגוסט: 8,
  ספט: 9,
  ספטמבר: 9,
  אוק: 10,
  אוקטובר: 10,
  נוב: 11,
  נובמבר: 11,
  דצמ: 12,
  דצמבר: 12,
};

// English month abbreviations
const ENGLISH_MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function parseDate(
  dateValue: unknown
): { timestamp: number | null; rawString: string } {
  if (dateValue == null) {
    return { timestamp: null, rawString: "" };
  }

  const rawString = String(dateValue).trim();

  // If it's a Date object
  if (dateValue instanceof Date) {
    return {
      timestamp: Math.floor(dateValue.getTime() / 1000),
      rawString,
    };
  }

  // If it's a number (Excel serial date)
  if (typeof dateValue === "number") {
    // Excel serial date conversion
    // Excel dates are days since 1899-12-30 (with a bug for 1900 leap year)
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 24 * 60 * 60 * 1000;
    const jsDate = new Date(excelEpoch.getTime() + dateValue * msPerDay);
    if (!isNaN(jsDate.getTime())) {
      return {
        timestamp: Math.floor(jsDate.getTime() / 1000),
        rawString,
      };
    }
  }

  const dateStr = rawString.toLowerCase();

  // Try DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = dateStr.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
  if (slashMatch) {
    let [, dayStr, monthStr, yearStr] = slashMatch;
    let day = parseInt(dayStr, 10);
    let month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);

    if (year < 100) {
      year += 2000;
    }

    try {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return {
          timestamp: Math.floor(date.getTime() / 1000),
          rawString,
        };
      }
    } catch {
      // Continue to next format
    }
  }

  // Try "DD Month YYYY" format (Hebrew or English)
  const textMatch = dateStr.match(/(\d{1,2})\s+([א-ת\w]+)\s+(\d{2,4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    let year = parseInt(textMatch[3], 10);

    if (year < 100) {
      year += 2000;
    }

    const month = HEBREW_MONTHS[monthStr] ?? ENGLISH_MONTHS[monthStr];
    if (month) {
      try {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return {
            timestamp: Math.floor(date.getTime() / 1000),
            rawString,
          };
        }
      } catch {
        // Return null timestamp
      }
    }
  }

  return { timestamp: null, rawString };
}

export function parseAmount(value: unknown): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  // Remove quotes, commas, spaces
  const cleaned = String(value)
    .replace(/"/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!cleaned || cleaned === "-") {
    return 0;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface ParsedTransaction {
  date: number | null;
  description: string;
  payment_method: string | null;
  category: string;
  details: string | null;
  reference: string | null;
  expense: number;
  income: number;
  balance: number;
  raw_date_string: string;
}

export function parseExcelFile(
  buffer: Buffer
): Record<string, ParsedTransaction[]> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const result: Record<string, ParsedTransaction[]> = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const transactions = parseSheet(sheet);
    if (transactions.length > 0) {
      result[sheetName] = transactions;
    }
  }

  return result;
}

export function parseSheet(
  sheet: XLSX.WorkSheet
): ParsedTransaction[] {
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
  }) as unknown[][];

  if (!rows || rows.length === 0) {
    return [];
  }

  // Find header row by looking for Hebrew column names
  let headerRowIdx: number | null = null;
  const columnIndices: Map<number, string> = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = row[colIdx];
      if (cell == null) continue;

      const cellStr = String(cell).trim();
      if (cellStr in COLUMN_MAPPING) {
        columnIndices.set(colIdx, COLUMN_MAPPING[cellStr]);
      }
    }

    if (columnIndices.size > 0) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === null || columnIndices.size === 0) {
    return [];
  }

  // Parse data rows
  const transactions: ParsedTransaction[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => cell == null)) {
      continue;
    }

    const txn: Partial<ParsedTransaction> = {};

    for (const [colIdx, fieldName] of columnIndices) {
      const value = colIdx < row.length ? row[colIdx] : null;

      if (fieldName === "date") {
        const { timestamp, rawString } = parseDate(value);
        txn.date = timestamp;
        txn.raw_date_string = rawString;
      } else if (["expense", "income", "balance"].includes(fieldName)) {
        (txn as Record<string, number>)[fieldName] = parseAmount(value);
      } else {
        (txn as Record<string, string | null>)[fieldName] =
          value != null ? String(value).trim() : null;
      }
    }

    // Skip rows without valid date or description
    if (txn.date == null || !txn.description) {
      continue;
    }

    // Set defaults for missing fields
    transactions.push({
      date: txn.date,
      description: txn.description!,
      payment_method: txn.payment_method ?? null,
      category: txn.category ?? "לא מסווג",
      details: txn.details ?? null,
      reference: txn.reference ?? null,
      expense: txn.expense ?? 0,
      income: txn.income ?? 0,
      balance: txn.balance ?? 0,
      raw_date_string: txn.raw_date_string ?? "",
    });
  }

  return transactions;
}

export function getSheetPreview(
  buffer: Buffer,
  sheetName: string
): {
  headers: string[];
  detectedMapping: Record<string, string>;
  rowCount: number;
  sampleRows: Record<string, string>[];
} | null {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (!workbook.SheetNames.includes(sheetName)) {
    return null;
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
  }) as unknown[][];

  if (!rows || rows.length === 0) {
    return null;
  }

  // Find headers and mapping
  const headers: string[] = [];
  const detectedMapping: Record<string, string> = {};
  let headerRowIdx: number | null = null;
  const headerColIndices: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = row[colIdx];
      if (cell == null) continue;

      const cellStr = String(cell).trim();
      if (cellStr in COLUMN_MAPPING) {
        headers.push(cellStr);
        headerColIndices.push(colIdx);
        detectedMapping[cellStr] = COLUMN_MAPPING[cellStr];
      }
    }

    if (headers.length > 0) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === null) {
    return null;
  }

  // Count data rows
  const dataRows = rows.slice(headerRowIdx + 1);
  const rowCount = dataRows.filter(
    (row) => row && !row.every((cell) => cell == null)
  ).length;

  // Get sample rows (first 3)
  const sampleRows: Record<string, string>[] = [];
  for (const row of dataRows.slice(0, 3)) {
    if (!row || row.every((cell) => cell == null)) continue;

    const sample: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const colIdx = headerColIndices[i];
      const val = colIdx < row.length ? row[colIdx] : null;
      sample[headers[i]] = val != null ? String(val) : "";
    }
    sampleRows.push(sample);
  }

  return {
    headers,
    detectedMapping,
    rowCount,
    sampleRows,
  };
}

export function getWorkbookSheetNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames;
}
