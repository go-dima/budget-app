import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { CategoryMappingService } from './CategoryMappingService.js';
import { CategoryService } from './CategoryService.js';
import { AccountService } from './AccountService.js';
import { TransactionService } from './TransactionService.js';
import type { DB } from '../../db/index.js';

describe('CategoryMappingService', () => {
  let db: DB;
  let service: CategoryMappingService;
  let categoryService: CategoryService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let accountId: string;
  let catFoodId: string;
  let catTransportId: string;
  let catEntertainmentId: string;

  beforeEach(() => {
    db = createTestDb();
    service = new CategoryMappingService(db);
    categoryService = new CategoryService(db);
    accountService = new AccountService(db);
    transactionService = new TransactionService(db);

    accountId = accountService.create('Test Bank').id;
    catFoodId = categoryService.findOrCreate('מזון').id;
    catTransportId = categoryService.findOrCreate('תחבורה').id;
    catEntertainmentId = categoryService.findOrCreate('בידור').id;
  });

  const txn = (description: string, categoryId: string | null, overrides: Record<string, unknown> = {}) => ({
    accountId,
    categoryId,
    amount: -50000,
    type: 'expense' as const,
    description,
    paymentMethod: null,
    details: null,
    reference: null,
    balance: null,
    date: '2025-01-15',
    ...overrides,
  });

  // ── getAll ────────────────────────────────────────────────────────────────

  it('getAll() returns empty initially', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  // ── recalculate ───────────────────────────────────────────────────────────

  it('recalculate() with no transactions returns all zeros', () => {
    const result = service.recalculate();
    expect(result).toEqual({ updated: 0, conflicts: 0, noops: 0 });
  });

  it('recalculate() single category for a description → preferred = that category, suggested = []', () => {
    transactionService.insert([
      txn('סופרמרקט', catFoodId),
      txn('סופרמרקט', catFoodId, { date: '2025-01-16' }),
    ]);

    const result = service.recalculate();
    expect(result).toEqual({ updated: 1, conflicts: 0, noops: 0 });

    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].account).toBe('Test Bank');
    expect(all[0].description).toBe('סופרמרקט');
    expect(all[0].preferredCategoryId).toBe(catFoodId);
    expect(all[0].suggestedCategoryIds).toEqual([]);
    expect(all[0].preferredCategory?.name).toBe('מזון');
  });

  it('recalculate() 3 food + 1 transport → preferred = food (most frequent), suggested = [transport]', () => {
    transactionService.insert([
      txn('תחנת דלק', catFoodId, { date: '2025-01-13' }),
      txn('תחנת דלק', catFoodId, { date: '2025-01-14' }),
      txn('תחנת דלק', catFoodId, { date: '2025-01-15' }),
      txn('תחנת דלק', catTransportId, { date: '2025-01-16' }),
    ]);

    const result = service.recalculate();
    expect(result).toEqual({ updated: 1, conflicts: 0, noops: 0 });

    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].preferredCategoryId).toBe(catFoodId);
    expect(all[0].suggestedCategoryIds).toEqual([catTransportId]);
  });

  it('recalculate() 1 food + 1 transport (tie) → preferred = null, suggested = both', () => {
    transactionService.insert([
      txn('תחנת דלק', catFoodId),
      txn('תחנת דלק', catTransportId, { date: '2025-01-16' }),
    ]);

    const result = service.recalculate();
    expect(result).toEqual({ updated: 0, conflicts: 1, noops: 0 });

    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].preferredCategoryId).toBeNull();
    expect(all[0].suggestedCategoryIds).toHaveLength(2);
    expect(all[0].suggestedCategoryIds).toContain(catFoodId);
    expect(all[0].suggestedCategoryIds).toContain(catTransportId);
  });

  it('recalculate() called twice with no changes → noops = 2', () => {
    transactionService.insert([
      txn('סופרמרקט', catFoodId),
      txn('תחנת דלק', catFoodId, { date: '2025-01-16' }),
      txn('תחנת דלק', catTransportId, { date: '2025-01-17' }),
    ]);

    service.recalculate();
    const second = service.recalculate();
    expect(second).toEqual({ updated: 0, conflicts: 0, noops: 2 });
  });

  // ── setPreferred ──────────────────────────────────────────────────────────

  it('setPreferred() - set new category on non-existent mapping → creates row with preferred set', () => {
    const mapping = service.setPreferred('Test Bank', 'סופרמרקט', catFoodId);
    expect(mapping.preferredCategoryId).toBe(catFoodId);
    expect(mapping.suggestedCategoryIds).toEqual([]);
    expect(mapping.preferredCategory?.name).toBe('מזון');
  });

  it('setPreferred() - set new category → preferred updated, old preferred moved to suggested', () => {
    // Start with food as preferred
    service.setPreferred('Test Bank', 'סופרמרקט', catFoodId);
    // Change to transport
    const mapping = service.setPreferred('Test Bank', 'סופרמרקט', catTransportId);
    expect(mapping.preferredCategoryId).toBe(catTransportId);
    expect(mapping.suggestedCategoryIds).toContain(catFoodId);
    expect(mapping.suggestedCategoryIds).not.toContain(catTransportId);
  });

  it('setPreferred() - promote from suggested → preferred updated, item REMAINS in suggested, old preferred added to suggested', () => {
    // Set up: food preferred, transport in suggested
    transactionService.insert([
      txn('תחנת דלק', catFoodId, { date: '2025-01-13' }),
      txn('תחנת דלק', catFoodId, { date: '2025-01-14' }),
      txn('תחנת דלק', catTransportId, { date: '2025-01-15' }),
    ]);
    service.recalculate();
    // Now promote transport (from suggested) to preferred
    const mapping = service.setPreferred('Test Bank', 'תחנת דלק', catTransportId);
    expect(mapping.preferredCategoryId).toBe(catTransportId);
    expect(mapping.suggestedCategoryIds).toContain(catFoodId);   // old preferred moved to suggested
    expect(mapping.suggestedCategoryIds).toContain(catTransportId); // remains in suggested
  });

  it('setPreferred() - already preferred → no-op, returns same state', () => {
    service.setPreferred('Test Bank', 'סופרמרקט', catFoodId);
    const mapping = service.setPreferred('Test Bank', 'סופרמרקט', catFoodId);
    expect(mapping.preferredCategoryId).toBe(catFoodId);
    expect(mapping.suggestedCategoryIds).toEqual([]);
  });

  it('setPreferred() - conflict row gets a preferred set, all original suggested remain', () => {
    transactionService.insert([
      txn('תחנת דלק', catFoodId),
      txn('תחנת דלק', catTransportId, { date: '2025-01-16' }),
    ]);
    service.recalculate(); // conflict: preferred=null, suggested=[food,transport]

    const mapping = service.setPreferred('Test Bank', 'תחנת דלק', catTransportId);
    expect(mapping.preferredCategoryId).toBe(catTransportId);
    // both items remain in suggested (transport was promoted but stays; null preferred doesn't add anything)
    expect(mapping.suggestedCategoryIds).toContain(catFoodId);
    expect(mapping.suggestedCategoryIds).toContain(catTransportId);
  });

  // ── removeSuggested ───────────────────────────────────────────────────────

  it('removeSuggested() - removes categoryId from suggestedCategoryIds', () => {
    transactionService.insert([
      txn('תחנת דלק', catFoodId),
      txn('תחנת דלק', catTransportId, { date: '2025-01-16' }),
    ]);
    service.recalculate(); // tie → both in suggested

    const mapping = service.removeSuggested('Test Bank', 'תחנת דלק', catFoodId);
    expect(mapping.suggestedCategoryIds).not.toContain(catFoodId);
    expect(mapping.suggestedCategoryIds).toContain(catTransportId);
  });

  it('removeSuggested() - removing non-existent id is a no-op', () => {
    service.setPreferred('Test Bank', 'סופרמרקט', catFoodId);
    const mapping = service.removeSuggested('Test Bank', 'סופרמרקט', catTransportId);
    expect(mapping.suggestedCategoryIds).toEqual([]);
  });

  it('removeSuggested() - row does not exist returns empty mapping', () => {
    const mapping = service.removeSuggested('Test Bank', 'לא קיים', catFoodId);
    expect(mapping.preferredCategoryId).toBeNull();
    expect(mapping.suggestedCategoryIds).toEqual([]);
  });

  // ── getMappingFor ─────────────────────────────────────────────────────────

  it('getMappingFor() returns null if no row exists', () => {
    expect(service.getMappingFor('Test Bank', 'לא קיים')).toBeNull();
  });

  it('getMappingFor() returns minimal struct with preferredCategoryId and suggestedCategoryIds', () => {
    service.setPreferred('Test Bank', 'סופרמרקט', catFoodId);
    const result = service.getMappingFor('Test Bank', 'סופרמרקט');
    expect(result).not.toBeNull();
    expect(result!.preferredCategoryId).toBe(catFoodId);
    expect(result!.suggestedCategoryIds).toEqual([]);
  });

  // ── lookupCategory ────────────────────────────────────────────────────────

  it('lookupCategory() returns preferredCategoryId for clean rows', () => {
    transactionService.insert([txn('סופרמרקט', catFoodId)]);
    service.recalculate();
    expect(service.lookupCategory('Test Bank', 'סופרמרקט')).toBe(catFoodId);
  });

  it('lookupCategory() returns null for tie rows', () => {
    transactionService.insert([
      txn('תחנת דלק', catFoodId),
      txn('תחנת דלק', catTransportId, { date: '2025-01-16' }),
    ]);
    service.recalculate();
    expect(service.lookupCategory('Test Bank', 'תחנת דלק')).toBeNull();
  });

  it('lookupCategory() returns null for unknown description', () => {
    expect(service.lookupCategory('Test Bank', 'לא קיים')).toBeNull();
  });

  // ── deleteMapping ─────────────────────────────────────────────────────────

  it('deleteMapping() removes the entry', () => {
    transactionService.insert([txn('סופרמרקט', catFoodId)]);
    service.recalculate();
    expect(service.getAll()).toHaveLength(1);

    service.deleteMapping('Test Bank', 'סופרמרקט');
    expect(service.getAll()).toHaveLength(0);
  });
});
