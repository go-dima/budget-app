import { Router } from 'express';
import transactionsRouter from './transactions.js';
import accountsRouter from './accounts.js';
import categoriesRouter from './categories.js';
import reportsRouter from './reports.js';
import importRouter from './import.js';
import databasesRouter from './databases.js';
import categoryMappingRouter from './categoryMapping.js';

const router = Router();
router.use('/transactions', transactionsRouter);
router.use('/accounts', accountsRouter);
router.use('/categories', categoriesRouter);
router.use('/reports', reportsRouter);
router.use('/import', importRouter);
router.use('/databases', databasesRouter);
router.use('/category-mapping', categoryMappingRouter);

export default router;
