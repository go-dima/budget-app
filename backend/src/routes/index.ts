import { Router } from "express";
import accountsRouter from "./accounts.js";
import transactionsRouter from "./transactions.js";
import reportsRouter from "./reports.js";
import adminRouter from "./admin.js";
import importRouter from "./import.js";

const router = Router();

router.use("/accounts", accountsRouter);
router.use("/transactions", transactionsRouter);
router.use("/reports", reportsRouter);
router.use("/admin", adminRouter);
router.use("/import", importRouter);

export default router;
