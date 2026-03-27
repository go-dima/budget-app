// ── Entity types (API transport) ─────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  excludedByDefault: boolean;
}

export interface CategoryMapping {
  account: string;
  description: string;
  preferredCategoryId: string | null;
  suggestedCategoryIds: string[];
  preferredCategory?: Category;
  suggestedCategories?: Category[];
}

export interface RecalculateResult {
  updated: number;
  conflicts: number;
  noops: number;
}

export interface PaymentMapping {
  account: string;
  description: string;
  preferredPaymentMethod: string | null;
  suggestedPaymentMethods: string[];
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName: string | null;
  accountName: string;
  amount: number;       // agorot — positive=income, negative=expense
  type: TransactionType;
  description: string;
  paymentMethod: string | null;
  details: string | null;
  reference: string | null;
  balance: number | null;
  date: string;         // YYYY-MM-DD
  createdAt: number;
}

// ── Enums ─────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';
export type ReportGrouping = 'monthly' | 'yearly' | 'category';

// ── Filter types ──────────────────────────────────────────────────────────────

export interface TransactionFilters {
  accountIds?: string[];
  categoryIds?: string[];
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  type?: TransactionType | 'all';
  excludeCategories?: string[];
  search?: string;
  sortBy?: 'date' | 'amount' | 'category' | 'account';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface AccountSummary {
  id: string;
  name: string;
  balance: number | null;    // latest balance in agorot
  totalIncome: number;       // agorot
  totalExpenses: number;     // agorot
  transactionCount: number;
  latestDate: string | null;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  totalIncome: number;    // agorot
  totalExpenses: number;  // agorot
}

export interface MonthlyTrendItem {
  month: string;    // YYYY-MM
  income: number;   // agorot
  expenses: number; // agorot
}

export interface TopCategoryItem {
  categoryId: string;
  categoryName: string;
  total: number;    // agorot (absolute value of expenses)
  percentage: number;
  count: number;
}

export interface MonthlyReportRow {
  month: string;    // YYYY-MM
  income: number;
  expenses: number;
  net: number;
  topCategory: string | null;
}

export interface YearlyReportRow {
  year: string;
  income: number;
  expenses: number;
  net: number;
  avgMonthly: number;
}

export interface CategoryReportRow {
  categoryId: string;
  categoryName: string;
  total: number;    // agorot (absolute)
  percentage: number;
  count: number;
  avgTransaction: number;
}

export interface MonthDetailRow {
  categoryId: string;
  categoryName: string;
  amount: number;    // agorot (absolute)
  percentage: number;
}

// ── Database types ────────────────────────────────────────────────────────────

export interface DbEntry {
  filename: string;
  name: string;       // human-readable name derived from filename
  path: string;
  isActive: boolean;
  createdAt: string;  // YYYY-MM-DD
}

// ── Import types ──────────────────────────────────────────────────────────────

export interface ImportStatusAccount {
  accountId: string;
  accountName: string;
  transactionCount: number;
  latestDate: string | null;
}

export interface ImportStatusResponse {
  accounts: ImportStatusAccount[];
  totalTransactions: number;
}

export interface ImportPreviewSampleRow {
  date: string;
  description: string;
  category: string;
  amount: number; // agorot (signed)
}

export interface ImportPreviewSheet {
  sheetName: string;       // = account name
  rowCount: number;
  dateRange: { from: string; to: string } | null;
  sampleRows: ImportPreviewSampleRow[];
  existingAccount: {
    accountId: string;
    newRows: number;
    duplicates: number;
  } | null;
  error: string | null;
}

export interface ImportPreviewResponse {
  fileId: string;
  sheets: ImportPreviewSheet[];
}

export interface ImportedTransactionReview {
  id: string;
  accountName: string;
  date: string;
  description: string;
  amount: number; // agorot
  categoryId: string | null;
  categoryName: string | null;
  autoAssigned: boolean;
  preferredCategoryId: string | null;   // from mapping (null if no mapping exists)
  suggestedCategoryIds: string[];       // from mapping (empty if no mapping exists)
}

export interface ImportExecuteRequest {
  fileId: string;
}

export interface ImportSheetResult {
  sheetName: string;
  accountName: string;
  newTransactions: number;
  duplicatesSkipped: number;
  error: string | null;
}

export interface ImportExecuteResponse {
  success: boolean;
  results: ImportSheetResult[];
  totalNew: number;
  totalSkipped: number;
  transactionsForReview: ImportedTransactionReview[];
}
