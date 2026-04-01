import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { ColumnMappingService } from '../services/ColumnMappingService.js';
import type { ColumnMappingEntry } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const svc = new ColumnMappingService(dbManager.getDb());
    res.json(svc.getAll());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/:account', (req, res) => {
  try {
    const svc = new ColumnMappingService(dbManager.getDb());
    res.json(svc.getForAccount(req.params.account!) ?? []);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/:account', (req, res) => {
  try {
    const { entries } = req.body as { entries?: unknown };
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });
    const svc = new ColumnMappingService(dbManager.getDb());
    svc.save(req.params.account!, entries as ColumnMappingEntry[]);
    res.json({ saved: entries.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete('/:account', (req, res) => {
  try {
    const svc = new ColumnMappingService(dbManager.getDb());
    svc.deleteForAccount(req.params.account!);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
