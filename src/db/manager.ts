import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { openDb } from './index.js';
import type { DB } from './index.js';
import type Database from 'better-sqlite3';

const DATA_DIR = resolve(process.env.DATA_DIR || './data');
const ACTIVE_FILE = join(DATA_DIR, '.active-db');
const DEFAULT_DB = join(DATA_DIR, 'budget.db');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadActivePath(): string {
  ensureDataDir();
  if (existsSync(ACTIVE_FILE)) {
    const p = readFileSync(ACTIVE_FILE, 'utf-8').trim();
    if (existsSync(p)) return p;
  }
  return DEFAULT_DB;
}

function saveActivePath(path: string) {
  ensureDataDir();
  writeFileSync(ACTIVE_FILE, path, 'utf-8');
}

function today(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '_');
}

function parseFilename(filename: string): { name: string; createdAt: string } {
  // Try to match NAME_YYYY_MM_DD.db or YYYY_MM_DD.db
  const withName = filename.match(/^(.+)_(\d{4}_\d{2}_\d{2})\.db$/);
  if (withName) {
    return {
      name: withName[1].replace(/_/g, ' '),
      createdAt: withName[2].replace(/_/g, '-'),
    };
  }
  const dateOnly = filename.match(/^(\d{4}_\d{2}_\d{2})\.db$/);
  if (dateOnly) {
    return { name: dateOnly[1].replace(/_/g, '-'), createdAt: dateOnly[1].replace(/_/g, '-') };
  }
  // Legacy / arbitrary name (e.g. budget.db)
  return { name: filename.replace(/\.db$/, ''), createdAt: '' };
}

export interface DbEntry {
  filename: string;
  name: string;
  path: string;
  isActive: boolean;
  createdAt: string; // YYYY-MM-DD
}

class DbManager {
  private _db: DB;
  private _sqlite: InstanceType<typeof Database>;
  private _activePath: string;

  constructor() {
    this._activePath = loadActivePath();
    const { db, sqlite } = openDb(this._activePath);
    this._db = db;
    this._sqlite = sqlite;
    saveActivePath(this._activePath);
  }

  getDb(): DB {
    return this._db;
  }

  getActivePath(): string {
    return this._activePath;
  }

  list(): DbEntry[] {
    ensureDataDir();
    return readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.db'))
      .map(filename => {
        const path = join(DATA_DIR, filename);
        const { name, createdAt } = parseFilename(filename);
        // Fall back to mtime if no date in filename
        const mtime = createdAt || statSync(path).mtime.toISOString().slice(0, 10);
        return {
          filename,
          name,
          path,
          isActive: resolve(path) === resolve(this._activePath),
          createdAt: mtime,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  create(name: string): DbEntry {
    ensureDataDir();
    const date = today();
    const safeName = name.trim().replace(/[^a-zA-Z0-9\u0080-\uFFFF]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const filename = safeName ? `${safeName}_${date}.db` : `${date}.db`;
    const path = join(DATA_DIR, filename);
    this.switchTo(filename);
    const { name: displayName, createdAt } = parseFilename(filename);
    return { filename, name: displayName, path, isActive: true, createdAt };
  }

  switchTo(filename: string): void {
    const path = join(DATA_DIR, filename);
    if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
    // Close current connection
    try { this._sqlite.close(); } catch {}
    const { db, sqlite } = openDb(path);
    this._db = db;
    this._sqlite = sqlite;
    this._activePath = path;
    saveActivePath(path);
  }
}

export const dbManager = new DbManager();
