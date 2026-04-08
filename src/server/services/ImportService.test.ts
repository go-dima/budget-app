import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { createTestDb } from '../../db/index.js';
import { AccountService } from './AccountService.js';
import { ImportService } from './ImportService.js';

describe('ImportService', () => {
  let db: ReturnType<typeof createTestDb>;
  let service: ImportService;
  let accountService: AccountService;

  beforeEach(() => {
    db = createTestDb();
    service = new ImportService(db);
    accountService = new AccountService(db);
  });

  it('getImportStatus returns empty when no data', () => {
    const status = accountService.getImportStatus();
    expect(status.accounts).toHaveLength(0);
    expect(status.totalTransactions).toBe(0);
  });

  it('reset clears all data', () => {
    accountService.create('Test');
    service.reset();
    expect(accountService.getImportStatus().accounts).toHaveLength(0);
  });

  it('executeImport returns not found for invalid fileId', () => {
    const result = service.executeImport('nonexistent-id', 'test.xlsx');
    expect(result.success).toBe(false);
    expect(result.totalNew).toBe(0);
  });

  it('previewFile suggests bidi fix when descriptions contain bidi control characters', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['תאריך', 'תיאור', 'חובה', 'זכות', 'אסמכתא'],
      ['05/04/2026', '\u202D34685693/\u202Dםיסנניפ טיא סקמ', '15.05', '', '202-18681859'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'OZ');

    const preview = service.previewFile(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), 'oz.xlsx');

    expect(preview.suggestFixBidi).toBe(true);
  });

  it('previewFile does not suggest bidi fix for normal Hebrew descriptions', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['תאריך', 'תיאור', 'חובה', 'זכות', 'אסמכתא'],
      ['05/04/2026', 'סופרמרקט', '15.05', '', '202-18681859'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Checking');

    const preview = service.previewFile(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), 'normal.xlsx');

    expect(preview.suggestFixBidi).toBe(false);
  });
});
