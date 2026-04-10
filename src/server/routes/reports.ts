import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { ReportService } from '../services/ReportService.js';
import { parseFilters } from './transactions.js';

const router = Router();

router.get('/monthly-trend', (req, res) => {
  try {
    const service = new ReportService(dbManager.getDb());
    res.json(service.getMonthlyTrend(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/top-categories', (req, res) => {
  try {
    const service = new ReportService(dbManager.getDb());
    res.json(service.getTopCategories(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/by-month', (req, res) => {
  try {
    const service = new ReportService(dbManager.getDb());
    res.json(service.getByMonth(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/by-year', (req, res) => {
  try {
    const service = new ReportService(dbManager.getDb());
    res.json(service.getByYear(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/by-category', (req, res) => {
  try {
    const service = new ReportService(dbManager.getDb());
    res.json(service.getByCategory(parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/month-detail', (req, res) => {
  try {
    const month = String(req.query.month || '');
    if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });
    const service = new ReportService(dbManager.getDb());
    res.json(service.getMonthDetail(month, parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/year-detail', (req, res) => {
  try {
    const year = String(req.query.year || '');
    if (!year) return res.status(400).json({ error: 'year param required (YYYY)' });
    const service = new ReportService(dbManager.getDb());
    res.json(service.getYearDetail(year, parseFilters(req.query as Record<string, unknown>)));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
