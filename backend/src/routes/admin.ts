import { Router, Request, Response } from "express";
import { adminService } from "../services/index.js";

const router = Router();

// GET /api/admin/databases - Get loaded database info
router.get("/databases", (_req: Request, res: Response) => {
  try {
    const dbInfo = adminService.getDatabaseInfo();
    res.json(dbInfo);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// DELETE /api/admin/databases/:accountId - Delete a database/account
router.delete("/databases/:accountId", (req: Request, res: Response) => {
  try {
    adminService.deleteDatabase(req.params.accountId);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
      return;
    }
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/admin/categories - Get all unique categories
router.get("/categories", (_req: Request, res: Response) => {
  try {
    const categories = adminService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/admin/excluded-categories - Get excluded categories
router.get("/excluded-categories", (_req: Request, res: Response) => {
  try {
    const excluded = adminService.getExcludedCategories();
    res.json(excluded);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// PUT /api/admin/excluded-categories - Update excluded categories
router.put("/excluded-categories", (req: Request, res: Response) => {
  try {
    const { category_names } = req.body as { category_names?: string[] };

    if (!Array.isArray(category_names)) {
      res.status(400).json({ error: "category_names must be an array" });
      return;
    }

    const result = adminService.setExcludedCategories(category_names);
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
