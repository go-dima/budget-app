import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { AccountService } from '../services/AccountService.js';
import { parseFilters } from './transactions.js';

const router = Router();

router.get('/summary', (req, res) => {
  try {
    const service = new AccountService(dbManager.getDb());
    res.json(service.getSummaries(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
