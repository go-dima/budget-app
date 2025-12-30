export interface Transaction {
  id: string;
  account_id: string;
  date: number;
  description: string;
  payment_method: string | null;
  category: string;
  details: string | null;
  reference: string | null;
  expense: number;
  income: number;
  balance: number;
  raw_date_string: string;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  db_path: string;
  transaction_count: number;
  last_transaction_date: number | null;
  created_at: string;
}

export interface AccountSummary {
  account_id: string;
  account_name: string;
  total_income: number;
  total_expense: number;
  balance: number;
  last_transaction_date: number | null;
  transaction_count: number;
}

export interface OverviewSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  last_transaction_date: number | null;
  transaction_count: number;
}

export interface OverviewResponse {
  overall: OverviewSummary;
  accounts: AccountSummary[];
}

export interface AggregatedReportItem {
  period: string;
  income: number;
  expense: number;
  net_balance: number;
  transaction_count: number;
}

export interface DbInfo {
  account_id: string;
  account_name: string;
  db_path: string;
  transaction_count: number;
  last_transaction_date: number | null;
}

export interface ImportResult {
  accounts_created: number;
  transactions_imported: number;
  last_transaction_date: number | null;
  errors: string[];
}

export interface GlobalFilters {
  accountIds: string[];
  categoryNames: string[];
  dateRange: {
    from: number | null;
    to: number | null;
  };
}

export type GroupByOption = "month" | "category" | "year";

// Import Wizard Types
export interface SheetInfo {
  name: string;
  row_count: number;
  headers: string[];
  detected_mapping: Record<string, string>;
  sample_rows: Record<string, string>[];
}

export interface ExistingDbInfo {
  account_id: string | null;
  account_name: string;
  existing_row_count: number;
  last_transaction_date: number | null;
}

export interface SheetPreview {
  sheet: SheetInfo;
  existing_db: ExistingDbInfo | null;
}

export interface FilePreviewResponse {
  file_id: string;
  sheets: SheetPreview[];
}

export type ImportMode = "override" | "append";

export interface SheetImportConfig {
  sheet_name: string;
  selected: boolean;
  header_mapping: Record<string, string>;
  import_mode: ImportMode;
  target_db_name: string; // Database file name (defaults to sheet name)
  target_account_name: string; // Display name for the account (defaults to sheet name)
}

export interface ImportRequest {
  file_id: string;
  sheets: SheetImportConfig[];
}

export interface SheetImportResult {
  sheet_name: string;
  account_name: string;
  success: boolean;
  rows_imported: number;
  rows_skipped: number;
  error: string | null;
}

export interface ImportExecuteResponse {
  success: boolean;
  results: SheetImportResult[];
  total_rows_imported: number;
  total_rows_skipped: number;
}
