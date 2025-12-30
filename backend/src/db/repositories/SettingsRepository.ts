import { sqliteManager } from "../SqliteManager.js";
import type { SettingRecord } from "../../types/index.js";

const SETTINGS_DB = "settings.db";

export class SettingsRepository {
  initialize(): void {
    const db = sqliteManager.openDatabase(SETTINGS_DB);

    sqliteManager.execute(
      db,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`
    );
  }

  get(key: string): string | null {
    const db = sqliteManager.openDatabase(SETTINGS_DB);

    const result = sqliteManager.queryOne<SettingRecord>(
      db,
      "SELECT * FROM settings WHERE key = ?",
      [key]
    );

    return result?.value ?? null;
  }

  set(key: string, value: string): void {
    const db = sqliteManager.openDatabase(SETTINGS_DB);

    sqliteManager.execute(
      db,
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      [key, value]
    );
  }

  getJson<T>(key: string): T | null {
    const value = this.get(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  setJson<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  }

  delete(key: string): void {
    const db = sqliteManager.openDatabase(SETTINGS_DB);

    sqliteManager.execute(db, "DELETE FROM settings WHERE key = ?", [key]);
  }
}

export const settingsRepository = new SettingsRepository();
