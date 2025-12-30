import { v4 as uuidv4 } from "uuid";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import { join, basename } from "path";
import * as XLSX from "xlsx";
import Database from "better-sqlite3";
import { config } from "../config.js";
import { accountService } from "./AccountService.js";
import {
  parseSheet,
  getSheetPreview,
} from "../utils/excelParser.js";
import type {
  FilePreviewResponse,
  SheetPreview,
  SheetInfo,
  ExistingDbInfo,
  ImportRequest,
  ImportExecuteResponse,
  SheetImportResult,
  SheetImportConfig,
  TransactionCreate,
} from "../types/index.js";

export class ImportService {
  private tempDir: string;

  constructor() {
    this.tempDir = join(config.dbPath, "temp");
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  previewExcel(fileBuffer: Buffer): FilePreviewResponse {
    const fileId = uuidv4();

    // Store file temporarily
    const tempFile = join(this.tempDir, `${fileId}.xlsx`);
    writeFileSync(tempFile, fileBuffer);

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheets: SheetPreview[] = [];

    for (const sheetName of workbook.SheetNames) {
      const preview = getSheetPreview(fileBuffer, sheetName);
      if (!preview || preview.headers.length === 0) {
        continue;
      }

      const sheetInfo: SheetInfo = {
        name: sheetName,
        row_count: preview.rowCount,
        headers: preview.headers,
        detected_mapping: preview.detectedMapping,
        sample_rows: preview.sampleRows,
      };

      const existingDb = this.getExistingDbInfo(sheetName);

      sheets.push({
        sheet: sheetInfo,
        existing_db: existingDb,
      });
    }

    return {
      file_id: fileId,
      sheets,
    };
  }

  private getExistingDbInfo(accountName: string): ExistingDbInfo | null {
    const account = accountService.getAccountByName(accountName);
    if (!account) {
      return null;
    }

    const summary = accountService.getAccountSummary(account);

    return {
      account_id: account.id,
      account_name: account.name,
      existing_row_count: summary.transaction_count,
      last_transaction_date: summary.last_transaction_date,
    };
  }

  executeImport(request: ImportRequest): ImportExecuteResponse {
    const tempFile = join(this.tempDir, `${request.file_id}.xlsx`);

    if (!existsSync(tempFile)) {
      return {
        success: false,
        results: [],
        total_rows_imported: 0,
        total_rows_skipped: 0,
      };
    }

    const fileBuffer = readFileSync(tempFile);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    const results: SheetImportResult[] = [];
    let totalImported = 0;
    let totalSkipped = 0;

    for (const sheetConfig of request.sheets) {
      if (!sheetConfig.selected) {
        continue;
      }

      const result = this.importSheet(workbook, sheetConfig);
      results.push(result);
      totalImported += result.rows_imported;
      totalSkipped += result.rows_skipped;
    }

    // Cleanup temp file
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: results.every((r) => r.success),
      results,
      total_rows_imported: totalImported,
      total_rows_skipped: totalSkipped,
    };
  }

  private importSheet(
    workbook: XLSX.WorkBook,
    sheetConfig: SheetImportConfig
  ): SheetImportResult {
    const dbName = sheetConfig.target_db_name || sheetConfig.sheet_name;
    const accountName =
      sheetConfig.target_account_name || sheetConfig.sheet_name;

    try {
      if (!workbook.SheetNames.includes(sheetConfig.sheet_name)) {
        return {
          sheet_name: sheetConfig.sheet_name,
          account_name: accountName,
          success: false,
          rows_imported: 0,
          rows_skipped: 0,
          error: `Sheet '${sheetConfig.sheet_name}' not found`,
        };
      }

      const sheet = workbook.Sheets[sheetConfig.sheet_name];
      const transactionsData = parseSheet(sheet);

      // Get or create account
      let account = accountService.getAccountByDbPath(dbName);
      const isNewAccount = account === null;

      if (account === null) {
        account = accountService.createAccount(accountName, dbName);
      }

      let rowsImported = 0;
      let rowsSkipped = 0;

      if (sheetConfig.import_mode === "override") {
        // Clear existing transactions
        if (!isNewAccount) {
          accountService.clearAccountTransactions(account.id);
        }

        // Import all transactions
        const transactions = this.convertToTransactions(
          account.id,
          transactionsData
        );
        rowsImported = accountService.insertTransactions(
          account.id,
          transactions
        );
      } else {
        // Append mode: only add rows newer than last transaction
        const summary = accountService.getAccountSummary(account);
        const lastDate = summary.last_transaction_date;

        const transactions: TransactionCreate[] = [];

        for (const txnData of transactionsData) {
          if (txnData.date === null) continue;

          if (lastDate === null || txnData.date > lastDate) {
            transactions.push(this.createTransaction(account.id, txnData));
            rowsImported++;
          } else {
            rowsSkipped++;
          }
        }

        if (transactions.length > 0) {
          accountService.insertTransactions(account.id, transactions);
        }
      }

      return {
        sheet_name: sheetConfig.sheet_name,
        account_name: account.name,
        success: true,
        rows_imported: rowsImported,
        rows_skipped: rowsSkipped,
      };
    } catch (e) {
      return {
        sheet_name: sheetConfig.sheet_name,
        account_name: accountName,
        success: false,
        rows_imported: 0,
        rows_skipped: 0,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  private convertToTransactions(
    accountId: string,
    transactionsData: ReturnType<typeof parseSheet>
  ): TransactionCreate[] {
    return transactionsData
      .filter((txn) => txn.date !== null)
      .map((txn) => this.createTransaction(accountId, txn));
  }

  private createTransaction(
    accountId: string,
    txn: ReturnType<typeof parseSheet>[number]
  ): TransactionCreate {
    return {
      account_id: accountId,
      date: txn.date!,
      description: txn.description,
      payment_method: txn.payment_method,
      category: txn.category || "לא מסווג",
      details: txn.details,
      reference: txn.reference,
      expense: txn.expense,
      income: txn.income,
      balance: txn.balance,
      raw_date_string: txn.raw_date_string,
    };
  }

  /**
   * Import an existing SQLite database file directly
   */
  importDatabase(
    fileBuffer: Buffer,
    originalFilename: string
  ): { success: boolean; account_name: string; rows_imported: number; error?: string } {
    // Extract account name from filename (remove .db extension)
    const accountName = basename(originalFilename, ".db");
    const dbFileName = `${accountName}.db`;
    const targetPath = join(config.dbPath, dbFileName);

    try {
      // Write the uploaded file to a temp location first to validate it
      const tempFile = join(this.tempDir, `${uuidv4()}.db`);
      writeFileSync(tempFile, fileBuffer);

      // Validate it's a valid SQLite database with transactions table
      let rowCount = 0;
      try {
        const db = new Database(tempFile, { readonly: true });

        // Check if transactions table exists
        const tableCheck = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
        ).get();

        if (!tableCheck) {
          db.close();
          unlinkSync(tempFile);
          return {
            success: false,
            account_name: accountName,
            rows_imported: 0,
            error: "Database does not contain a 'transactions' table",
          };
        }

        // Count rows
        const countResult = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number };
        rowCount = countResult.count;

        db.close();
      } catch (e) {
        try { unlinkSync(tempFile); } catch {}
        return {
          success: false,
          account_name: accountName,
          rows_imported: 0,
          error: `Invalid SQLite database: ${e instanceof Error ? e.message : String(e)}`,
        };
      }

      // Check if account already exists
      const existingAccount = accountService.getAccountByDbPath(accountName);
      if (existingAccount) {
        unlinkSync(tempFile);
        return {
          success: false,
          account_name: accountName,
          rows_imported: 0,
          error: `Account '${accountName}' already exists. Delete it first to re-import.`,
        };
      }

      // Move temp file to final location
      copyFileSync(tempFile, targetPath);
      unlinkSync(tempFile);

      // Register the account
      accountService.registerExistingDatabase(accountName, dbFileName);

      return {
        success: true,
        account_name: accountName,
        rows_imported: rowCount,
      };
    } catch (e) {
      return {
        success: false,
        account_name: accountName,
        rows_imported: 0,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}

export const importService = new ImportService();
