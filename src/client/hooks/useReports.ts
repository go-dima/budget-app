import { reportsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { MonthlyTrendItem, TopCategoryItem, MonthlyReportRow, YearlyReportRow, CategoryReportRow, ReportGrouping, MonthDetailRow } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useMonthlyTrend() {
  const { filters } = useFilters();
  return useFetch(() => reportsApi.monthlyTrend(filters), [] as MonthlyTrendItem[], [filters]);
}

export function useTopCategories() {
  const { filters } = useFilters();
  return useFetch(() => reportsApi.topCategories(filters), [] as TopCategoryItem[], [filters]);
}

export function useMonthDetail(month: string) {
  const { filters } = useFilters();
  return useFetch(() => reportsApi.monthDetail(month, filters), [] as MonthDetailRow[], [month, filters]);
}

export function useYearDetail(year: string) {
  const { filters } = useFilters();
  return useFetch(() => reportsApi.yearDetail(year, filters), [] as MonthlyReportRow[], [year, filters]);
}

type ReportRows = MonthlyReportRow[] | YearlyReportRow[] | CategoryReportRow[];

export function useReport(grouping: ReportGrouping) {
  const { filters } = useFilters();
  const fn = grouping === 'monthly' ? reportsApi.byMonth : grouping === 'yearly' ? reportsApi.byYear : reportsApi.byCategory;
  const result = useFetch(
    () => fn(filters).then(rows => ({ grouping, rows: rows as ReportRows })),
    { grouping, rows: [] as ReportRows },
    [filters, grouping],
  );
  // Rows from the previous grouping have a different shape — never hand them to the new grouping's views.
  const isStale = result.data.grouping !== grouping;
  return {
    ...result,
    data: isStale ? [] : result.data.rows,
    isLoading: result.isLoading || isStale,
  };
}
