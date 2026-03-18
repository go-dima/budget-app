import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { ReportService } from './ReportService.js';
import { AccountService } from './AccountService.js';
import { CategoryService } from './CategoryService.js';
import { TransactionService } from './TransactionService.js';
import type { DB } from '../../db/index.js';

function seedData(db: DB) {
  const accountSvc = new AccountService(db);
  const categorySvc = new CategoryService(db);
  const txnSvc = new TransactionService(db);

  const account = accountSvc.create('Test Bank');
  const food = categorySvc.findOrCreate('מזון', 'expense');
  const rent = categorySvc.findOrCreate('שכירות', 'expense');

  txnSvc.insert([
    { accountId: account.id, categoryId: food.id, amount: -30000, type: 'expense', description: 'Supermarket', paymentMethod: null, details: null, reference: '1', balance: null, date: '2025-01-10' },
    { accountId: account.id, categoryId: rent.id, amount: -500000, type: 'expense', description: 'Rent', paymentMethod: null, details: null, reference: '2', balance: null, date: '2025-01-01' },
    { accountId: account.id, categoryId: null, amount: 1000000, type: 'income', description: 'Salary', paymentMethod: null, details: null, reference: '3', balance: null, date: '2025-01-05' },
    { accountId: account.id, categoryId: food.id, amount: -20000, type: 'expense', description: 'Restaurant', paymentMethod: null, details: null, reference: '4', balance: null, date: '2025-02-15' },
  ]);

  return { accountId: account.id, foodId: food.id, rentId: rent.id };
}

describe('ReportService', () => {
  let service: ReportService;
  let ids: ReturnType<typeof seedData>;

  beforeEach(() => {
    const db = createTestDb();
    service = new ReportService(db);
    ids = seedData(db);
  });

  it('getMonthlyTrend returns income and expenses per month', () => {
    const trend = service.getMonthlyTrend();
    expect(trend).toHaveLength(2);
    const jan = trend.find(t => t.month === '2025-01')!;
    expect(jan.income).toBe(1000000);
    expect(jan.expenses).toBe(530000);
  });

  it('getTopCategories returns top expense categories', () => {
    const top = service.getTopCategories();
    expect(top[0].categoryId).toBe(ids.rentId);
    expect(top[0].total).toBe(500000);
  });

  it('getByYear aggregates correctly', () => {
    const yearly = service.getByYear();
    expect(yearly).toHaveLength(1);
    expect(yearly[0].year).toBe('2025');
    expect(yearly[0].income).toBe(1000000);
    expect(yearly[0].expenses).toBe(550000);
  });

  it('getByCategory shows percentage breakdown', () => {
    const cats = service.getByCategory();
    expect(cats[0].categoryName).toBe('שכירות');
    const total = cats.reduce((s, c) => s + c.total, 0);
    expect(cats[0].percentage).toBe(Math.round(500000 / total * 100));
  });
});
