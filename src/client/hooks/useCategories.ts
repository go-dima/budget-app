import { useEffect, useState } from 'react';
import { categoriesApi } from '../httpClient/client.js';
import type { Category } from '../../shared/types.js';

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    categoriesApi.getAll().then(d => { setData(d); setError(null); }).catch(e => setError(e as Error)).finally(() => setIsLoading(false));
  }, []);
  return { data, isLoading, error };
}
