import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { CategoryMappingService } from '../services/CategoryMappingService.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const service = new CategoryMappingService(dbManager.getDb());
    res.json(service.getAll());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/recalculate', (_req, res) => {
  try {
    const service = new CategoryMappingService(dbManager.getDb());
    res.json(service.recalculate());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch('/:account/:description/preferred', (req, res) => {
  try {
    const { account, description } = req.params;
    if (!account || !description) return res.status(400).json({ error: 'account and description must be non-empty' });
    const { categoryId } = req.body as { categoryId?: unknown };
    if (typeof categoryId !== 'string') return res.status(400).json({ error: 'categoryId must be a string' });
    const service = new CategoryMappingService(dbManager.getDb());
    const updated = service.setPreferred(account, description, categoryId);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:account/:description/suggested/:catId', (req, res) => {
  try {
    const { account, description, catId } = req.params;
    if (!account || !description || !catId) return res.status(400).json({ error: 'account, description, and catId must be non-empty' });
    const service = new CategoryMappingService(dbManager.getDb());
    const updated = service.removeSuggested(account, description, catId);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:account/:description', (req, res) => {
  try {
    const { account, description } = req.params;
    if (!account || !description) return res.status(400).json({ error: 'account and description must be non-empty' });
    const service = new CategoryMappingService(dbManager.getDb());
    service.deleteMapping(account, description);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
