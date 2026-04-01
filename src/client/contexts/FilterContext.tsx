import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { TransactionFilters, ImportStatusResponse, Category, Account } from '../../shared/types.js';

interface FilterContextValue {
  filters: TransactionFilters;
  defaultExcludedIds: string[];
  sidebarAccounts: Account[];
  allCategories: Category[];
  setAccountIds: (ids: string[]) => void;
  setCategoryIds: (ids: string[]) => void;
  setExcludeCategories: (ids: string[]) => void;
  setDateRange: (start: string | undefined, end: string | undefined) => void;
  setType: (type: TransactionFilters['type']) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: TransactionFilters['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
  /** Re-fetches everything and resets session filters to DB defaults. Call after import. */
  refreshAll: () => void;
  /** Re-fetches category data only — does NOT reset session filter state. Call after config changes. */
  refreshCategoriesData: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function dateRangeFromAnchor(anchorDate: string) {
  const anchor = dayjs(anchorDate);
  return {
    startDate: anchor.subtract(12, 'month').startOf('month').format('YYYY-MM-DD'),
    endDate: anchor.endOf('month').format('YYYY-MM-DD'),
  };
}

function parseFromSearch(params: URLSearchParams): TransactionFilters {
  return {
    // accountIds / categoryIds / excludeCategories are NOT stored in URL —
    // they hold database-specific IDs that become stale after a reset/re-import.
    accountIds: [],
    categoryIds: [],
    excludeCategories: [],
    startDate: undefined,
    endDate: undefined,
    type: (params.get('type') as TransactionFilters['type']) ?? 'all',
    search: params.get('search') ?? undefined,
    sortBy: (params.get('sortBy') as TransactionFilters['sortBy']) ?? 'date',
    sortOrder: (params.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    page: params.get('page') ? Number(params.get('page')) : 1,
    pageSize: params.get('pageSize') ? Number(params.get('pageSize')) : 50,
  };
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<TransactionFilters>(() => parseFromSearch(searchParams));
  const [defaultExcludedIds, setDefaultExcludedIds] = useState<string[]>([]);
  const [sidebarAccounts, setSidebarAccounts] = useState<Account[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  // Tracks the last params string WE wrote, so we can ignore our own URL updates
  const lastWrittenParamsRef = useRef<string>('');

  const refreshCategoriesData = useCallback(() => {
    fetch('/api/categories')
      .then(r => r.json() as Promise<Category[]>)
      .then(cats => {
        setAllCategories(cats);
        const ids = cats.filter(c => c.excludedByDefault).map(c => c.id);
        setDefaultExcludedIds(ids);
        // Sync the filter so config changes are immediately reflected in the sidebar and queries.
        // (User can still re-check a hidden category in the sidebar without changing config.)
        setFiltersState(prev => ({ ...prev, excludeCategories: ids }));
      })
      .catch(() => {});
  }, []);

  const refreshAll = useCallback(() => {
    // Refresh date range from latest transaction
    fetch('/api/import/status')
      .then(r => r.json() as Promise<ImportStatusResponse>)
      .then(status => {
        const latestDate = status.accounts
          .map(a => a.latestDate)
          .filter(Boolean)
          .sort()
          .at(-1);
        if (latestDate) {
          const range = dateRangeFromAnchor(latestDate);
          setFiltersState(prev => ({ ...prev, startDate: range.startDate, endDate: range.endDate, page: 1 }));
        }
      })
      .catch(() => {});

    // Refresh categories + default exclusions
    fetch('/api/categories')
      .then(r => r.json() as Promise<Category[]>)
      .then(cats => {
        setAllCategories(cats);
        const ids = cats.filter(c => c.excludedByDefault).map(c => c.id);
        setDefaultExcludedIds(ids);
        setFiltersState(prev => ({ ...prev, excludeCategories: ids }));
      })
      .catch(() => {});

    // Refresh accounts for sidebar
    fetch('/api/accounts/summary')
      .then(r => r.json() as Promise<{ id: string; name: string }[]>)
      .then(summaries => {
        setSidebarAccounts(summaries.map(s => ({
          id: s.id,
          name: s.name,
          type: 'checking',
          currency: 'ILS',
          createdAt: 0,
        })));
      })
      .catch(() => {});
  }, []);

  // On mount: initialize everything
  useEffect(() => {
    refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync only non-ID filters to URL (accountIds/categoryIds/excludeCategories are
  // omitted — they hold DB-specific IDs that become stale after a reset/re-import)
  useEffect(() => {
    const p = new URLSearchParams();
    if (filters.type && filters.type !== 'all') p.set('type', filters.type);
    if (filters.search) p.set('search', filters.search);
    if (filters.sortBy && filters.sortBy !== 'date') p.set('sortBy', filters.sortBy);
    if (filters.sortOrder && filters.sortOrder !== 'desc') p.set('sortOrder', filters.sortOrder);
    if (filters.page && filters.page > 1) p.set('page', String(filters.page));
    lastWrittenParamsRef.current = p.toString();
    setSearchParams(p, { replace: true });
  }, [filters, setSearchParams]);

  // Sync FROM URL when URL changes externally (e.g. navigation with ?search=).
  // Skip updates that WE triggered to avoid infinite loops.
  useEffect(() => {
    if (searchParams.toString() === lastWrittenParamsRef.current) return;
    const urlSearch = searchParams.get('search') ?? undefined;
    if (urlSearch !== filters.search) {
      setFiltersState(prev => ({ ...prev, search: urlSearch, page: 1 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const update = useCallback((patch: Partial<TransactionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch, page: 1 }));
  }, []);

  // Stable setters — only recreated when `update` changes (which has [] deps, so never).
  const stableSetters = useMemo(() => ({
    setAccountIds: (ids: string[]) => update({ accountIds: ids }),
    setCategoryIds: (ids: string[]) => update({ categoryIds: ids }),
    setExcludeCategories: (ids: string[]) => update({ excludeCategories: ids }),
    setDateRange: (start: string | undefined, end: string | undefined) => update({ startDate: start, endDate: end }),
    setType: (type: TransactionFilters['type']) => update({ type }),
    setSearch: (search: string) => update({ search }),
    setSortBy: (sortBy: TransactionFilters['sortBy']) => update({ sortBy }),
    setSortOrder: (sortOrder: 'asc' | 'desc') => update({ sortOrder }),
    setPage: (page: number) => setFiltersState(prev => ({ ...prev, page })),
    setPageSize: (pageSize: number) => setFiltersState(prev => ({ ...prev, pageSize, page: 1 })),
  }), [update]);

  const resetFilters = useCallback(() => {
    setFiltersState(prev => ({
      ...prev,
      accountIds: [], categoryIds: [], excludeCategories: defaultExcludedIds,
      type: 'all', page: 1, sortBy: 'date', sortOrder: 'desc', search: undefined,
    }));
    refreshAll();
  }, [defaultExcludedIds, refreshAll]);

  const value = useMemo<FilterContextValue>(() => ({
    filters,
    defaultExcludedIds,
    sidebarAccounts,
    allCategories,
    refreshCategoriesData,
    refreshAll,
    resetFilters,
    ...stableSetters,
  }), [filters, defaultExcludedIds, sidebarAccounts, allCategories, refreshAll, refreshCategoriesData, resetFilters, stableSetters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
