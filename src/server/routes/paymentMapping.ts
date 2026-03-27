import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { PaymentMappingService } from '../services/PaymentMappingService.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const service = new PaymentMappingService(dbManager.getDb());
    res.json(service.getAll());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/recalculate', (_req, res) => {
  try {
    const service = new PaymentMappingService(dbManager.getDb());
    res.json(service.recalculate());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch('/:account/:description/preferred', (req, res) => {
  try {
    const { account, description } = req.params;
    if (!account || !description) return res.status(400).json({ error: 'account and description must be non-empty' });
    const { paymentMethod } = req.body as { paymentMethod?: unknown };
    if (typeof paymentMethod !== 'string') return res.status(400).json({ error: 'paymentMethod must be a string' });
    const service = new PaymentMappingService(dbManager.getDb());
    res.json(service.setPreferred(account, description, paymentMethod));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:account/:description', (req, res) => {
  try {
    const { account, description } = req.params;
    if (!account || !description) return res.status(400).json({ error: 'account and description must be non-empty' });
    const service = new PaymentMappingService(dbManager.getDb());
    service.deleteMapping(account, description);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
