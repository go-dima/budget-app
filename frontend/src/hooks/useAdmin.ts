import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api";
import type { DbInfo } from "../types";

interface UseDbInfoResult {
  databases: DbInfo[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDbInfo(): UseDbInfoResult {
  const [databases, setDatabases] = useState<DbInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDatabases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDatabases();
      setDatabases(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch database info")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  return { databases, isLoading, error, refetch: fetchDatabases };
}

interface UseExcludedCategoriesResult {
  excludedCategories: string[];
  isLoading: boolean;
  error: Error | null;
  updateExcluded: (categories: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useExcludedCategories(): UseExcludedCategoriesResult {
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExcluded = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getExcludedCategories();
      setExcludedCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch excluded categories")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExcluded = useCallback(async (categories: string[]) => {
    try {
      const data = await adminApi.setExcludedCategories(categories);
      setExcludedCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to update excluded categories")
      );
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchExcluded();
  }, [fetchExcluded]);

  return {
    excludedCategories,
    isLoading,
    error,
    updateExcluded,
    refetch: fetchExcluded,
  };
}
