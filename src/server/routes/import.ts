import { Router } from 'express';
import multer from 'multer';
import { dbManager } from '../../db/manager.js';
import { AccountService } from '../services/AccountService.js';
import { ImportService } from '../services/ImportService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/status', (req, res) => {
  try {
    const filename = req.query.filename as string | undefined;
    if (filename) {
      const { db, close } = dbManager.openForFilename(filename);
      try {
        res.json(new AccountService(db).getImportStatus());
      } finally { close(); }
    } else {
      res.json(new AccountService(dbManager.getDb()).getImportStatus());
    }
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
    const { fileId, filename, sheetNameOverrides, selectedSheets, columnMapping, headerRowOverrides, fixBidi } = req.body as { fileId: string; filename?: string; sheetNameOverrides?: Record<string, string>; selectedSheets?: string[]; columnMapping?: import('../../shared/types.js').ColumnMappingMap; headerRowOverrides?: Record<string, number>; fixBidi?: boolean };
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    const service = new ImportService(dbManager.getDb());
    res.json(service.executeImport(fileId, filename || 'import.xlsx', sheetNameOverrides ?? {}, selectedSheets, columnMapping, headerRowOverrides, fixBidi));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/commit', (req, res) => {
  try {
    const body = req.body as import('../../shared/types.js').ImportCommitRequest;
    if (!body.fileId) return res.status(400).json({ error: 'fileId required' });
    const service = new ImportService(dbManager.getDb());
    res.json(service.commitImport(body));
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
