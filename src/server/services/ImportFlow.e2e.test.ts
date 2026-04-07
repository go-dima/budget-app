/**
 * E2E flow tests using data/Flow Test.xlsx.
 *
 * The file has one sheet ("Sheet1") with 13 transactions across 7 unique descriptions.
 * Every description maps to exactly one category, so recalculate produces 7 clean mappings.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { ImportService } from './ImportService.js';
import { CategoryMappingService } from './CategoryMappingService.js';
import { CategoryService } from './CategoryService.js';
import type { DB } from '../../db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLOW_TEST_XLSX = join(__dirname, '../../../data/ImportDataTest.xlsx');

// ── Expected values (derived from data/Flow Test.xlsx) ───────────────────────
const EXPECTED = {
  sheetName: 'Sheet1',
  totalTransactions: 13,
  totalSkipped: 0,
  uniqueCategories: 7,
  uniqueDescriptions: 7, // each maps cleanly to one category → 7 mappings
  recalculate: {
    updated: 7,
    conflicts: 0, // all descriptions have a clear winner
    noops: 0,
  },
} as const;

// ── Shared state across the three tests ─────────────────────────────────────
let db: DB;
let importSvc: ImportService;
let categorySvc: CategoryService;
let mappingSvc: CategoryMappingService;
let fileBuffer: Buffer;

beforeAll(() => {
  db = createTestDb();
  importSvc = new ImportService(db);
  categorySvc = new CategoryService(db);
  mappingSvc = new CategoryMappingService(db);
  fileBuffer = readFileSync(FLOW_TEST_XLSX);
});

// ── Test 1: Import flow ──────────────────────────────────────────────────────
describe('Import flow', () => {
  it('preview returns expected sheet metadata', () => {
    const preview = importSvc.previewFile(fileBuffer, 'ImportDataTest.xlsx');

    expect(preview.sheets).toHaveLength(1);
    const sheet = preview.sheets[0]!;
    expect(sheet.sheetName).toBe(EXPECTED.sheetName);
    expect(sheet.rowCount).toBe(EXPECTED.totalTransactions);
    expect(sheet.error).toBeNull();
  });

  it('execute imports all rows with no duplicates', () => {
    const preview = importSvc.previewFile(fileBuffer, 'ImportDataTest.xlsx');
    const result = importSvc.executeImport(preview.fileId, 'ImportDataTest.xlsx');

    expect(result.success).toBe(true);
    expect(result.totalNew).toBe(EXPECTED.totalTransactions);
    expect(result.totalSkipped).toBe(EXPECTED.totalSkipped);

    expect(result.results).toHaveLength(1);
    const sheetResult = result.results[0]!;
    expect(sheetResult.accountName).toBe(EXPECTED.sheetName);
    expect(sheetResult.newTransactions).toBe(EXPECTED.totalTransactions);
    expect(sheetResult.duplicatesSkipped).toBe(0);
    expect(sheetResult.error).toBeNull();
  });

  it('re-importing the same file skips all rows as duplicates', () => {
    const preview = importSvc.previewFile(fileBuffer, 'ImportDataTest.xlsx');
    const result = importSvc.executeImport(preview.fileId, 'ImportDataTest.xlsx');

    expect(result.totalNew).toBe(0);
    expect(result.totalSkipped).toBe(EXPECTED.totalTransactions);
  });
});

// ── Test 2: Category recalculation ──────────────────────────────────────────
describe('Category recalculation', () => {
  it('creates the expected number of unique categories', () => {
    const categories = categorySvc.getAll();
    expect(categories.length).toBe(EXPECTED.uniqueCategories);
  });

  it('recalculate produces correct updated/conflicts/noops counts', () => {
    const result = mappingSvc.recalculate();

    expect(result.updated).toBe(EXPECTED.recalculate.updated);
    expect(result.conflicts).toBe(EXPECTED.recalculate.conflicts);
    expect(result.noops).toBe(EXPECTED.recalculate.noops);
  });

  it('second recalculate is a full no-op', () => {
    const result = mappingSvc.recalculate();

    expect(result.updated).toBe(0);
    expect(result.conflicts).toBe(0);
    expect(result.noops).toBe(EXPECTED.recalculate.updated); // all 7 now no-ops
  });
});

// ── Test 3: Category mapping fetch ──────────────────────────────────────────
describe('Category mapping fetch', () => {
  it('returns expected number of mappings', () => {
    const mappings = mappingSvc.getAll();
    expect(mappings.length).toBe(EXPECTED.uniqueDescriptions);
  });

  it('every mapping has a preferred category (no ties)', () => {
    const mappings = mappingSvc.getAll();
    const withoutPreferred = mappings.filter(m => m.preferredCategoryId === null);
    expect(withoutPreferred).toHaveLength(0);
  });

  it('every mapping has an empty suggested list (each description has one category)', () => {
    const mappings = mappingSvc.getAll();
    const withSuggested = mappings.filter(m => m.suggestedCategoryIds.length > 0);
    expect(withSuggested).toHaveLength(0);
  });

  it('lookupCategory returns the preferred category for a known description', () => {
    // "הכנסה חודשית" appears in the file mapped to "הכנסה"
    const categoryId = mappingSvc.lookupCategory(EXPECTED.sheetName, 'הכנסה חודשית');
    expect(categoryId).not.toBeNull();

    const category = categorySvc.getAll().find(c => c.id === categoryId);
    expect(category?.name).toBe('הכנסה');
  });
});
