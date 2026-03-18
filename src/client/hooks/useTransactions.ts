import { useEffect, useState } from 'react';
import { transactionsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { TransactionsResponse } from '../../shared/types.js';

export function useTransactions() {
  const { filters } = useFilters();
  const [data, setData] = useState<TransactionsResponse>({ transactions: [], total: 0, totalIncome: 0, totalExpenses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    transactionsApi.list(filters)
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e as Error))
      .finally(() => setIsLoading(false));
  }, [filters]);

  return { data, isLoading, error };
}
