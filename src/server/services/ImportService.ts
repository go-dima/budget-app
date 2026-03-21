import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { transactions, accounts, categories, importLogs, settings } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type {
  ImportPreviewResponse,
  ImportPreviewSheet,
  ImportExecuteResponse,
} from '../../shared/types.js';
import { parseSheet, getSheetMeta } from '../utils/excelParser.js';
import { AccountService } from './AccountService.js';
import { CategoryService } from './CategoryService.js';
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
    const tmpPath = join(tmpdir(), `budget-import-${fileId}.xlsx`);
    writeFileSync(tmpPath, buffer);

    // Persist temp file path in settings table
    this.db.insert(settings)
      .values({ key: `tmp:${fileId}`, value: tmpPath })
      .onConflictDoUpdate({ target: settings.key, set: { value: tmpPath } })
      .run();

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets: ImportPreviewSheet[] = [];

    for (const sheetName of workbook.SheetNames) {
      const meta = getSheetMeta(buffer, sheetName);

      if (meta.error) {
        sheets.push({ sheetName, rowCount: 0, dateRange: null, sampleRows: [], existingAccount: null, error: meta.error });
        continue;
      }

      if (meta.rowCount === 0) {
        sheets.push({ sheetName, rowCount: 0, dateRange: null, sampleRows: [], existingAccount: null, error: null });
        continue;
      }

      let existingAccount: ImportPreviewSheet['existingAccount'] = null;
      const existingAcc = this.accountSvc.getByName(sheetName);

      if (existingAcc) {
        const sheet = workbook.Sheets[sheetName]!;
        const parsed = parseSheet(sheet);
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
        const duplicates = dupeFlags.filter(Boolean).length;
        existingAccount = { accountId: existingAcc.id, newRows: candidates.length - duplicates, duplicates };
      }

      const sampleRows = meta.sampleRows.map(r => ({
        date: r.date,
        description: r.description,
        category: r.category,
        amount: r.incomeAgorot > 0 ? r.incomeAgorot : -r.expenseAgorot,
      }));

      sheets.push({ sheetName, rowCount: meta.rowCount, dateRange: meta.dateRange, sampleRows, existingAccount, error: null });
    }

    void filename; // stored in the DB via import_logs on execute
    return { fileId, sheets };
  }

  executeImport(fileId: string, filename: string, sheetNameOverrides: Record<string, string> = {}, selectedSheets?: string[]): ImportExecuteResponse {
    const setting = this.db.select().from(settings).where(eq(settings.key, `tmp:${fileId}`)).get();

    if (!setting || !existsSync(setting.value)) {
      return { success: false, results: [], totalNew: 0, totalSkipped: 0 };
    }

    const buffer = readFileSync(setting.value);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const results: ImportExecuteResponse['results'] = [];
    let totalNew = 0;
    let totalSkipped = 0;

    for (const sheetName of workbook.SheetNames) {
      if (selectedSheets && selectedSheets.length > 0 && !selectedSheets.includes(sheetName)) continue;
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      try {
        const parsed = parseSheet(sheet);
        if (parsed.length === 0) continue;

        const accountName = sheetNameOverrides[sheetName] || sheetName;
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

        // Insert in batches of 500
        let inserted = 0;
        for (let i = 0; i < newRows.length; i += 500) {
          inserted += this.txnSvc.insert(newRows.slice(i, i + 500));
        }

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

    return { success: results.every(r => r.error === null), results, totalNew, totalSkipped };
  }

  reset(): void {
    this.db.delete(importLogs).run();
    this.db.delete(transactions).run();
    this.db.delete(categories).run();
    this.db.delete(accounts).run();
  }
}
