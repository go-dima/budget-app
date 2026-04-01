import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { transactions, accounts, categories, importLogs, settings, descriptionCategoryMap } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type {
  ImportPreviewResponse,
  ImportPreviewSheet,
  ImportExecuteResponse,
  ImportedTransactionReview,
  ColumnMappingMap,
  ColumnMappingEntry,
  ColumnMappingTarget,
} from '../../shared/types.js';
import {
  parseSheet, parseRawRows, getSheetMeta, detectColumns, COLUMN_MAPPING,
  isHtmlFile, extractHtmlSheets, detectHeaderRow,
} from '../utils/excelParser.js';
import { ColumnMappingService } from './ColumnMappingService.js';
import { AccountService } from './AccountService.js';
import { CategoryService } from './CategoryService.js';
import { CategoryMappingService } from './CategoryMappingService.js';
import { PaymentMappingService } from './PaymentMappingService.js';
import { TransactionService } from './TransactionService.js';

export class ImportService {
  private accountSvc: AccountService;
  private categorySvc: CategoryService;
  private txnSvc: TransactionService;

  constructor(private db: DB) {
    this.accountSvc = new AccountService(db);
    this.categorySvc = new CategoryService(db);
    this.txnSvc = new TransactionService(db);
  }

  previewFile(buffer: Buffer, filename: string): ImportPreviewResponse {
    const fileId = nanoid();
    const tmpPath = join(tmpdir(), `budget-import-${fileId}.bin`);
    writeFileSync(tmpPath, buffer);

    this.db.insert(settings)
      .values({ key: `tmp:${fileId}`, value: tmpPath })
      .onConflictDoUpdate({ target: settings.key, set: { value: tmpPath } })
      .run();

    const colSvc = new ColumnMappingService(this.db);
    const sheets: ImportPreviewSheet[] = [];
    const html = isHtmlFile(buffer);

    // Build sheet name → raw rows mapping (for both file types)
    const sheetRawRows: Record<string, string[][]> = html
      ? extractHtmlSheets(buffer)
      : (() => {
          const wb = XLSX.read(buffer, { type: 'buffer' });
          const out: Record<string, string[][]> = {};
          for (const name of wb.SheetNames) {
            const ws = wb.Sheets[name];
            if (!ws) continue;
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }) as string[][];
            out[name] = rows.map(r => r.map(c => String(c ?? '').trim()));
          }
          return out;
        })();

    for (const [sheetName, rawRows] of Object.entries(sheetRawRows)) {
      const headerRowIdx = detectHeaderRow(rawRows);
      const headerRow = rawRows[headerRowIdx] ?? [];

      // Classify columns
      const knownCols = headerRow.filter(c => c.trim() && c.trim() in COLUMN_MAPPING);
      const unknownCols = headerRow.filter(c => c.trim() && !(c.trim() in COLUMN_MAPPING));
      const knownFields = knownCols.map(c => COLUMN_MAPPING[c.trim()]!);
      const missingAmounts = !knownFields.includes('expense') && !knownFields.includes('income');
      const needsMapping = unknownCols.length > 0 && missingAmounts;

      // First 15 rows for header selection UI (only when header is not the very first row)
      const rowsForSelection = headerRowIdx > 0 ? rawRows.slice(0, Math.min(15, rawRows.length)) : null;

      const meta = getSheetMeta(buffer, sheetName, undefined, headerRowIdx);

      // Build column pre-fills from DB or COLUMN_MAPPING defaults
      let storedColumnMapping: ColumnMappingEntry[] | null = null;
      if (needsMapping) {
        const dbMapping = colSvc.getForAccount(sheetName);
        const dbMap = new Map(dbMapping?.map(e => [e.sourceColumn, e.targetField]) ?? []);
        const allCols = [...knownCols, ...unknownCols];
        const preFills: ColumnMappingEntry[] = allCols
          .map(col => {
            const key = col.trim();
            if (dbMap.has(key)) return { sourceColumn: key, targetField: dbMap.get(key)! as ColumnMappingTarget };
            if (key in COLUMN_MAPPING) return { sourceColumn: key, targetField: COLUMN_MAPPING[key] as ColumnMappingTarget };
            return null;
          })
          .filter((e): e is ColumnMappingEntry => e !== null);
        storedColumnMapping = preFills.length > 0 ? preFills : null;
      }

      if (meta.error) {
        sheets.push({ sheetName, rowCount: 0, dateRange: null, sampleRows: [], existingAccount: null, error: meta.error, unknownColumns: null, storedColumnMapping: null, rawRows: rowsForSelection, detectedHeaderRow: headerRowIdx });
        continue;
      }

      if (needsMapping || meta.rowCount === 0) {
        const allCols = needsMapping ? [...knownCols, ...unknownCols] : null;
        sheets.push({ sheetName, rowCount: meta.rowCount, dateRange: meta.dateRange, sampleRows: [], existingAccount: null, error: null, unknownColumns: allCols, storedColumnMapping, rawRows: rowsForSelection, detectedHeaderRow: headerRowIdx });
        continue;
      }

      // Duplicate detection for standard sheets
      let existingAccount: ImportPreviewSheet['existingAccount'] = null;
      const existingAcc = this.accountSvc.getByName(sheetName);
      if (existingAcc) {
        const parsed = html
          ? parseRawRows(rawRows, headerRowIdx)
          : parseSheet(XLSX.read(buffer, { type: 'buffer' }).Sheets[sheetName]!);
        const candidates = parsed.map(t => ({
          accountId: existingAcc.id,
          categoryId: null as string | null,
          amount: t.incomeAgorot > 0 ? t.incomeAgorot : -t.expenseAgorot,
          type: (t.incomeAgorot > 0 ? 'income' : 'expense') as 'income' | 'expense' | 'transfer',
          description: t.description,
          paymentMethod: t.paymentMethod,
          details: t.details,
          reference: t.reference,
          balance: t.balanceAgorot || null,
          date: t.date,
        }));
        const dupeFlags = this.txnSvc.findDuplicates(existingAcc.id, candidates);
        existingAccount = { accountId: existingAcc.id, newRows: candidates.length - dupeFlags.filter(Boolean).length, duplicates: dupeFlags.filter(Boolean).length };
      }

      const sampleRows = meta.sampleRows.map(r => ({
        date: r.date,
        description: r.description,
        category: r.category,
        amount: r.incomeAgorot > 0 ? r.incomeAgorot : -r.expenseAgorot,
      }));

      sheets.push({ sheetName, rowCount: meta.rowCount, dateRange: meta.dateRange, sampleRows, existingAccount, error: null, unknownColumns: null, storedColumnMapping: null, rawRows: rowsForSelection, detectedHeaderRow: headerRowIdx });
    }

    void filename;
    return { fileId, sheets };
  }

  executeImport(fileId: string, filename: string, sheetNameOverrides: Record<string, string> = {}, selectedSheets?: string[], columnMapping?: ColumnMappingMap, headerRowOverrides?: Record<string, number>): ImportExecuteResponse {
    const setting = this.db.select().from(settings).where(eq(settings.key, `tmp:${fileId}`)).get();

    if (!setting || !existsSync(setting.value)) {
      return { success: false, results: [], totalNew: 0, totalSkipped: 0, transactionsForReview: [] };
    }

    const buffer = readFileSync(setting.value);
    const html = isHtmlFile(buffer);

    // Build sheet name → rows mapping (HTML or XLSX)
    let sheetEntries: [string, { sheet?: XLSX.WorkSheet; rawRows?: string[][] }][];
    if (html) {
      const htmlSheets = extractHtmlSheets(buffer);
      sheetEntries = Object.entries(htmlSheets).map(([name, rows]) => [name, { rawRows: rows }]);
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      sheetEntries = workbook.SheetNames.map(name => [name, { sheet: workbook.Sheets[name] }]);
    }

    const results: ImportExecuteResponse['results'] = [];
    let totalNew = 0;
    let totalSkipped = 0;
    const transactionsForReview: ImportedTransactionReview[] = [];
    const mappingSvc = new CategoryMappingService(this.db);
    const colSvc = new ColumnMappingService(this.db);

    const allCategories = this.categorySvc.getAll();
    const catNameMap = new Map(allCategories.map(c => [c.id, c.name]));

    for (const [sheetName, { sheet, rawRows }] of sheetEntries) {
      if (selectedSheets && selectedSheets.length > 0 && !selectedSheets.includes(sheetName)) continue;
      if (!sheet && !rawRows) continue;

      try {
        const accountName = sheetNameOverrides[sheetName] || sheetName;

        const suppliedEntries = columnMapping?.[sheetName];
        if (suppliedEntries && suppliedEntries.length > 0) {
          colSvc.save(accountName, suppliedEntries);
        }
        const effectiveEntries = suppliedEntries ?? colSvc.getForAccount(accountName) ?? [];
        const customMap: Record<string, string> | undefined =
          effectiveEntries.length > 0
            ? {
                ...COLUMN_MAPPING,
                ...Object.fromEntries(
                  effectiveEntries
                    .filter(e => e.targetField !== 'ignore')
                    .map(e => [e.sourceColumn, e.targetField])
                ),
              }
            : undefined;

        let parsed;
        if (rawRows) {
          const headerIdx = headerRowOverrides?.[sheetName] ?? detectHeaderRow(rawRows);
          parsed = parseRawRows(rawRows, headerIdx, customMap);
        } else {
          parsed = parseSheet(sheet!, customMap);
        }
        if (parsed.length === 0) continue;
        const account = this.accountSvc.findOrCreate(accountName);

        const candidates = parsed.map(t => ({
          accountId: account.id,
          categoryId: null as string | null,
          amount: t.incomeAgorot > 0 ? t.incomeAgorot : -t.expenseAgorot,
          type: (t.incomeAgorot > 0 ? 'income' : 'expense') as 'income' | 'expense' | 'transfer',
          description: t.description,
          paymentMethod: t.paymentMethod,
          details: t.details,
          reference: t.reference,
          balance: t.balanceAgorot || null,
          date: t.date,
        }));

        // Resolve categories
        for (let i = 0; i < candidates.length; i++) {
          const raw = parsed[i]!;
          if (raw.category) {
            const cat = this.categorySvc.findOrCreate(raw.category, candidates[i]!.amount > 0 ? 'income' : 'expense');
            candidates[i]!.categoryId = cat.id;
          }
        }

        // Deduplicate
        const dupeFlags = this.txnSvc.findDuplicates(account.id, candidates);
        const newRows = candidates.filter((_, i) => !dupeFlags[i]);
        const skipped = candidates.length - newRows.length;

        // Insert in batches of 500 and collect IDs
        const insertedIds: string[] = [];
        for (let i = 0; i < newRows.length; i += 500) {
          const ids = this.txnSvc.insert(newRows.slice(i, i + 500));
          insertedIds.push(...ids);
        }
        const inserted = insertedIds.length;

        // Apply category + payment method mappings, collect review rows
        const pmMappingSvc = new PaymentMappingService(this.db);
        const mappingUpdates: { id: string; categoryId: string }[] = [];
        const paymentMethodUpdates: { id: string; paymentMethod: string }[] = [];

        for (let i = 0; i < newRows.length; i++) {
          const row = newRows[i]!;
          const rowId = insertedIds[i]!;

          // Category
          let resolvedCategoryId = row.categoryId;
          const catMapping = mappingSvc.getMappingFor(accountName, row.description);
          if (resolvedCategoryId === null) {
            const mappedCatId = catMapping?.preferredCategoryId ?? null;
            if (mappedCatId !== null) {
              mappingUpdates.push({ id: rowId, categoryId: mappedCatId });
              resolvedCategoryId = mappedCatId;
            }
          }

          // Payment method
          let resolvedPm = row.paymentMethod;
          const pmMapping = pmMappingSvc.getMappingFor(accountName, row.description);
          if (resolvedPm === null && pmMapping?.preferred) {
            resolvedPm = pmMapping.preferred;
            paymentMethodUpdates.push({ id: rowId, paymentMethod: resolvedPm });
          }

          transactionsForReview.push({
            id: rowId,
            accountName: account.name,
            date: row.date,
            description: row.description,
            amount: row.amount,
            categoryId: resolvedCategoryId,
            categoryName: resolvedCategoryId ? (catNameMap.get(resolvedCategoryId) ?? null) : null,
            autoAssigned: row.categoryId === null && resolvedCategoryId !== null,
            preferredCategoryId: catMapping?.preferredCategoryId ?? null,
            suggestedCategoryIds: catMapping?.suggestedCategoryIds ?? [],
            paymentMethod: resolvedPm,
            preferredPaymentMethod: pmMapping?.preferred ?? null,
            suggestedPaymentMethods: pmMapping?.suggested ?? [],
          });
        }

        if (mappingUpdates.length > 0) this.txnSvc.bulkSetCategory(mappingUpdates);
        if (paymentMethodUpdates.length > 0) this.txnSvc.bulkSetPaymentMethod(paymentMethodUpdates);

        this.db.insert(importLogs).values({
          id: nanoid(),
          filename,
          accountId: account.id,
          rowCount: inserted,
          importedAt: Math.floor(Date.now() / 1000),
        }).run();

        results.push({ sheetName, accountName: account.name, newTransactions: inserted, duplicatesSkipped: skipped, error: null });
        totalNew += inserted;
        totalSkipped += skipped;
      } catch (e) {
        results.push({ sheetName, accountName: sheetName, newTransactions: 0, duplicatesSkipped: 0, error: String(e) });
      }
    }

    // Cleanup
    try {
      unlinkSync(setting.value);
      this.db.delete(settings).where(eq(settings.key, `tmp:${fileId}`)).run();
    } catch {}

    return { success: results.every(r => r.error === null), results, totalNew, totalSkipped, transactionsForReview };
  }

  reset(): void {
    // Delete in FK-safe order: dependents first, then referenced tables
    this.db.delete(importLogs).run();                 // FK → accounts
    this.db.delete(transactions).run();               // FK → accounts, categories
    this.db.delete(descriptionCategoryMap).run();     // FK → categories
    this.db.delete(categories).run();
    this.db.delete(accounts).run();
  }
}
