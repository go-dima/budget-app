import { eq } from 'drizzle-orm';
import { accountColumnMapping } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { ColumnMappingEntry, ColumnMappingTarget } from '../../shared/types.js';

export class ColumnMappingService {
  constructor(private db: DB) {}

  getAll(): Record<string, ColumnMappingEntry[]> {
    const rows = this.db.select().from(accountColumnMapping).all();
    const result: Record<string, ColumnMappingEntry[]> = {};
    for (const row of rows) {
      if (!result[row.account]) result[row.account] = [];
      result[row.account]!.push({
        sourceColumn: row.sourceColumn,
        targetField: row.targetField as ColumnMappingTarget,
      });
    }
    return result;
  }

  getForAccount(account: string): ColumnMappingEntry[] | null {
    const rows = this.db
      .select()
      .from(accountColumnMapping)
      .where(eq(accountColumnMapping.account, account))
      .all();
    if (rows.length === 0) return null;
    return rows.map(r => ({
      sourceColumn: r.sourceColumn,
      targetField: r.targetField as ColumnMappingTarget,
    }));
  }

  save(account: string, entries: ColumnMappingEntry[]): void {
    this.db.delete(accountColumnMapping)
      .where(eq(accountColumnMapping.account, account))
      .run();
    if (entries.length === 0) return;
    this.db.insert(accountColumnMapping)
      .values(entries.map(e => ({ account, sourceColumn: e.sourceColumn, targetField: e.targetField })))
      .run();
  }

  deleteForAccount(account: string): void {
    this.db.delete(accountColumnMapping)
      .where(eq(accountColumnMapping.account, account))
      .run();
  }
}
