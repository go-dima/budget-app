import { Router, Request, Response } from "express";
import multer from "multer";
import { importService } from "../services/index.js";
import type { ImportRequest } from "../types/index.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const excelUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const allowedExts = [".xlsx", ".xls"];

    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExt = allowedExts.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMime || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error("File must be an Excel file (.xlsx or .xls)"));
    }
  },
});

const dbUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for db files
  },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith(".db")) {
      cb(null, true);
    } else {
      cb(new Error("File must be a SQLite database (.db)"));
    }
  },
});

// POST /api/import/preview - Preview Excel file
router.post(
  "/preview",
  excelUpload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const result = importService.previewExcel(req.file.buffer);
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
    }
  }
);

// POST /api/import/execute - Execute import with user's selections
router.post("/execute", (req: Request, res: Response) => {
  try {
    const request = req.body as ImportRequest;

    if (!request.file_id || !request.sheets) {
      res.status(400).json({ error: "Missing file_id or sheets" });
      return;
    }

    const result = importService.executeImport(request);
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// POST /api/import/database - Import SQLite database file directly
router.post(
  "/database",
  dbUpload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const result = importService.importDatabase(
        req.file.buffer,
        req.file.originalname
      );
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
    }
  }
);

export default router;
