import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { TransactionService } from './TransactionService.js';
import { AccountService } from './AccountService.js';

describe('TransactionService', () => {
  let service: TransactionService;
  let accountService: AccountService;
  let accountId: string;

  beforeEach(() => {
    const db = createTestDb();
    service = new TransactionService(db);
    accountService = new AccountService(db);
    accountId = accountService.create('Test Bank').id;
  });

  const txn = (overrides = {}) => ({
    accountId,
    categoryId: null,
    amount: -50000,
    type: 'expense' as const,
    description: 'Supermarket',
    paymentMethod: null,
    details: null,
    reference: '123',
    balance: null,
    date: '2025-01-15',
    ...overrides,
  });

  it('inserts transactions and returns count', () => {
    const n = service.insert([txn(), txn({ date: '2025-01-16', reference: '124' })]);
    expect(n).toBe(2);
  });

  it('list returns all transactions with pagination', () => {
    service.insert([txn(), txn({ date: '2025-01-16', reference: '124' })]);
    const result = service.list();
    expect(result.total).toBe(2);
    expect(result.transactions).toHaveLength(2);
  });

  it('list filters by date range', () => {
    service.insert([txn({ date: '2025-01-10' }), txn({ date: '2025-02-10', reference: '124' })]);
    const result = service.list({ startDate: '2025-02-01', endDate: '2025-02-28' });
    expect(result.total).toBe(1);
    expect(result.transactions[0].date).toBe('2025-02-10');
  });

  it('list calculates totalIncome and totalExpenses', () => {
    service.insert([
      txn({ amount: -50000, type: 'expense' }),
      txn({ date: '2025-01-16', reference: '124', amount: 100000, type: 'income' }),
    ]);
    const result = service.list();
    expect(result.totalExpenses).toBe(50000);
    expect(result.totalIncome).toBe(100000);
  });

  it('findDuplicates identifies duplicates by date+amount+description+reference', () => {
    service.insert([txn()]);
    const dupes = service.findDuplicates(accountId, [
      txn(), // duplicate
      txn({ date: '2025-01-16', reference: '124' }), // new
    ]);
    expect(dupes).toEqual([true, false]);
  });
});
