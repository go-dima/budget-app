import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { ColumnMappingService } from './ColumnMappingService.js';
import type { DB } from '../../db/index.js';

describe('ColumnMappingService', () => {
  let db: DB;
  let svc: ColumnMappingService;

  beforeEach(() => {
    db = createTestDb();
    svc = new ColumnMappingService(db);
  });

  it('returns null for unknown account', () => {
    expect(svc.getForAccount('unknown')).toBeNull();
  });

  it('stores and retrieves a mapping', () => {
    svc.save('MyBank', [
      { sourceColumn: 'Date', targetField: 'date' },
      { sourceColumn: 'Desc', targetField: 'description' },
    ]);
    const result = svc.getForAccount('MyBank');
    expect(result).toHaveLength(2);
    expect(result![0]).toMatchObject({ sourceColumn: 'Date', targetField: 'date' });
  });

  it('overwrites existing mapping on re-save', () => {
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'date' }]);
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'ignore' }]);
    const result = svc.getForAccount('MyBank');
    expect(result).toHaveLength(1);
    expect(result![0]!.targetField).toBe('ignore');
  });

  it('save with empty array removes all entries for account', () => {
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'date' }]);
    svc.save('MyBank', []);
    expect(svc.getForAccount('MyBank')).toBeNull();
  });

  it('deleteForAccount removes all entries', () => {
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'date' }]);
    svc.deleteForAccount('MyBank');
    expect(svc.getForAccount('MyBank')).toBeNull();
  });

  it('mappings for different accounts are independent', () => {
    svc.save('BankA', [{ sourceColumn: 'Col1', targetField: 'date' }]);
    svc.save('BankB', [{ sourceColumn: 'Col1', targetField: 'description' }]);
    expect(svc.getForAccount('BankA')![0]!.targetField).toBe('date');
    expect(svc.getForAccount('BankB')![0]!.targetField).toBe('description');
  });

  it('getAll returns all accounts grouped', () => {
    svc.save('BankA', [{ sourceColumn: 'Col1', targetField: 'date' }]);
    svc.save('BankB', [{ sourceColumn: 'Col2', targetField: 'income' }]);
    const all = svc.getAll();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all['BankA']![0]!.targetField).toBe('date');
    expect(all['BankB']![0]!.targetField).toBe('income');
  });
});
