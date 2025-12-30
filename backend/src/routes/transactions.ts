import { Router, Request, Response } from "express";
import { accountService } from "../services/index.js";
import type { GlobalFilters } from "../types/index.js";

const router = Router();

// GET /api/transactions - List transactions with optional filters
router.get("/", (req: Request, res: Response) => {
  try {
    const {
      account_ids,
      categories,
      date_from,
      date_to,
    } = req.query;

    const filters: GlobalFilters = {
      account_ids: account_ids
        ? String(account_ids).split(",")
        : undefined,
      category_names: categories
        ? String(categories).split(",")
        : undefined,
      date_from: date_from ? parseInt(String(date_from), 10) : undefined,
      date_to: date_to ? parseInt(String(date_to), 10) : undefined,
    };

    // Check if filters is effectively empty
    const hasFilters =
      (filters.account_ids && filters.account_ids.length > 0) ||
      (filters.category_names && filters.category_names.length > 0) ||
      filters.date_from != null ||
      filters.date_to != null;

    const transactions = accountService.getTransactions(
      hasFilters ? filters : undefined
    );

    // Transform to match API response format
    const response = transactions.map((txn) => ({
      id: txn.id,
      account_id: txn.account_id,
      date: txn.date,
      description: txn.description,
      payment_method: txn.payment_method,
      category: txn.category,
      details: txn.details,
      reference: txn.reference,
      expense: txn.expense,
      income: txn.income,
      balance: txn.balance,
      raw_date_string: txn.raw_date_string,
      created_at: txn.created_at,
    }));

    res.json(response);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
