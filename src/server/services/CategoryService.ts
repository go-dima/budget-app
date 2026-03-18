import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { categories } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { Category } from '../../shared/types.js';

function toCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type as 'income' | 'expense',
    excludedByDefault: row.excludedByDefault === 1,
  };
}

export class CategoryService {
  constructor(private db: DB) {}

  getAll(): Category[] {
    return this.db.select().from(categories).all().map(toCategory);
  }

  findOrCreate(name: string, type: 'income' | 'expense' = 'expense'): Category {
    const existing = this.db.select().from(categories).where(eq(categories.name, name)).get();
    if (existing) return toCategory(existing);
    const row = { id: nanoid(), name, type, excludedByDefault: 0 };
    this.db.insert(categories).values(row).run();
    return toCategory(row);
  }

  getById(id: string): Category | null {
    const row = this.db.select().from(categories).where(eq(categories.id, id)).get();
    return row ? toCategory(row) : null;
  }

  setExcludedByDefault(id: string, excluded: boolean): Category | null {
    this.db.update(categories).set({ excludedByDefault: excluded ? 1 : 0 }).where(eq(categories.id, id)).run();
    return this.getById(id);
  }
}
