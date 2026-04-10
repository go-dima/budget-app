import { and, eq, gte, lte, inArray, notInArray, sql } from 'drizzle-orm';
import { transactions, categories } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type {
  TransactionFilters, MonthlyTrendItem, TopCategoryItem,
  MonthlyReportRow, YearlyReportRow, CategoryReportRow, MonthDetailRow,
} from '../../shared/types.js';

export class ReportService {
  constructor(private db: DB) {}

  private buildWhere(filters: TransactionFilters) {
    const conds = [];
    if (filters.accountIds?.length) conds.push(inArray(transactions.accountId, filters.accountIds));
    if (filters.categoryIds?.length) conds.push(inArray(transactions.categoryId, filters.categoryIds));
    if (filters.excludeCategories?.length) conds.push(notInArray(transactions.categoryId, filters.excludeCategories));
    if (filters.startDate) conds.push(gte(transactions.date, filters.startDate));
    if (filters.endDate) conds.push(lte(transactions.date, filters.endDate));
    return conds.length > 0 ? and(...conds) : undefined;
  }

  getMonthlyTrend(filters: TransactionFilters = {}): MonthlyTrendItem[] {
    const where = this.buildWhere(filters);
    const rows = this.db.select({
      month: sql<string>`substr(${transactions.date}, 1, 7)`,
      income: sql<number>`sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end)`,
      expenses: sql<number>`sum(case when ${transactions.type} = 'expense' then abs(${transactions.amount}) else 0 end)`,
    })
      .from(transactions)
      .where(where)
      .groupBy(sql`substr(${transactions.date}, 1, 7)`)
      .orderBy(sql`substr(${transactions.date}, 1, 7)`)
      .all();
    return rows.map(r => ({ month: r.month, income: r.income ?? 0, expenses: r.expenses ?? 0 }));
  }

  getTopCategories(filters: TransactionFilters = {}, limit = 10): TopCategoryItem[] {
    const where = and(this.buildWhere(filters), eq(transactions.type, 'expense'));
    const rows = this.db.select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      total: sql<number>`sum(abs(${transactions.amount}))`,
      count: sql<number>`count(*)`,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where)
      .groupBy(transactions.categoryId)
      .orderBy(sql`sum(abs(${transactions.amount})) desc`)
      .limit(limit)
      .all();

    const grandTotal = rows.reduce((s, r) => s + (r.total ?? 0), 0);
    return rows.map(r => ({
      categoryId: r.categoryId ?? '',
      categoryName: r.categoryName ?? 'Uncategorized',
      total: r.total ?? 0,
      percentage: grandTotal > 0 ? Math.round(((r.total ?? 0) / grandTotal) * 100) : 0,
      count: r.count ?? 0,
    }));
  }

  getByMonth(filters: TransactionFilters = {}): MonthlyReportRow[] {
    const trend = this.getMonthlyTrend(filters);
    // For each month, find top category
    return trend.map(({ month, income, expenses }) => {
      const topCatRows = this.getMonthDetail(month, filters);
      const topCategory = topCatRows[0]?.categoryName ?? null;
      return { month, income, expenses, net: income - expenses, topCategory };
    }).sort((a, b) => b.month.localeCompare(a.month));
  }

  getByYear(filters: TransactionFilters = {}): YearlyReportRow[] {
    const where = this.buildWhere(filters);
    const rows = this.db.select({
      year: sql<string>`substr(${transactions.date}, 1, 4)`,
      income: sql<number>`sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end)`,
      expenses: sql<number>`sum(case when ${transactions.type} = 'expense' then abs(${transactions.amount}) else 0 end)`,
      months: sql<number>`count(distinct substr(${transactions.date}, 1, 7))`,
    })
      .from(transactions)
      .where(where)
      .groupBy(sql`substr(${transactions.date}, 1, 4)`)
      .orderBy(sql`substr(${transactions.date}, 1, 4) desc`)
      .all();

    return rows.map(r => ({
      year: r.year,
      income: r.income ?? 0,
      expenses: r.expenses ?? 0,
      net: (r.income ?? 0) - (r.expenses ?? 0),
      avgMonthly: r.months > 0 ? Math.round((r.expenses ?? 0) / r.months) : 0,
    }));
  }

  getByCategory(filters: TransactionFilters = {}): CategoryReportRow[] {
    const where = and(this.buildWhere(filters), eq(transactions.type, 'expense'));
    const rows = this.db.select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      total: sql<number>`sum(abs(${transactions.amount}))`,
      count: sql<number>`count(*)`,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where)
      .groupBy(transactions.categoryId)
      .orderBy(sql`sum(abs(${transactions.amount})) desc`)
      .all();

    const grandTotal = rows.reduce((s, r) => s + (r.total ?? 0), 0);
    return rows.map(r => ({
      categoryId: r.categoryId ?? '',
      categoryName: r.categoryName ?? 'Uncategorized',
      total: r.total ?? 0,
      percentage: grandTotal > 0 ? Math.round(((r.total ?? 0) / grandTotal) * 100) : 0,
      count: r.count ?? 0,
      avgTransaction: (r.count ?? 0) > 0 ? Math.round((r.total ?? 0) / (r.count ?? 1)) : 0,
    }));
  }

  getMonthDetail(month: string, filters: TransactionFilters = {}): MonthDetailRow[] {
    const monthFilters: TransactionFilters = {
      ...filters,
      startDate: `${month}-01`,
      endDate: `${month}-31`,
    };
    const where = and(this.buildWhere(monthFilters), eq(transactions.type, 'expense'));
    const rows = this.db.select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      amount: sql<number>`sum(abs(${transactions.amount}))`,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where)
      .groupBy(transactions.categoryId)
      .orderBy(sql`sum(abs(${transactions.amount})) desc`)
      .all();

    const grandTotal = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
    return rows.map(r => ({
      categoryId: r.categoryId ?? '',
      categoryName: r.categoryName ?? 'Uncategorized',
      amount: r.amount ?? 0,
      percentage: grandTotal > 0 ? Math.round(((r.amount ?? 0) / grandTotal) * 100) : 0,
    }));
  }

  getYearDetail(year: string, filters: TransactionFilters = {}): MonthlyReportRow[] {
    return this.getByMonth({ ...filters, startDate: `${year}-01-01`, endDate: `${year}-12-31` });
  }
}
