import { sqliteManager } from "../SqliteManager.js";
import type { AccountRecord } from "../../types/index.js";

const ACCOUNTS_DB = "accounts.db";

export class AccountRepository {
  initialize(): void {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    sqliteManager.execute(
      db,
      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        db_path TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    );
  }

  create(account: AccountRecord): void {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    sqliteManager.execute(
      db,
      `INSERT INTO accounts (id, name, db_path, created_at)
       VALUES (?, ?, ?, ?)`,
      [account.id, account.name, account.db_path, account.created_at]
    );
  }

  getById(id: string): AccountRecord | null {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    return sqliteManager.queryOne<AccountRecord>(
      db,
      "SELECT * FROM accounts WHERE id = ?",
      [id]
    );
  }

  getByName(name: string): AccountRecord | null {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    return sqliteManager.queryOne<AccountRecord>(
      db,
      "SELECT * FROM accounts WHERE name = ?",
      [name]
    );
  }

  getByDbPath(dbPath: string): AccountRecord | null {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    return sqliteManager.queryOne<AccountRecord>(
      db,
      "SELECT * FROM accounts WHERE db_path = ?",
      [dbPath]
    );
  }

  getAll(): AccountRecord[] {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    return sqliteManager.query<AccountRecord>(
      db,
      "SELECT * FROM accounts ORDER BY name"
    );
  }

  delete(id: string): void {
    const db = sqliteManager.openDatabase(ACCOUNTS_DB);

    sqliteManager.execute(db, "DELETE FROM accounts WHERE id = ?", [id]);
  }

  getAccountStats(
    dbFilename: string
  ): { count: number; lastDate: number | null } {
    if (!sqliteManager.databaseExists(dbFilename)) {
      return { count: 0, lastDate: null };
    }

    const db = sqliteManager.openDatabase(dbFilename);

    const countResult = sqliteManager.queryOne<{ count: number }>(
      db,
      "SELECT COUNT(*) as count FROM transactions"
    );

    const lastDateResult = sqliteManager.queryOne<{ lastDate: number | null }>(
      db,
      "SELECT MAX(date) as lastDate FROM transactions"
    );

    return {
      count: countResult?.count ?? 0,
      lastDate: lastDateResult?.lastDate ?? null,
    };
  }
}

export const accountRepository = new AccountRepository();
