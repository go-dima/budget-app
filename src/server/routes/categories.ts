import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { CategoryService } from '../services/CategoryService.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const service = new CategoryService(dbManager.getDb());
    res.json(service.getAll());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch('/:id/exclude', (req, res) => {
  try {
    const { excluded } = req.body as { excluded: boolean };
    if (typeof excluded !== 'boolean') return res.status(400).json({ error: 'excluded must be a boolean' });
    const service = new CategoryService(dbManager.getDb());
    const updated = service.setExcludedByDefault(req.params.id, excluded);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
