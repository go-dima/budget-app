/**
 * Fixture data extracted verbatim from:
 *   XLSX: "Account Transactions Mar 27 2026.xlsx" — rows 0-4 (header + 4 txns), raw:false
 *   XLS:  "Account Transactions Mar 27 2026.xls"  — rows 0-5 (title + header + 4 txns), HTML table text
 *
 * Both files are Bank Leumi exports. The bank uses בחובה/בזכות/היתרה בש"ח column names.
 *
 * Important: parseSheet uses raw:false so XLSX returns date cells as formatted strings
 * (e.g. "3/10/25" for October 3) rather than Excel serial integers. parseDate() then
 * reads them as DD/MM/YY, giving the correct date.
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseSheet, parseRawRows, detectHeaderRow, COLUMN_MAPPING } from './excelParser.js';

// ── Column map for Bank Leumi ─────────────────────────────────────────────────

const BANK_LEUMI_MAP: Record<string, string> = {
  ...COLUMN_MAPPING,
  'בחובה':       'expense',
  'בזכות':       'income',
  'היתרה בש"ח': 'balance',
};

// ── Fixture: rows as returned by XLSX.utils.sheet_to_json(ws, {raw:false}) ───
// Date cells come back as formatted strings (e.g. "21/09/2025", "3/10/25").

const XLSX_RAW_ROWS: unknown[][] = [
  // row 0 — header
  ['תאריך', 'תאריך ערך', 'תיאור', 'אסמכתא', 'בחובה', 'בזכות', 'היתרה בש"ח', '  הערה', ''],
  // row 1 — שיק (September, stored as text "21/09/2025")
  ['21/09/2025', '21/09/2025', 'שיק', '5000152', '8000', '0', '29013.42', '', ''],
  // row 2 — מס הכנסה (September)
  ['30/09/2025', '30/09/2025', 'מס הכנסה', '377317', '7.56', '0', '29005.86', '', ''],
  // row 3 — רבית זכות (September)
  ['30/09/2025', '30/09/2025', 'רבית זכות', '377316', '0', '50.42', '29056.28', '', ''],
  // row 4 — ישראכרט (October — bank uses M/D/YY serial format → raw:false returns "3/10/25")
  ['3/10/25', '3/10/25', 'ישראכרט בע"מ-י', '20543', '849.45', '0', '28206.83', '', ''],
];

// ── Fixture: text cells as extracted by extractHtmlSheets from the HTML XLS ───

const XLS_ROWS: string[][] = [
  // row 0 — page title (not a header row)
  ['תנועות בחשבון'],
  // row 1 — header
  ['תאריך', 'תאריך ערך', 'תיאור', 'אסמכתא', 'בחובה', 'בזכות', 'היתרה בש"ח', 'הערה'],
  // row 2 — שיק (September)
  ['21/09/2025', '21/09/2025', 'שיק', '5000152', '8,000.00', '0.00', '29,013.42', ''],
  // row 3 — מס הכנסה (September)
  ['30/09/2025', '30/09/2025', 'מס הכנסה', '377317', '7.56', '0.00', '29,005.86', ''],
  // row 4 — רבית זכות (September)
  ['30/09/2025', '30/09/2025', 'רבית זכות', '377316', '0.00', '50.42', '29,056.28', ''],
  // row 5 — ישראכרט (October — HTML XLS stores full DD/MM/YYYY)
  ['03/10/2025', '03/10/2025', 'ישראכרט בע"מ-י', '20543', '849.45', '0.00', '28,206.83', ''],
];

// ── Expected output ───────────────────────────────────────────────────────────

const EXPECTED = [
  {
    date:             '2025-09-21',
    description:      'שיק',
    rawDescription:   'שיק',
    reference:        '5000152',
    expenseAgorot:    800000,   // ₪8,000.00
    incomeAgorot:     0,
    balanceAgorot:    2901342,  // ₪29,013.42
    paymentMethod:    null,
    category:         '',
    details:          null,
  },
  {
    date:             '2025-09-30',
    description:      'מס הכנסה',
    rawDescription:   'מס הכנסה',
    reference:        '377317',
    expenseAgorot:    756,      // ₪7.56
    incomeAgorot:     0,
    balanceAgorot:    2900586,  // ₪29,005.86
    paymentMethod:    null,
    category:         '',
    details:          null,
  },
  {
    date:             '2025-09-30',
    description:      'רבית זכות',
    rawDescription:   'רבית זכות',
    reference:        '377316',
    expenseAgorot:    0,
    incomeAgorot:     5042,     // ₪50.42
    balanceAgorot:    2905628,  // ₪29,056.28
    paymentMethod:    null,
    category:         '',
    details:          null,
  },
  {
    date:             '2025-10-03',
    description:      'ישראכרט בע"מ-י',
    rawDescription:   'ישראכרט בע"מ-י',
    reference:        '20543',
    expenseAgorot:    84945,    // ₪849.45
    incomeAgorot:     0,
    balanceAgorot:    2820683,  // ₪28,206.83
    paymentMethod:    null,
    category:         '',
    details:          null,
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('excelParser — Bank Leumi fixture', () => {
  it('XLSX path (parseSheet) produces expected transactions', () => {
    const ws = XLSX.utils.aoa_to_sheet(XLSX_RAW_ROWS);
    const result = parseSheet(ws, BANK_LEUMI_MAP);
    expect(result).toEqual(EXPECTED);
  });

  it('XLS / HTML path (parseRawRows) produces expected transactions', () => {
    const headerIdx = detectHeaderRow(XLS_ROWS);
    expect(headerIdx).toBe(1); // title row is row 0; header is row 1
    const result = parseRawRows(XLS_ROWS, headerIdx, BANK_LEUMI_MAP);
    expect(result).toEqual(EXPECTED);
  });

  it('both paths produce identical output', () => {
    const xlsx = parseSheet(XLSX.utils.aoa_to_sheet(XLSX_RAW_ROWS), BANK_LEUMI_MAP);
    const xls  = parseRawRows(XLS_ROWS, detectHeaderRow(XLS_ROWS), BANK_LEUMI_MAP);
    expect(xlsx).toEqual(xls);
  });
});
