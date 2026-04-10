import { useMemo } from 'react';
import { transactionsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { TransactionsResponse, TransactionFilters } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useTransactions(overrides?: Partial<TransactionFilters>) {
  const { filters } = useFilters();
  const mergedFilters = useMemo(
    () => ({ ...filters, ...overrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, JSON.stringify(overrides)],
  );
  return useFetch(
    () => transactionsApi.list(mergedFilters),
    { transactions: [], total: 0, totalIncome: 0, totalExpenses: 0 } as TransactionsResponse,
    [mergedFilters],
  );
}
