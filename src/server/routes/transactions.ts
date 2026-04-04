import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { TransactionService } from '../services/TransactionService.js';
import type { TransactionFilters } from '../../shared/types.js';

const router = Router();

export function parseFilters(q: Record<string, unknown>): TransactionFilters {
  return {
    accountIds: q.accountIds ? String(q.accountIds).split(',').filter(Boolean) : undefined,
    categoryIds: q.categoryIds ? String(q.categoryIds).split(',').filter(Boolean) : undefined,
    excludeCategories: q.excludeCategories ? String(q.excludeCategories).split(',').filter(Boolean) : undefined,
    startDate: q.startDate ? String(q.startDate) : undefined,
    endDate: q.endDate ? String(q.endDate) : undefined,
    type: q.type ? String(q.type) as TransactionFilters['type'] : undefined,
    search: q.search ? String(q.search) : undefined,
    paymentMethods: q.paymentMethods ? String(q.paymentMethods).split(',').filter(Boolean) : undefined,
    amountMin: q.amountMin != null ? Number(q.amountMin) : undefined,
    amountMax: q.amountMax != null ? Number(q.amountMax) : undefined,
    sortBy: q.sortBy ? String(q.sortBy) as TransactionFilters['sortBy'] : undefined,
    sortOrder: q.sortOrder === 'asc' ? 'asc' : 'desc',
    page: q.page ? Number(q.page) : 1,
    pageSize: q.pageSize ? Number(q.pageSize) : 50,
  };
}

router.get('/', (req, res) => {
  try {
    const service = new TransactionService(dbManager.getDb());
    res.json(service.list(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/bulk-categorize', (req, res) => {
  try {
    const { updates } = req.body as { updates?: unknown };
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be an array' });
    if (!updates.every((u: unknown) => typeof (u as { id: unknown }).id === 'string')) {
      return res.status(400).json({ error: 'Each update must have a string id' });
    }
    const service = new TransactionService(dbManager.getDb());
    service.bulkSetCategory(updates as { id: string; categoryId: string | null }[]);
    res.json({ updated: updates.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/bulk-payment-method', (req, res) => {
  try {
    const { updates } = req.body as { updates?: unknown };
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be an array' });
    const service = new TransactionService(dbManager.getDb());
    service.bulkSetPaymentMethod(updates as { id: string; paymentMethod: string }[]);
    res.json({ updated: updates.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/bulk-delete', (req, res) => {
  try {
    const { ids } = req.body as { ids?: unknown };
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
    const service = new TransactionService(dbManager.getDb());
    service.bulkDelete(ids as string[]);
    res.json({ deleted: ids.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
