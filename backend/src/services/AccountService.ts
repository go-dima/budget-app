import { v4 as uuidv4 } from "uuid";
import { basename } from "path";
import {
  sqliteManager,
  accountRepository,
  transactionRepository,
} from "../db/index.js";
import type {
  Account,
  AccountSummary,
  GlobalFilters,
  DbInfo,
  TransactionCreate,
  TransactionRecord,
} from "../types/index.js";

export class AccountService {
  initialize(): void {
    accountRepository.initialize();
  }

  private sanitizeDbName(name: string): string {
    return name.replace(/[^a-zA-Z0-9\u0590-\u05FF_-]/g, "_");
  }

  createAccount(name: string, dbName?: string): Account {
    const accountId = uuidv4();
    const safeName = this.sanitizeDbName(dbName || name);
    const dbFilename = `${safeName}.db`;
    const dbPath = sqliteManager.getDbFilePath(dbFilename);
    const createdAt = new Date().toISOString();

    // Initialize the account's transaction database
    transactionRepository.initializeAccountDb(dbFilename);

    // Create account record
    accountRepository.create({
      id: accountId,
      name,
      db_path: dbPath,
      created_at: createdAt,
    });

    return {
      id: accountId,
      name,
      db_path: dbPath,
      transaction_count: 0,
      last_transaction_date: null,
      created_at: createdAt,
    };
  }

  getAccount(accountId: string): Account | null {
    const record = accountRepository.getById(accountId);
    if (!record) return null;

    const dbFilename = basename(record.db_path);
    const stats = accountRepository.getAccountStats(dbFilename);

    return {
      ...record,
      transaction_count: stats.count,
      last_transaction_date: stats.lastDate,
    };
  }

  getAccountByName(name: string): Account | null {
    const record = accountRepository.getByName(name);
    if (!record) return null;

    const dbFilename = basename(record.db_path);
    const stats = accountRepository.getAccountStats(dbFilename);

    return {
      ...record,
      transaction_count: stats.count,
      last_transaction_date: stats.lastDate,
    };
  }

  getAccountByDbPath(dbName: string): Account | null {
    const safeName = this.sanitizeDbName(dbName);
    const dbFilename = `${safeName}.db`;
    const dbPath = sqliteManager.getDbFilePath(dbFilename);

    const record = accountRepository.getByDbPath(dbPath);
    if (!record) return null;

    const stats = accountRepository.getAccountStats(dbFilename);

    return {
      ...record,
      transaction_count: stats.count,
      last_transaction_date: stats.lastDate,
    };
  }

  getAllAccounts(): Account[] {
    const records = accountRepository.getAll();

    return records.map((record) => {
      const dbFilename = basename(record.db_path);
      const stats = accountRepository.getAccountStats(dbFilename);

      return {
        ...record,
        transaction_count: stats.count,
        last_transaction_date: stats.lastDate,
      };
    });
  }

  insertTransactions(
    accountId: string,
    transactions: TransactionCreate[]
  ): number {
    const account = this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const dbFilename = basename(account.db_path);
    const createdAt = new Date().toISOString();

    const items = transactions.map((txn) => ({
      id: uuidv4(),
      txn,
      createdAt,
    }));

    transactionRepository.insertMany(dbFilename, items);

    return transactions.length;
  }

  getTransactions(filters?: GlobalFilters): (TransactionRecord & { account_id: string })[] {
    const accounts = this.getAllAccounts();
    const allTransactions: (TransactionRecord & { account_id: string })[] = [];

    for (const account of accounts) {
      if (
        filters?.account_ids &&
        filters.account_ids.length > 0 &&
        !filters.account_ids.includes(account.id)
      ) {
        continue;
      }

      const dbFilename = basename(account.db_path);
      const txns = transactionRepository.getAll(dbFilename, account.id, filters);

      for (const txn of txns) {
        allTransactions.push({
          ...txn,
          account_id: account.id,
        });
      }
    }

    // Sort by date descending
    allTransactions.sort((a, b) => b.date - a.date);

    return allTransactions;
  }

  getAccountTransactions(
    account: Account,
    filters?: GlobalFilters
  ): (TransactionRecord & { account_id: string })[] {
    const dbFilename = basename(account.db_path);
    const txns = transactionRepository.getAll(dbFilename, account.id, filters);

    return txns.map((txn) => ({
      ...txn,
      account_id: account.id,
    }));
  }

  getAllCategories(): string[] {
    const accounts = this.getAllAccounts();
    const categories = new Set<string>();

    for (const account of accounts) {
      const dbFilename = basename(account.db_path);
      const accountCategories = transactionRepository.getCategories(dbFilename);
      accountCategories.forEach((cat) => categories.add(cat));
    }

    return Array.from(categories).sort();
  }

  getAccountSummary(account: Account, filters?: GlobalFilters): AccountSummary {
    const txns = this.getAccountTransactions(account, filters);

    const totalIncome = txns.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = txns.reduce((sum, t) => sum + t.expense, 0);
    const lastDate =
      txns.length > 0
        ? Math.max(...txns.map((t) => t.date))
        : null;

    return {
      account_id: account.id,
      account_name: account.name,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      last_transaction_date: lastDate,
      transaction_count: txns.length,
    };
  }

  clearAccountTransactions(accountId: string): void {
    const account = this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const dbFilename = basename(account.db_path);
    transactionRepository.clearAll(dbFilename);
  }

  deleteAccount(accountId: string): boolean {
    const account = this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const dbFilename = basename(account.db_path);

    // Delete the database file
    sqliteManager.deleteDatabase(dbFilename);

    // Remove from accounts table
    accountRepository.delete(accountId);

    return true;
  }

  getDatabaseInfo(): DbInfo[] {
    const accounts = this.getAllAccounts();

    return accounts.map((acc) => ({
      account_id: acc.id,
      account_name: acc.name,
      db_path: acc.db_path,
      transaction_count: acc.transaction_count,
      last_transaction_date: acc.last_transaction_date,
    }));
  }

  /**
   * Register an existing database file as an account
   * Used when importing a .db file directly
   */
  registerExistingDatabase(name: string, dbFilename: string): Account {
    const accountId = uuidv4();
    const dbPath = sqliteManager.getDbFilePath(dbFilename);
    const createdAt = new Date().toISOString();

    // Create account record (database file already exists)
    accountRepository.create({
      id: accountId,
      name,
      db_path: dbPath,
      created_at: createdAt,
    });

    const stats = accountRepository.getAccountStats(dbFilename);

    return {
      id: accountId,
      name,
      db_path: dbPath,
      transaction_count: stats.count,
      last_transaction_date: stats.lastDate,
      created_at: createdAt,
    };
  }
}

export const accountService = new AccountService();
