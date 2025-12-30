import { Router, Request, Response } from "express";
import { accountService } from "../services/index.js";

const router = Router();

// GET /api/accounts - List all accounts
router.get("/", (_req: Request, res: Response) => {
  try {
    const accounts = accountService.getAllAccounts();
    res.json(accounts);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/accounts/:id - Get account by ID
router.get("/:id", (req: Request, res: Response) => {
  try {
    const account = accountService.getAccount(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(account);
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
