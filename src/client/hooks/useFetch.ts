import { useEffect, useRef, useState } from 'react';

export function useFetch<T>(
  fetcher: () => Promise<T>,
  initialData: T,
  deps: React.DependencyList,
): { data: T; isLoading: boolean; error: Error | null; reload: () => void } {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetcherRef.current()
      .then(d => {
        if (!cancelled) { setData(d); setError(null); }
      })
      .catch(e => {
        if (!cancelled) setError(e as Error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, isLoading, error, reload };
}
