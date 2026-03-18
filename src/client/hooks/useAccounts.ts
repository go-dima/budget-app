import { useEffect, useState } from 'react';
import { accountsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { AccountSummary } from '../../shared/types.js';

export function useAccounts() {
  const { filters } = useFilters();
  const [data, setData] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    accountsApi.getSummaries(filters)
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e as Error))
      .finally(() => setIsLoading(false));
  }, [filters]);

  return { data, isLoading, error };
}
