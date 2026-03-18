import { useEffect, useState } from 'react';
import { reportsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { MonthlyTrendItem, TopCategoryItem, MonthlyReportRow, YearlyReportRow, CategoryReportRow, ReportGrouping } from '../../shared/types.js';

export function useMonthlyTrend() {
  const { filters } = useFilters();
  const [data, setData] = useState<MonthlyTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setIsLoading(true);
    reportsApi.monthlyTrend(filters).then(d => { setData(d); setError(null); }).catch(e => setError(e as Error)).finally(() => setIsLoading(false));
  }, [filters]);
  return { data, isLoading, error };
}

export function useTopCategories() {
  const { filters } = useFilters();
  const [data, setData] = useState<TopCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setIsLoading(true);
    reportsApi.topCategories(filters).then(d => { setData(d); setError(null); }).catch(e => setError(e as Error)).finally(() => setIsLoading(false));
  }, [filters]);
  return { data, isLoading, error };
}

export function useReport(grouping: ReportGrouping) {
  const { filters } = useFilters();
  const [data, setData] = useState<MonthlyReportRow[] | YearlyReportRow[] | CategoryReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setIsLoading(true);
    const fn = grouping === 'monthly' ? reportsApi.byMonth : grouping === 'yearly' ? reportsApi.byYear : reportsApi.byCategory;
    fn(filters).then(d => { setData(d as typeof data); setError(null); }).catch(e => setError(e as Error)).finally(() => setIsLoading(false));
  }, [filters, grouping]);
  return { data, isLoading, error };
}
