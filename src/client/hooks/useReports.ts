import { reportsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { MonthlyTrendItem, TopCategoryItem, MonthlyReportRow, YearlyReportRow, CategoryReportRow, ReportGrouping } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useMonthlyTrend() {
  const { filters } = useFilters();
  return useFetch(() => reportsApi.monthlyTrend(filters), [] as MonthlyTrendItem[], [filters]);
}

export function useTopCategories() {
  const { filters } = useFilters();
  return useFetch(() => reportsApi.topCategories(filters), [] as TopCategoryItem[], [filters]);
}

export function useReport(grouping: ReportGrouping) {
  const { filters } = useFilters();
  const fn = grouping === 'monthly' ? reportsApi.byMonth : grouping === 'yearly' ? reportsApi.byYear : reportsApi.byCategory;
  return useFetch(
    () => fn(filters).then(d => d as MonthlyReportRow[] | YearlyReportRow[] | CategoryReportRow[]),
    [] as MonthlyReportRow[] | YearlyReportRow[] | CategoryReportRow[],
    [filters, grouping],
  );
}
