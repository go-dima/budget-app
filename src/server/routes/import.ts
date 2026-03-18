import { Router } from 'express';
import multer from 'multer';
import { dbManager } from '../../db/manager.js';
import { AccountService } from '../services/AccountService.js';
import { ImportService } from '../services/ImportService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/status', (_req, res) => {
  try {
    const service = new AccountService(dbManager.getDb());
    res.json(service.getImportStatus());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/preview', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const service = new ImportService(dbManager.getDb());
    res.json(service.previewFile(req.file.buffer, req.file.originalname));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/execute', (req, res) => {
  try {
    const { fileId, filename, sheetNameOverrides } = req.body as { fileId: string; filename?: string; sheetNameOverrides?: Record<string, string> };
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    const service = new ImportService(dbManager.getDb());
    res.json(service.executeImport(fileId, filename || 'import.xlsx', sheetNameOverrides ?? {}));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete('/reset', (_req, res) => {
  try {
    const service = new ImportService(dbManager.getDb());
    service.reset();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
