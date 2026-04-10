import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';

// Resolve migrations path relative to this file, not CWD
const __dirname = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_PATH = `${__dirname}/migrations`;

/** Open a SQLite DB file, run migrations, return both the drizzle handle and the raw sqlite instance. */
export function openDb(dbPath: string) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  return { db, sqlite };
}

export type DB = ReturnType<typeof openDb>['db'];

/** Create an in-memory DB for tests */
export function createTestDb(): DB {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_PATH });
  return db;
}
