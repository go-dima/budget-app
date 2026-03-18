import { Router } from 'express';
import { dbManager } from '../../db/manager.js';

const router = Router();

router.get('/', (_req, res) => {
  try { res.json(dbManager.list()); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/', (req, res) => {
  try {
    const { name = '' } = req.body as { name?: string };
    const entry = dbManager.create(name);
    res.json(entry);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/switch', (req, res) => {
  try {
    const { filename } = req.body as { filename: string };
    if (!filename) return res.status(400).json({ error: 'filename required' });
    dbManager.switchTo(filename);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
