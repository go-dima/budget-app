import { useEffect, useMemo, useState } from 'react';
import { transactionsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { TransactionsResponse, TransactionFilters } from '../../shared/types.js';

export function useTransactions(overrides?: Partial<TransactionFilters>) {
  const { filters } = useFilters();
  const [data, setData] = useState<TransactionsResponse>({ transactions: [], total: 0, totalIncome: 0, totalExpenses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mergedFilters = useMemo(
    () => ({ ...filters, ...overrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, JSON.stringify(overrides)],
  );

  useEffect(() => {
    setIsLoading(true);
    transactionsApi.list(mergedFilters)
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e as Error))
      .finally(() => setIsLoading(false));
  }, [mergedFilters]);

  return { data, isLoading, error };
}
