import dayjs from "dayjs";
import { accountService } from "./AccountService.js";
import type {
  GlobalFilters,
  OverviewResponse,
  OverviewSummary,
  AggregatedReportItem,
  GroupByOption,
} from "../types/index.js";

export class ReportService {
  getOverview(filters?: GlobalFilters): OverviewResponse {
    let accounts = accountService.getAllAccounts();

    // Apply account filter
    if (filters?.account_ids && filters.account_ids.length > 0) {
      accounts = accounts.filter((a) => filters.account_ids!.includes(a.id));
    }

    const accountSummaries = accounts.map((account) =>
      accountService.getAccountSummary(account, filters)
    );

    // Calculate overall summary
    const totalIncome = accountSummaries.reduce(
      (sum, s) => sum + s.total_income,
      0
    );
    const totalExpense = accountSummaries.reduce(
      (sum, s) => sum + s.total_expense,
      0
    );
    const totalCount = accountSummaries.reduce(
      (sum, s) => sum + s.transaction_count,
      0
    );

    const lastDates = accountSummaries
      .map((s) => s.last_transaction_date)
      .filter((d): d is number => d !== null);

    const lastDate = lastDates.length > 0 ? Math.max(...lastDates) : null;

    const overall: OverviewSummary = {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      last_transaction_date: lastDate,
      transaction_count: totalCount,
    };

    return {
      overall,
      accounts: accountSummaries,
    };
  }

  getAggregatedReport(
    groupBy: GroupByOption = "month",
    filters?: GlobalFilters
  ): AggregatedReportItem[] {
    const transactions = accountService.getTransactions(filters);

    // Group transactions
    const groups = new Map<
      string,
      { income: number; expense: number; count: number }
    >();

    for (const txn of transactions) {
      let period: string;

      if (groupBy === "month") {
        period = dayjs.unix(txn.date).format("YYYY-MM");
      } else if (groupBy === "year") {
        period = dayjs.unix(txn.date).format("YYYY");
      } else {
        // category
        period = txn.category;
      }

      const existing = groups.get(period) || {
        income: 0,
        expense: 0,
        count: 0,
      };
      existing.income += txn.income;
      existing.expense += txn.expense;
      existing.count += 1;
      groups.set(period, existing);
    }

    // Convert to result items
    const items: AggregatedReportItem[] = [];

    for (const [period, data] of groups) {
      items.push({
        period,
        income: data.income,
        expense: data.expense,
        net_balance: data.income - data.expense,
        transaction_count: data.count,
      });
    }

    // Sort by period
    if (groupBy === "month" || groupBy === "year") {
      items.sort((a, b) => b.period.localeCompare(a.period)); // Descending
    } else {
      items.sort((a, b) => a.period.localeCompare(b.period)); // Alphabetical
    }

    return items;
  }
}

export const reportService = new ReportService();
