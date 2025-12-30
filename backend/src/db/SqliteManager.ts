import Database from "better-sqlite3";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import { config } from "../config.js";

export class SqliteManager {
  private databases: Map<string, Database.Database> = new Map();
  private dbPath: string;

  constructor() {
    this.dbPath = config.dbPath;
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!existsSync(this.dbPath)) {
      mkdirSync(this.dbPath, { recursive: true });
    }
  }

  getDbFilePath(filename: string): string {
    return join(this.dbPath, filename);
  }

  openDatabase(filename: string): Database.Database {
    if (this.databases.has(filename)) {
      return this.databases.get(filename)!;
    }

    const dbPath = this.getDbFilePath(filename);
    const db = new Database(dbPath);
    this.databases.set(filename, db);
    return db;
  }

  closeDatabase(filename: string): void {
    const db = this.databases.get(filename);
    if (db) {
      db.close();
      this.databases.delete(filename);
    }
  }

  closeAllDatabases(): void {
    for (const db of this.databases.values()) {
      db.close();
    }
    this.databases.clear();
  }

  deleteDatabase(filename: string): void {
    this.closeDatabase(filename);
    const dbPath = this.getDbFilePath(filename);
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  }

  databaseExists(filename: string): boolean {
    const dbPath = this.getDbFilePath(filename);
    return existsSync(dbPath);
  }

  getDatabase(filename: string): Database.Database | undefined {
    return this.databases.get(filename);
  }

  query<T>(db: Database.Database, sql: string, params: unknown[] = []): T[] {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  queryOne<T>(
    db: Database.Database,
    sql: string,
    params: unknown[] = []
  ): T | null {
    const stmt = db.prepare(sql);
    return (stmt.get(...params) as T) ?? null;
  }

  execute(db: Database.Database, sql: string, params: unknown[] = []): void {
    const stmt = db.prepare(sql);
    stmt.run(...params);
  }
}

export const sqliteManager = new SqliteManager();
