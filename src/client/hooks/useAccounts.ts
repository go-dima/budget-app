import { accountsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { AccountSummary } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useAccounts() {
  const { filters } = useFilters();
  return useFetch(() => accountsApi.getSummaries(filters), [] as AccountSummary[], [filters]);
}
