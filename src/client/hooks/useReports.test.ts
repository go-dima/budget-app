// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CategoryReportRow, MonthlyReportRow } from '../../shared/types.js';

const filters = {};
vi.mock('../contexts/FilterContext.js', () => ({ useFilters: () => ({ filters }) }));

const byMonth = vi.fn();
const byCategory = vi.fn();
vi.mock('../httpClient/client.js', () => ({
  reportsApi: { byMonth: (...a: unknown[]) => byMonth(...a), byYear: vi.fn(), byCategory: (...a: unknown[]) => byCategory(...a) },
}));

const { useReport } = await import('./useReports.js');

const categoryRows: CategoryReportRow[] = [
  { categoryId: 'c1', categoryName: 'Food', total: 1000, percentage: 100, count: 1, avgTransaction: 1000 },
];
const monthlyRows: MonthlyReportRow[] = [
  { month: '2026-01', income: 500, expenses: 200, net: 300, topCategory: null },
];

describe('useReport', () => {
  beforeEach(() => {
    byMonth.mockReset();
    byCategory.mockReset();
  });

  it('never returns rows from a previous grouping while the new one is loading', async () => {
    byCategory.mockResolvedValue(categoryRows);
    let resolveMonthly!: (rows: MonthlyReportRow[]) => void;
    byMonth.mockReturnValue(new Promise(r => { resolveMonthly = r; }));

    const { result, rerender } = renderHook(({ g }) => useReport(g), {
      initialProps: { g: 'category' as 'category' | 'monthly' },
    });
    await waitFor(() => expect(result.current.data).toEqual(categoryRows));

    rerender({ g: 'monthly' });
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);

    resolveMonthly(monthlyRows);
    await waitFor(() => expect(result.current.data).toEqual(monthlyRows));
    expect(result.current.isLoading).toBe(false);
  });
});
