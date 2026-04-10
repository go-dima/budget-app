import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { PaymentMappingService } from './PaymentMappingService.js';
import { AccountService } from './AccountService.js';
import { TransactionService } from './TransactionService.js';
import type { DB } from '../../db/index.js';

describe('PaymentMappingService', () => {
  let db: DB;
  let service: PaymentMappingService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let accountId: string;

  beforeEach(() => {
    db = createTestDb();
    service = new PaymentMappingService(db);
    accountService = new AccountService(db);
    transactionService = new TransactionService(db);
    accountId = accountService.create('Test Bank').id;
  });

  const txn = (description: string, paymentMethod: string | null, overrides: Record<string, unknown> = {}) => ({
    accountId,
    categoryId: null,
    amount: -50000,
    type: 'expense' as const,
    description,
    paymentMethod,
    details: null,
    reference: null,
    balance: null,
    date: '2025-01-15',
    ...overrides,
  });

  it('getAll() returns empty initially', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it('recalculate() with no transactions returns all zeros', () => {
    expect(service.recalculate()).toEqual({ updated: 0, conflicts: 0, noops: 0 });
  });

  it('recalculate() single payment method → preferred = that method, suggested = []', () => {
    transactionService.insert([
      txn('Netflix', 'כרטיס אשראי'),
      txn('Netflix', 'כרטיס אשראי', { date: '2025-01-16' }),
    ]);
    const result = service.recalculate();
    expect(result).toEqual({ updated: 1, conflicts: 0, noops: 0 });
    const all = service.getAll();
    expect(all[0]!.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(all[0]!.suggestedPaymentMethods).toEqual([]);
  });

  it('recalculate() 3 credit + 1 cash → preferred = credit (most frequent), suggested = [cash]', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי', { date: '2025-01-13' }),
      txn('Superpharm', 'כרטיס אשראי', { date: '2025-01-14' }),
      txn('Superpharm', 'כרטיס אשראי', { date: '2025-01-15' }),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    const result = service.recalculate();
    expect(result).toEqual({ updated: 1, conflicts: 0, noops: 0 });
    const all = service.getAll();
    expect(all[0]!.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(all[0]!.suggestedPaymentMethods).toEqual(['מזומן']);
  });

  it('recalculate() tied methods → preferred = null, suggested = both', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי'),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    const result = service.recalculate();
    expect(result).toEqual({ updated: 0, conflicts: 1, noops: 0 });
    const all = service.getAll();
    expect(all[0]!.preferredPaymentMethod).toBeNull();
    expect(all[0]!.suggestedPaymentMethods).toHaveLength(2);
  });

  it('recalculate() called twice with no changes → noops on second call', () => {
    transactionService.insert([txn('Netflix', 'כרטיס אשראי')]);
    service.recalculate();
    const second = service.recalculate();
    expect(second.noops).toBe(1);
    expect(second.updated).toBe(0);
  });

  it('setPreferred() creates a clean mapping', () => {
    const m = service.setPreferred('Test Bank', 'Netflix', 'כרטיס אשראי');
    expect(m.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(m.suggestedPaymentMethods).toEqual([]);
  });

  it('setPreferred() resolves a tie — old preferred moves to suggested', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי'),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    service.recalculate(); // tie
    const m = service.setPreferred('Test Bank', 'Superpharm', 'כרטיס אשראי');
    expect(m.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(m.suggestedPaymentMethods).toContain('מזומן');
  });

  it('getMappingFor() returns null for unknown (account, description)', () => {
    expect(service.getMappingFor('Test Bank', 'Unknown')).toBeNull();
  });

  it('getMappingFor() returns preferred for clean row', () => {
    service.setPreferred('Test Bank', 'Netflix', 'כרטיס אשראי');
    const m = service.getMappingFor('Test Bank', 'Netflix');
    expect(m!.preferred).toBe('כרטיס אשראי');
  });

  it('getMappingFor() returns null preferred for tie row', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי'),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    service.recalculate();
    expect(service.getMappingFor('Test Bank', 'Superpharm')!.preferred).toBeNull();
  });

  it('deleteMapping() removes the entry', () => {
    service.setPreferred('Test Bank', 'Netflix', 'כרטיס אשראי');
    service.deleteMapping('Test Bank', 'Netflix');
    expect(service.getAll()).toHaveLength(0);
  });
});
