import { and, eq, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { accounts, descriptionPaymentMethodMap, transactions } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { PaymentMapping, RecalculateResult } from '../../shared/types.js';

function toMapping(row: typeof descriptionPaymentMethodMap.$inferSelect): PaymentMapping {
  return {
    account: row.account,
    description: row.description,
    preferredPaymentMethod: row.preferredPaymentMethod ?? null,
    suggestedPaymentMethods: JSON.parse(row.suggestedPaymentMethods) as string[],
  };
}

export class PaymentMappingService {
  constructor(private db: DB) {}

  private getRow(account: string, description: string) {
    return this.db
      .select()
      .from(descriptionPaymentMethodMap)
      .where(and(
        eq(descriptionPaymentMethodMap.account, account),
        eq(descriptionPaymentMethodMap.description, description),
      ))
      .get();
  }

  getAll(): PaymentMapping[] {
    return this.db.select().from(descriptionPaymentMethodMap).all().map(toMapping);
  }

  recalculate(): RecalculateResult {
    const rows = this.db
      .select({
        accountName: accounts.name,
        description: transactions.description,
        paymentMethod: transactions.paymentMethod,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(isNotNull(transactions.paymentMethod))
      .all();

    // Group by (accountName, description) → frequency map of payment methods
    const grouped = new Map<string, Map<string, number>>();
    for (const row of rows) {
      if (!row.accountName || !row.paymentMethod) continue;
      const key = `${row.accountName}\0${row.description}`;
      if (!grouped.has(key)) grouped.set(key, new Map());
      const counts = grouped.get(key)!;
      counts.set(row.paymentMethod, (counts.get(row.paymentMethod) ?? 0) + 1);
    }

    let updated = 0;
    let conflicts = 0;
    let noops = 0;

    this.db.transaction((tx) => {
      for (const [key, counts] of grouped) {
        const sep = key.indexOf('\0');
        const account = key.slice(0, sep);
        const description = key.slice(sep + 1);

        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const topCount = sorted[0]![1];
        const winners = sorted.filter(([, c]) => c === topCount);
        const hasStrictWinner = winners.length === 1;

        let preferredPaymentMethod: string | null;
        let suggestedPaymentMethods: string[];

        if (hasStrictWinner) {
          preferredPaymentMethod = winners[0]![0];
          suggestedPaymentMethods = sorted.slice(1).map(([m]) => m);
        } else {
          preferredPaymentMethod = null;
          suggestedPaymentMethods = sorted.map(([m]) => m);
        }

        const existing = tx
          .select()
          .from(descriptionPaymentMethodMap)
          .where(and(
            eq(descriptionPaymentMethodMap.account, account),
            eq(descriptionPaymentMethodMap.description, description),
          ))
          .get();

        const existingSuggested = existing
          ? (JSON.parse(existing.suggestedPaymentMethods) as string[])
          : null;

        const isSame =
          existing &&
          (existing.preferredPaymentMethod ?? null) === preferredPaymentMethod &&
          existingSuggested !== null &&
          JSON.stringify([...existingSuggested].sort()) === JSON.stringify([...suggestedPaymentMethods].sort());

        if (isSame) { noops++; continue; }

        const suggestedJson = JSON.stringify(suggestedPaymentMethods);
        tx.insert(descriptionPaymentMethodMap)
          .values({ id: nanoid(), account, description, preferredPaymentMethod, suggestedPaymentMethods: suggestedJson })
          .onConflictDoUpdate({
            target: [descriptionPaymentMethodMap.account, descriptionPaymentMethodMap.description],
            set: { preferredPaymentMethod, suggestedPaymentMethods: suggestedJson },
          })
          .run();

        if (preferredPaymentMethod === null) { conflicts++; } else { updated++; }
      }
    });

    return { updated, conflicts, noops };
  }

  setPreferred(account: string, description: string, paymentMethod: string): PaymentMapping {
    const existing = this.getRow(account, description);

    let suggestedPaymentMethods: string[];

    if (!existing) {
      suggestedPaymentMethods = [];
    } else {
      const currentPreferred = existing.preferredPaymentMethod ?? null;
      const currentSuggested = JSON.parse(existing.suggestedPaymentMethods) as string[];

      if (currentPreferred === paymentMethod) {
        return toMapping(existing);
      }

      if (currentSuggested.includes(paymentMethod)) {
        suggestedPaymentMethods = [...currentSuggested].filter(m => m !== paymentMethod);
        if (currentPreferred !== null && !suggestedPaymentMethods.includes(currentPreferred)) {
          suggestedPaymentMethods = [currentPreferred, ...suggestedPaymentMethods];
        }
      } else {
        suggestedPaymentMethods = currentPreferred !== null
          ? [currentPreferred, ...currentSuggested]
          : [...currentSuggested];
      }
    }

    const suggestedJson = JSON.stringify(suggestedPaymentMethods);
    this.db.insert(descriptionPaymentMethodMap)
      .values({ id: nanoid(), account, description, preferredPaymentMethod: paymentMethod, suggestedPaymentMethods: suggestedJson })
      .onConflictDoUpdate({
        target: [descriptionPaymentMethodMap.account, descriptionPaymentMethodMap.description],
        set: { preferredPaymentMethod: paymentMethod, suggestedPaymentMethods: suggestedJson },
      })
      .run();

    return toMapping(this.getRow(account, description)!);
  }

  deleteMapping(account: string, description: string): void {
    this.db.delete(descriptionPaymentMethodMap)
      .where(and(
        eq(descriptionPaymentMethodMap.account, account),
        eq(descriptionPaymentMethodMap.description, description),
      ))
      .run();
  }

  getMappingFor(account: string, description: string): { preferred: string | null; suggested: string[] } | null {
    const row = this.getRow(account, description);
    if (!row) return null;
    return {
      preferred: row.preferredPaymentMethod ?? null,
      suggested: JSON.parse(row.suggestedPaymentMethods) as string[],
    };
  }
}
