import { and, eq, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { accounts, categories, descriptionCategoryMap, transactions } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { Category, CategoryMapping, RecalculateResult } from '../../shared/types.js';

function toCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type as 'income' | 'expense',
    excludedByDefault: row.excludedByDefault === 1,
  };
}

function toMapping(
  row: typeof descriptionCategoryMap.$inferSelect,
  allCategories: Map<string, Category>
): CategoryMapping {
  const suggestedCategoryIds = JSON.parse(row.suggestedCategoryIds) as string[];

  const preferredCategory = row.preferredCategoryId ? allCategories.get(row.preferredCategoryId) : undefined;
  const suggestedCategories = suggestedCategoryIds
    .map((id) => allCategories.get(id))
    .filter((c): c is Category => c != null);

  return {
    account: row.account,
    description: row.description,
    preferredCategoryId: row.preferredCategoryId ?? null,
    suggestedCategoryIds,
    preferredCategory,
    suggestedCategories: suggestedCategories.length > 0 ? suggestedCategories : undefined,
  };
}

export class CategoryMappingService {
  constructor(private db: DB) {}

  private getCategoryMap(): Map<string, Category> {
    const rows = this.db.select().from(categories).all();
    return new Map(rows.map((r) => [r.id, toCategory(r)]));
  }

  private getRow(account: string, description: string) {
    return this.db
      .select()
      .from(descriptionCategoryMap)
      .where(
        and(
          eq(descriptionCategoryMap.account, account),
          eq(descriptionCategoryMap.description, description)
        )
      )
      .get();
  }

  getAll(): CategoryMapping[] {
    const rows = this.db.select().from(descriptionCategoryMap).all();
    const catMap = this.getCategoryMap();
    return rows.map((row) => toMapping(row, catMap));
  }

  recalculate(): RecalculateResult {
    // Join transactions with accounts to get (accountName, description, categoryId)
    const rows = this.db
      .select({
        accountName: accounts.name,
        description: transactions.description,
        categoryId: transactions.categoryId,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(isNotNull(transactions.categoryId))
      .all();

    // Group by (accountName, description) → count frequency per categoryId
    const grouped = new Map<string, Map<string, number>>();
    for (const row of rows) {
      if (!row.accountName || !row.categoryId) continue;
      const key = `${row.accountName}\0${row.description}`;
      if (!grouped.has(key)) grouped.set(key, new Map());
      const counts = grouped.get(key)!;
      counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1);
    }

    let updated = 0;
    let conflicts = 0;
    let noops = 0;

    this.db.transaction((tx) => {
      for (const [key, counts] of grouped) {
        const sep = key.indexOf('\0');
        const account = key.slice(0, sep);
        const description = key.slice(sep + 1);

        // Sort by count descending, then by id for deterministic order
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const topCount = sorted[0]![1];
        const winners = sorted.filter(([, count]) => count === topCount);
        const hasStrictWinner = winners.length === 1;

        let preferredCategoryId: string | null;
        let suggestedCategoryIds: string[];

        if (hasStrictWinner) {
          preferredCategoryId = winners[0]![0];
          // suggested = all other categories that appeared (excluding winner)
          suggestedCategoryIds = sorted.slice(1).map(([id]) => id);
        } else {
          // tie — no preferred, all are suggested
          preferredCategoryId = null;
          suggestedCategoryIds = sorted.map(([id]) => id);
        }

        const existing = tx
          .select()
          .from(descriptionCategoryMap)
          .where(
            and(
              eq(descriptionCategoryMap.account, account),
              eq(descriptionCategoryMap.description, description)
            )
          )
          .get();

        const existingSuggested = existing
          ? (JSON.parse(existing.suggestedCategoryIds) as string[])
          : null;

        // No-op detection: same preferred and same sorted suggested
        const isSame =
          existing &&
          existing.preferredCategoryId === preferredCategoryId &&
          existingSuggested !== null &&
          JSON.stringify([...existingSuggested].sort()) === JSON.stringify([...suggestedCategoryIds].sort());

        if (isSame) {
          noops++;
          continue;
        }

        const suggestedJson = JSON.stringify(suggestedCategoryIds);
        tx
          .insert(descriptionCategoryMap)
          .values({ id: nanoid(), account, description, preferredCategoryId, suggestedCategoryIds: suggestedJson })
          .onConflictDoUpdate({
            target: [descriptionCategoryMap.account, descriptionCategoryMap.description],
            set: { preferredCategoryId, suggestedCategoryIds: suggestedJson },
          })
          .run();

        if (preferredCategoryId === null) {
          conflicts++;
        } else {
          updated++;
        }
      }
    });

    return { updated, conflicts, noops };
  }

  setPreferred(account: string, description: string, categoryId: string): CategoryMapping {
    const existing = this.getRow(account, description);

    let preferredCategoryId: string = categoryId;
    let suggestedCategoryIds: string[];

    if (!existing) {
      // No row yet — create with just preferred set
      suggestedCategoryIds = [];
    } else {
      const currentPreferred = existing.preferredCategoryId ?? null;
      const currentSuggested = JSON.parse(existing.suggestedCategoryIds) as string[];

      if (currentPreferred === categoryId) {
        // Already preferred — no-op
        const catMap = this.getCategoryMap();
        return toMapping(existing, catMap);
      }

      if (currentSuggested.includes(categoryId)) {
        // Promote from suggested: keep in suggested, push old preferred into suggested (if non-null and not already there)
        suggestedCategoryIds = [...currentSuggested];
        if (currentPreferred !== null && !suggestedCategoryIds.includes(currentPreferred)) {
          suggestedCategoryIds = [currentPreferred, ...suggestedCategoryIds];
        }
      } else {
        // New category: set as preferred, push old preferred into suggested (if non-null)
        suggestedCategoryIds = currentPreferred !== null
          ? [currentPreferred, ...currentSuggested]
          : [...currentSuggested];
      }
    }

    const suggestedJson = JSON.stringify(suggestedCategoryIds);
    this.db
      .insert(descriptionCategoryMap)
      .values({ id: nanoid(), account, description, preferredCategoryId: categoryId, suggestedCategoryIds: suggestedJson })
      .onConflictDoUpdate({
        target: [descriptionCategoryMap.account, descriptionCategoryMap.description],
        set: { preferredCategoryId: categoryId, suggestedCategoryIds: suggestedJson },
      })
      .run();

    const row = this.getRow(account, description)!;
    const catMap = this.getCategoryMap();
    return toMapping(row, catMap);
  }

  removeSuggested(account: string, description: string, categoryId: string): CategoryMapping {
    const existing = this.getRow(account, description);
    if (!existing) {
      // Nothing to remove — return an empty-ish mapping
      return {
        account,
        description,
        preferredCategoryId: null,
        suggestedCategoryIds: [],
      };
    }

    const currentSuggested = JSON.parse(existing.suggestedCategoryIds) as string[];
    const updated = currentSuggested.filter((id) => id !== categoryId);
    const suggestedJson = JSON.stringify(updated);

    this.db
      .update(descriptionCategoryMap)
      .set({ suggestedCategoryIds: suggestedJson })
      .where(
        and(
          eq(descriptionCategoryMap.account, account),
          eq(descriptionCategoryMap.description, description)
        )
      )
      .run();

    const row = this.getRow(account, description)!;
    const catMap = this.getCategoryMap();
    return toMapping(row, catMap);
  }

  getMappingFor(
    account: string,
    description: string
  ): { preferredCategoryId: string | null; suggestedCategoryIds: string[] } | null {
    const row = this.getRow(account, description);
    if (!row) return null;
    return {
      preferredCategoryId: row.preferredCategoryId ?? null,
      suggestedCategoryIds: JSON.parse(row.suggestedCategoryIds) as string[],
    };
  }

  deleteMapping(account: string, description: string): void {
    this.db
      .delete(descriptionCategoryMap)
      .where(
        and(
          eq(descriptionCategoryMap.account, account),
          eq(descriptionCategoryMap.description, description)
        )
      )
      .run();
  }

  lookupCategory(account: string, description: string): string | null {
    const row = this.getRow(account, description);
    if (!row || row.preferredCategoryId === null) return null;
    return row.preferredCategoryId;
  }
}
