import { and, eq, gte, inArray, lte, notInArray, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { accounts, transactions } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { Account, AccountSummary, ImportStatusResponse, TransactionFilters } from '../../shared/types.js';

export class AccountService {
  constructor(private db: DB) {}

  getAll(): Account[] {
    return this.db.select().from(accounts).all() as Account[];
  }

  getById(id: string): Account | null {
    return (this.db.select().from(accounts).where(eq(accounts.id, id)).get() as Account) ?? null;
  }

  getByName(name: string): Account | null {
    return (this.db.select().from(accounts).where(eq(accounts.name, name)).get() as Account) ?? null;
  }

  create(name: string, type: string = 'checking'): Account {
    const account: Account = {
      id: nanoid(),
      name,
      type,
      currency: 'ILS',
      createdAt: Math.floor(Date.now() / 1000),
    };
    this.db.insert(accounts).values(account).run();
    return account;
  }

  findOrCreate(name: string, type: string = 'checking'): Account {
    return this.getByName(name) ?? this.create(name, type);
  }

  getSummaries(filters: TransactionFilters = {}): AccountSummary[] {
    const allAccounts = this.getAll();
    if (allAccounts.length === 0) return [];

    const conds = [];
    if (filters.accountIds?.length) conds.push(inArray(transactions.accountId, filters.accountIds));
    if (filters.startDate) conds.push(gte(transactions.date, filters.startDate));
    if (filters.endDate) conds.push(lte(transactions.date, filters.endDate));
    if (filters.excludeCategories?.length) conds.push(notInArray(transactions.categoryId, filters.excludeCategories));
    const where = conds.length > 0 ? and(...conds) : undefined;

    const rows = this.db.select({
      accountId: transactions.accountId,
      totalIncome: sql<number>`sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end)`,
      totalExpenses: sql<number>`sum(case when ${transactions.type} = 'expense' then abs(${transactions.amount}) else 0 end)`,
      transactionCount: sql<number>`count(*)`,
      latestDate: sql<string | null>`max(${transactions.date})`,
      latestBalance: sql<number | null>`(select ${transactions.balance} from ${transactions} t2 where t2.account_id = ${transactions.accountId} order by t2.date desc, t2.created_at desc limit 1)`,
    })
      .from(transactions)
      .where(where)
      .groupBy(transactions.accountId)
      .all();

    const statsMap = new Map(rows.map(r => [r.accountId, r]));

    const filtered = filters.accountIds?.length
      ? allAccounts.filter(a => filters.accountIds!.includes(a.id))
      : allAccounts;

    return filtered.map(a => {
      const s = statsMap.get(a.id);
      return {
        id: a.id,
        name: a.name,
        balance: s?.latestBalance ?? null,
        totalIncome: s?.totalIncome ?? 0,
        totalExpenses: s?.totalExpenses ?? 0,
        transactionCount: s?.transactionCount ?? 0,
        latestDate: s?.latestDate ?? null,
      };
    });
  }

  getImportStatus(): ImportStatusResponse {
    const rows = this.db.select({
      accountId: accounts.id,
      accountName: accounts.name,
      transactionCount: sql<number>`count(${transactions.id})`,
      latestDate: sql<string | null>`max(${transactions.date})`,
    })
      .from(accounts)
      .leftJoin(transactions, eq(transactions.accountId, accounts.id))
      .groupBy(accounts.id)
      .all();

    const accts = rows.map(r => ({
      accountId: r.accountId,
      accountName: r.accountName,
      transactionCount: r.transactionCount ?? 0,
      latestDate: r.latestDate ?? null,
    }));

    return {
      accounts: accts,
      totalTransactions: accts.reduce((s, a) => s + a.transactionCount, 0),
    };
  }

  deleteAll(): void {
    this.db.delete(accounts).run();
  }
}
