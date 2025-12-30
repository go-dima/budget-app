import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { accountsApi, adminApi } from "../api";
import type { GlobalFilters } from "../types";
import { FilterContext } from "./FilterContextDef";

function getDateRangeOneYearBack(fromDate: Date): { from: number; to: number } {
  const to = new Date(fromDate);
  const from = new Date(fromDate);
  from.setFullYear(from.getFullYear() - 1);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  return {
    from: Math.floor(from.getTime() / 1000),
    to: Math.floor(to.getTime() / 1000),
  };
}

function getDefaultDateRange(): { from: number; to: number } {
  return getDateRangeOneYearBack(new Date());
}

const defaultFilters: GlobalFilters = {
  accountIds: [],
  categoryNames: [],
  dateRange: getDefaultDateRange(),
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [lastTransactionDate, setLastTransactionDate] = useState<number | null>(null);
  const [dateRangeInitialized, setDateRangeInitialized] = useState(false);

  const refreshCategories = useCallback(async () => {
    try {
      const [categories, excluded] = await Promise.all([
        adminApi.getCategories(),
        adminApi.getExcludedCategories(),
      ]);
      setAllCategories(categories);
      setExcludedCategories(excluded);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const refreshAccounts = useCallback(async (updateDateRange = false) => {
    try {
      const accounts = await accountsApi.list();
      // Find the latest transaction date across all accounts
      const latestDate = accounts.reduce<number | null>((latest, account) => {
        if (account.last_transaction_date === null) return latest;
        if (latest === null) return account.last_transaction_date;
        return Math.max(latest, account.last_transaction_date);
      }, null);
      setLastTransactionDate(latestDate);

      // Set date range based on last transaction (on init or when forced)
      if ((!dateRangeInitialized || updateDateRange) && latestDate !== null) {
        const lastDate = new Date(latestDate * 1000);
        const range = getDateRangeOneYearBack(lastDate);
        setFilters((prev) => ({ ...prev, dateRange: range }));
        setDateRangeInitialized(true);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  }, [dateRangeInitialized]);

  useEffect(() => {
    // Initial data fetch on mount
    const loadInitialData = async () => {
      await Promise.all([refreshCategories(), refreshAccounts()]);
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAccountIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, accountIds: ids }));
  }, []);

  const setCategoryNames = useCallback((names: string[]) => {
    setFilters((prev) => ({ ...prev, categoryNames: names }));
  }, []);

  const setDateRange = useCallback((from: number | null, to: number | null) => {
    setFilters((prev) => ({ ...prev, dateRange: { from, to } }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const setDateRangeFromLastTransaction = useCallback(() => {
    if (lastTransactionDate !== null) {
      const lastDate = new Date(lastTransactionDate * 1000);
      const range = getDateRangeOneYearBack(lastDate);
      setFilters((prev) => ({ ...prev, dateRange: range }));
    }
  }, [lastTransactionDate]);

  const setDateRangeFromToday = useCallback(() => {
    const range = getDateRangeOneYearBack(new Date());
    setFilters((prev) => ({ ...prev, dateRange: range }));
  }, []);

  const value = useMemo(
    () => ({
      filters,
      excludedCategories,
      allCategories,
      lastTransactionDate,
      setAccountIds,
      setCategoryNames,
      setDateRange,
      setDateRangeFromLastTransaction,
      setDateRangeFromToday,
      resetFilters,
      refreshCategories,
      refreshAccounts,
    }),
    [
      filters,
      excludedCategories,
      allCategories,
      lastTransactionDate,
      setAccountIds,
      setCategoryNames,
      setDateRange,
      setDateRangeFromLastTransaction,
      setDateRangeFromToday,
      resetFilters,
      refreshCategories,
      refreshAccounts,
    ]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
