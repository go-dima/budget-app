import { and, eq, gte, lte, like, inArray, notInArray, isNull, or, desc, asc, sql, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { transactions, accounts, categories } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { Transaction, TransactionFilters, TransactionsResponse } from '../../shared/types.js';
import { fixBidiVisualOrderForce } from '../../shared/bidiUtils.js';

export type DupeStatus =
  | { status: 'none' }
  | { status: 'confirmed' }
  | { status: 'probable'; existingDescription: string }

export interface InsertTransaction {
  accountId: string;
  categoryId: string | null;
  amount: number;  // agorot, signed
  type: 'income' | 'expense' | 'transfer';
  description: string;
  paymentMethod: string | null;
  details: string | null;
  reference: string | null;
  balance: number | null;
  date: string;  // YYYY-MM-DD
}

export class TransactionService {
  constructor(private db: DB) {}

  insert(rows: InsertTransaction[]): string[] {
    if (rows.length === 0) return [];
    const now = Math.floor(Date.now() / 1000);
    const values = rows.map(r => ({ ...r, id: nanoid(), createdAt: now }));
    this.db.insert(transactions).values(values).run();
    return values.map(v => v.id);
  }

  /**
   * Classifies each incoming row against existing transactions in the account.
   *
   * - 'confirmed': all four fields match (date, amount, description, reference) → auto-skip
   * - 'probable':  date, amount, and a non-empty reference match but description differs → surface to user
   * - 'none':      no match
   */
  findDuplicates(accountId: string, rows: InsertTransaction[]): DupeStatus[] {
    if (rows.length === 0) return [];
    const existing = this.db.select({
      date: transactions.date,
      amount: transactions.amount,
      description: transactions.description,
      reference: transactions.reference,
    }).from(transactions).where(eq(transactions.accountId, accountId)).all();

    const confirmedSet = new Set(
      existing.map(r => `${r.date}|${r.amount}|${r.description}|${r.reference ?? ''}`)
    );

    // probable map: 3-field key → existing description (only when reference is present)
    const probableMap = new Map<string, string>();
    for (const r of existing) {
      if (r.reference) {
        probableMap.set(`${r.date}|${r.amount}|${r.reference}`, r.description);
      }
    }

    return rows.map(r => {
      if (confirmedSet.has(`${r.date}|${r.amount}|${r.description}|${r.reference ?? ''}`)) {
        return { status: 'confirmed' } as DupeStatus;
      }
      if (r.reference) {
        const existingDescription = probableMap.get(`${r.date}|${r.amount}|${r.reference}`);
        if (existingDescription !== undefined) {
          return { status: 'probable', existingDescription } as DupeStatus;
        }
      }
      return { status: 'none' } as DupeStatus;
    });
  }

  list(filters: TransactionFilters = {}): TransactionsResponse {
    const {
      accountIds, categoryIds, startDate, endDate, type, excludeCategories,
      search, paymentMethods, amountMin, amountMax, sortBy = 'date', sortOrder = 'desc', page = 1, pageSize = 50,
    } = filters;

    const conditions = [];
    if (accountIds?.length) conditions.push(inArray(transactions.accountId, accountIds));
    if (categoryIds?.length) conditions.push(inArray(transactions.categoryId, categoryIds));
    if (excludeCategories?.length) conditions.push(or(isNull(transactions.categoryId), notInArray(transactions.categoryId, excludeCategories))!);
    if (startDate) conditions.push(gte(transactions.date, startDate));
    if (endDate) conditions.push(lte(transactions.date, endDate));
    if (type && type !== 'all') conditions.push(eq(transactions.type, type));
    if (search) conditions.push(like(transactions.description, `%${search}%`));
    if (paymentMethods?.length) conditions.push(inArray(transactions.paymentMethod, paymentMethods));
    if (amountMin != null) conditions.push(gte(sql`abs(${transactions.amount})`, amountMin));
    if (amountMax != null) conditions.push(lte(sql`abs(${transactions.amount})`, amountMax));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Totals for the full filtered set
    const totalsResult = this.db
      .select({
        totalIncome: sql<number>`sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end)`,
        totalExpenses: sql<number>`sum(case when ${transactions.type} = 'expense' then abs(${transactions.amount}) else 0 end)`,
        total: count(),
      })
      .from(transactions)
      .where(where)
      .get()!;

    const total = totalsResult.total ?? 0;
    const totalIncome = totalsResult.totalIncome ?? 0;
    const totalExpenses = totalsResult.totalExpenses ?? 0;

    // Sort
    const sortCol = sortBy === 'date' ? transactions.date
      : sortBy === 'amount' ? transactions.amount
      : sortBy === 'category' ? transactions.categoryId
      : transactions.accountId;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const rows = this.db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        accountName: accounts.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        paymentMethod: transactions.paymentMethod,
        details: transactions.details,
        reference: transactions.reference,
        balance: transactions.balance,
        date: transactions.date,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all() as Transaction[];

    return { transactions: rows, total, totalIncome, totalExpenses };
  }

  bulkSetCategory(updates: { id: string; categoryId: string | null }[]): void {
    for (const update of updates) {
      this.db.update(transactions).set({ categoryId: update.categoryId }).where(eq(transactions.id, update.id)).run();
    }
  }

  bulkDelete(ids: string[]): void {
    if (ids.length === 0) return;
    this.db.delete(transactions).where(inArray(transactions.id, ids)).run();
  }

  bulkSetPaymentMethod(updates: { id: string; paymentMethod: string }[]): void {
    for (const u of updates) {
      this.db.update(transactions).set({ paymentMethod: u.paymentMethod }).where(eq(transactions.id, u.id)).run();
    }
  }

  deleteByAccountId(accountId: string): void {
    this.db.delete(transactions).where(eq(transactions.accountId, accountId)).run();
  }

  deleteAll(): void {
    this.db.delete(transactions).run();
  }

  fixDescription(id: string): Transaction | null {
    const row = this.db
      .select({ id: transactions.id, description: transactions.description })
      .from(transactions)
      .where(eq(transactions.id, id))
      .get();
    if (!row) return null;
    const fixed = fixBidiVisualOrderForce(row.description);
    this.db.update(transactions).set({ description: fixed }).where(eq(transactions.id, id)).run();
    return this.db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        accountName: accounts.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        paymentMethod: transactions.paymentMethod,
        details: transactions.details,
        reference: transactions.reference,
        balance: transactions.balance,
        date: transactions.date,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id))
      .get() as Transaction ?? null;
  }
}
