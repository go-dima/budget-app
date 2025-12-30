import { sqliteManager } from "../SqliteManager.js";
import type {
  TransactionRecord,
  TransactionCreate,
  GlobalFilters,
} from "../../types/index.js";

export class TransactionRepository {
  initializeAccountDb(dbFilename: string): void {
    const db = sqliteManager.openDatabase(dbFilename);

    sqliteManager.execute(
      db,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date INTEGER NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT,
        category TEXT NOT NULL,
        details TEXT,
        reference TEXT,
        expense REAL DEFAULT 0,
        income REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        raw_date_string TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    );

    sqliteManager.execute(
      db,
      "CREATE INDEX IF NOT EXISTS idx_date ON transactions(date)"
    );
    sqliteManager.execute(
      db,
      "CREATE INDEX IF NOT EXISTS idx_category ON transactions(category)"
    );
  }

  insert(
    dbFilename: string,
    id: string,
    txn: TransactionCreate,
    createdAt: string
  ): void {
    const db = sqliteManager.openDatabase(dbFilename);

    sqliteManager.execute(
      db,
      `INSERT INTO transactions
       (id, date, description, payment_method, category, details,
        reference, expense, income, balance, raw_date_string, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        txn.date,
        txn.description,
        txn.payment_method ?? null,
        txn.category,
        txn.details ?? null,
        txn.reference ?? null,
        txn.expense ?? 0,
        txn.income ?? 0,
        txn.balance ?? 0,
        txn.raw_date_string,
        createdAt,
      ]
    );
  }

  insertMany(
    dbFilename: string,
    transactions: Array<{
      id: string;
      txn: TransactionCreate;
      createdAt: string;
    }>
  ): void {
    const db = sqliteManager.openDatabase(dbFilename);

    const stmt = db.prepare(
      `INSERT INTO transactions
       (id, date, description, payment_method, category, details,
        reference, expense, income, balance, raw_date_string, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertMany = db.transaction(
      (
        items: Array<{ id: string; txn: TransactionCreate; createdAt: string }>
      ) => {
        for (const { id, txn, createdAt } of items) {
          stmt.run(
            id,
            txn.date,
            txn.description,
            txn.payment_method ?? null,
            txn.category,
            txn.details ?? null,
            txn.reference ?? null,
            txn.expense ?? 0,
            txn.income ?? 0,
            txn.balance ?? 0,
            txn.raw_date_string,
            createdAt
          );
        }
      }
    );

    insertMany(transactions);
  }

  getAll(
    dbFilename: string,
    accountId: string,
    filters?: GlobalFilters
  ): TransactionRecord[] {
    if (!sqliteManager.databaseExists(dbFilename)) {
      return [];
    }

    const db = sqliteManager.openDatabase(dbFilename);

    let query = "SELECT * FROM transactions WHERE 1=1";
    const params: unknown[] = [];

    if (filters) {
      if (filters.category_names && filters.category_names.length > 0) {
        const placeholders = filters.category_names.map(() => "?").join(",");
        query += ` AND category IN (${placeholders})`;
        params.push(...filters.category_names);
      }

      if (filters.date_from != null) {
        query += " AND date >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to != null) {
        query += " AND date <= ?";
        params.push(filters.date_to);
      }
    }

    query += " ORDER BY date DESC";

    return sqliteManager.query<TransactionRecord>(db, query, params);
  }

  getCategories(dbFilename: string): string[] {
    if (!sqliteManager.databaseExists(dbFilename)) {
      return [];
    }

    const db = sqliteManager.openDatabase(dbFilename);

    const rows = sqliteManager.query<{ category: string }>(
      db,
      "SELECT DISTINCT category FROM transactions"
    );

    return rows.map((r) => r.category);
  }

  clearAll(dbFilename: string): void {
    const db = sqliteManager.openDatabase(dbFilename);
    sqliteManager.execute(db, "DELETE FROM transactions");
  }
}

export const transactionRepository = new TransactionRepository();
