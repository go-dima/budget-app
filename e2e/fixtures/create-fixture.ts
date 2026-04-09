/**
 * Generates e2e/fixtures/sanity.xlsx — a clean synthetic fixture for the e2e sanity suite.
 *
 * Sheet: "SanityAccount" — 5 transactions in January 2024.
 * Column headers match the Bank Leumi COLUMN_MAPPING in excelParser.ts.
 *
 * Run once: npx tsx e2e/fixtures/create-fixture.ts
 */

import * as XLSX from 'xlsx';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'sanity.xlsx');

// Headers match COLUMN_MAPPING keys in src/server/utils/excelParser.ts
// חובה = expense column, זכות = income column
const HEADERS = ['תאריך', 'תיאור', 'חובה', 'זכות', 'קטגוריה'];

// Dates as DD/MM/YY strings — parsed by parseDate with raw:false
// Amounts in NIS (parser converts to agorot)
// Use חובה (expense) column for expenses, זכות (income) for income
const ROWS: (string | number)[][] = [
  ['01/01/24', 'Supermarket',  150.00, '',       'Food'],
  ['15/01/24', 'Salary',       '',     8000.00,  'Income'],
  ['20/01/24', 'Electricity',  300.00, '',       'Utilities'],
  ['25/01/24', 'Supermarket',  120.00, '',       'Food'],
  ['31/01/24', 'Rent',         2500.00,'',       'Rent'],
];

const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...ROWS]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'SanityAccount');
XLSX.writeFile(wb, OUT);

console.log(`Written: ${OUT}`);
