// Account types
export interface Account {
  id: string;
  name: string;
  db_path: string;
  transaction_count: number;
  last_transaction_date: number | null;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  db_name?: string;
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

export interface DbInfo {
  account_id: string;
  account_name: string;
  db_path: string;
  transaction_count: number;
  last_transaction_date: number | null;
}

// Transaction types
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

export interface TransactionCreate {
  account_id: string;
  date: number;
  description: string;
  payment_method?: string | null;
  category: string;
  details?: string | null;
  reference?: string | null;
  expense?: number;
  income?: number;
  balance?: number;
  raw_date_string: string;
}

// Filter types
export interface GlobalFilters {
  account_ids?: string[];
  category_names?: string[];
  date_from?: number | null;
  date_to?: number | null;
}

export interface ExcludedCategories {
  category_names: string[];
}

// Report types
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

export type GroupByOption = "month" | "category" | "year";

// Import types
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

export interface SheetImportConfig {
  sheet_name: string;
  selected: boolean;
  header_mapping: Record<string, string>;
  import_mode: "override" | "append";
  target_db_name: string;
  target_account_name: string;
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
  error?: string | null;
}

export interface ImportExecuteResponse {
  success: boolean;
  results: SheetImportResult[];
  total_rows_imported: number;
  total_rows_skipped: number;
}

export interface ImportResult {
  accounts_created: number;
  transactions_imported: number;
  last_transaction_date: number | null;
  errors: string[];
}

// Database record types (internal)
export interface AccountRecord {
  id: string;
  name: string;
  db_path: string;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
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

export interface SettingRecord {
  key: string;
  value: string;
}
