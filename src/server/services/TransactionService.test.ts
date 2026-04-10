import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { TransactionService } from './TransactionService.js';
import { AccountService } from './AccountService.js';
import { CategoryService } from './CategoryService.js';

describe('TransactionService', () => {
  let service: TransactionService;
  let accountService: AccountService;
  let categoryService: CategoryService;
  let accountId: string;

  beforeEach(() => {
    const db = createTestDb();
    service = new TransactionService(db);
    accountService = new AccountService(db);
    categoryService = new CategoryService(db);
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

  it('inserts transactions and returns ids', () => {
    const ids = service.insert([txn(), txn({ date: '2025-01-16', reference: '124' })]);
    expect(ids).toHaveLength(2);
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

  it('list with excludeCategories keeps uncategorized transactions visible', () => {
    const categoryId = categoryService.findOrCreate('Food', 'expense').id;
    service.insert([
      txn({ categoryId: null }),                     // uncategorized — must remain visible
      txn({ date: '2025-01-16', reference: '124', categoryId }), // categorized — must be excluded
    ]);
    const result = service.list({ excludeCategories: [categoryId] });
    expect(result.total).toBe(1);
    expect(result.transactions[0].categoryId).toBeNull();
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

  it('findDuplicates returns confirmed for exact 4-field match', () => {
    service.insert([txn()]);
    const dupes = service.findDuplicates(accountId, [txn()]);
    expect(dupes).toEqual([{ status: 'confirmed' }]);
  });

  it('findDuplicates returns probable when date+amount+reference match but description differs', () => {
    service.insert([txn({ description: 'Original description' })]);
    const dupes = service.findDuplicates(accountId, [
      txn({ description: 'Different description (bidi variant)' }),
    ]);
    expect(dupes).toEqual([{ status: 'probable', existingDescription: 'Original description' }]);
  });

  it('findDuplicates returns none for genuinely new row', () => {
    service.insert([txn()]);
    const dupes = service.findDuplicates(accountId, [
      txn({ date: '2025-01-16', reference: '124' }),
    ]);
    expect(dupes).toEqual([{ status: 'none' }]);
  });

  it('findDuplicates does not flag probable when reference is null', () => {
    service.insert([txn({ reference: null })]);
    const dupes = service.findDuplicates(accountId, [
      txn({ reference: null, description: 'Different description' }),
    ]);
    expect(dupes).toEqual([{ status: 'none' }]);
  });

  it('findDuplicates handles mixed results correctly', () => {
    service.insert([txn(), txn({ date: '2025-01-16', reference: '124', description: 'Shop' })]);
    const dupes = service.findDuplicates(accountId, [
      txn(),                                                                     // confirmed
      txn({ date: '2025-01-16', reference: '124', description: 'Shop bidi' }), // probable
      txn({ date: '2025-01-17', reference: '125' }),                            // none
    ]);
    expect(dupes[0]).toEqual({ status: 'confirmed' });
    expect(dupes[1]).toEqual({ status: 'probable', existingDescription: 'Shop' });
    expect(dupes[2]).toEqual({ status: 'none' });
  });

  it('bulkSetCategory sets a category on a transaction', () => {
    const categoryId = categoryService.findOrCreate('Food', 'expense').id;
    const [id] = service.insert([txn()]);
    service.bulkSetCategory([{ id: id!, categoryId }]);
    const result = service.list();
    expect(result.transactions[0].categoryId).toBe(categoryId);
  });

  it('bulkSetCategory clears a category when categoryId is null', () => {
    const categoryId = categoryService.findOrCreate('Food', 'expense').id;
    const [id] = service.insert([txn({ categoryId })]);
    service.bulkSetCategory([{ id: id!, categoryId: null }]);
    const result = service.list();
    expect(result.transactions[0].categoryId).toBeNull();
  });

  it('bulkSetPaymentMethod updates payment_method on given rows', () => {
    const [id] = service.insert([txn({ paymentMethod: null })]);
    service.bulkSetPaymentMethod([{ id: id!, paymentMethod: 'כרטיס אשראי' }]);
    const txnResult = service.list().transactions.find(t => t.id === id);
    expect(txnResult?.paymentMethod).toBe('כרטיס אשראי');
  });

  it('fixDescription fixes visual-order Hebrew words and segment order', () => {
    // '\u202d34685693/\u202dםיסנניפ טיא סקמ'
    //   → strip bidi → '34685693/םיסנניפ טיא סקמ'
    //   → fix segment 'םיסנניפ טיא סקמ': reverse each Hebrew word + reverse word order → 'מקס איט פיננסים'
    //   → reverse segment order → 'מקס איט פיננסים/34685693'
    const [id] = service.insert([txn({ description: '\u202d34685693/\u202dםיסנניפ טיא סקמ' })]);
    const updated = service.fixDescription(id!);
    expect(updated).not.toBeNull();
    expect(updated!.description).toBe('מקס איט פיננסים/34685693');
  });

  it('fixDescription returns null for unknown id', () => {
    expect(service.fixDescription('nonexistent')).toBeNull();
  });
});
