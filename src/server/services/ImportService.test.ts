import { describe, it, expect, beforeEach } from 'vitest';
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
});
