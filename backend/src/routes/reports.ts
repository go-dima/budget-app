import { Router, Request, Response } from "express";
import { reportService } from "../services/index.js";
import type { GlobalFilters, GroupByOption } from "../types/index.js";

const router = Router();

// GET /api/reports/overview - Get overview with overall and per-account summaries
router.get("/overview", (req: Request, res: Response) => {
  try {
    const { account_ids, categories, date_from, date_to } = req.query;

    const filters: GlobalFilters = {
      account_ids: account_ids ? String(account_ids).split(",") : undefined,
      category_names: categories ? String(categories).split(",") : undefined,
      date_from: date_from ? parseInt(String(date_from), 10) : undefined,
      date_to: date_to ? parseInt(String(date_to), 10) : undefined,
    };

    const hasFilters =
      (filters.account_ids && filters.account_ids.length > 0) ||
      (filters.category_names && filters.category_names.length > 0) ||
      filters.date_from != null ||
      filters.date_to != null;

    const overview = reportService.getOverview(hasFilters ? filters : undefined);
    res.json(overview);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/reports/aggregated - Get aggregated report grouped by month/category/year
router.get("/aggregated", (req: Request, res: Response) => {
  try {
    const {
      group_by = "month",
      account_ids,
      categories,
      date_from,
      date_to,
    } = req.query;

    const groupBy = String(group_by) as GroupByOption;
    if (!["month", "category", "year"].includes(groupBy)) {
      res.status(400).json({ error: "Invalid group_by value" });
      return;
    }

    const filters: GlobalFilters = {
      account_ids: account_ids ? String(account_ids).split(",") : undefined,
      category_names: categories ? String(categories).split(",") : undefined,
      date_from: date_from ? parseInt(String(date_from), 10) : undefined,
      date_to: date_to ? parseInt(String(date_to), 10) : undefined,
    };

    const hasFilters =
      (filters.account_ids && filters.account_ids.length > 0) ||
      (filters.category_names && filters.category_names.length > 0) ||
      filters.date_from != null ||
      filters.date_to != null;

    const report = reportService.getAggregatedReport(
      groupBy,
      hasFilters ? filters : undefined
    );
    res.json(report);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
