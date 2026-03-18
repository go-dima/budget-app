import type {
  AccountSummary, TransactionsResponse, Category,
  MonthlyTrendItem, TopCategoryItem,
  MonthlyReportRow, YearlyReportRow, CategoryReportRow, MonthDetailRow,
  ImportStatusResponse, ImportPreviewResponse, ImportExecuteResponse,
  TransactionFilters, DbEntry,
} from '../../shared/types.js';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = (JSON.parse(text) as { error?: string }).error || text; } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

function toParams(filters: TransactionFilters): string {
  const p = new URLSearchParams();
  if (filters.accountIds?.length) p.set('accountIds', filters.accountIds.join(','));
  if (filters.categoryIds?.length) p.set('categoryIds', filters.categoryIds.join(','));
  if (filters.excludeCategories?.length) p.set('excludeCategories', filters.excludeCategories.join(','));
  if (filters.startDate) p.set('startDate', filters.startDate);
  if (filters.endDate) p.set('endDate', filters.endDate);
  if (filters.type) p.set('type', filters.type);
  if (filters.search) p.set('search', filters.search);
  if (filters.sortBy) p.set('sortBy', filters.sortBy);
  if (filters.sortOrder) p.set('sortOrder', filters.sortOrder);
  if (filters.page) p.set('page', String(filters.page));
  if (filters.pageSize) p.set('pageSize', String(filters.pageSize));
  return p.toString();
}

export const accountsApi = {
  getSummaries: (filters: TransactionFilters) =>
    request<AccountSummary[]>(`/api/accounts/summary?${toParams(filters)}`),
};

export const transactionsApi = {
  list: (filters: TransactionFilters) =>
    request<TransactionsResponse>(`/api/transactions?${toParams(filters)}`),
};

export const categoriesApi = {
  getAll: () => request<Category[]>('/api/categories'),
  setExcluded: (id: string, excluded: boolean) =>
    request<Category>(`/api/categories/${id}/exclude`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluded }),
    }),
};

export const reportsApi = {
  monthlyTrend: (filters: TransactionFilters) =>
    request<MonthlyTrendItem[]>(`/api/reports/monthly-trend?${toParams(filters)}`),
  topCategories: (filters: TransactionFilters) =>
    request<TopCategoryItem[]>(`/api/reports/top-categories?${toParams(filters)}`),
  byMonth: (filters: TransactionFilters) =>
    request<MonthlyReportRow[]>(`/api/reports/by-month?${toParams(filters)}`),
  byYear: (filters: TransactionFilters) =>
    request<YearlyReportRow[]>(`/api/reports/by-year?${toParams(filters)}`),
  byCategory: (filters: TransactionFilters) =>
    request<CategoryReportRow[]>(`/api/reports/by-category?${toParams(filters)}`),
  monthDetail: (month: string, filters: TransactionFilters) =>
    request<MonthDetailRow[]>(`/api/reports/month-detail?month=${month}&${toParams(filters)}`),
  yearDetail: (year: string, filters: TransactionFilters) =>
    request<MonthDetailRow[]>(`/api/reports/year-detail?year=${year}&${toParams(filters)}`),
};

export const databasesApi = {
  list: () => request<DbEntry[]>('/api/databases'),
  create: (name: string) => request<DbEntry>('/api/databases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }),
  switch: (filename: string) => request<{ success: boolean }>('/api/databases/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  }),
};

export const importApi = {
  getStatus: () => request<ImportStatusResponse>('/api/import/status'),
  preview: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ImportPreviewResponse>('/api/import/preview', { method: 'POST', body: form });
  },
  execute: (fileId: string, filename: string, sheetNameOverrides?: Record<string, string>) =>
    request<ImportExecuteResponse>('/api/import/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, filename, sheetNameOverrides }),
    }),
  reset: () => request<{ success: boolean }>('/api/import/reset', { method: 'DELETE' }),
};
