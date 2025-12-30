import { useCallback, useEffect, useState } from "react";
import { accountsApi } from "../api";
import type { Account } from "../types";

interface UseAccountsResult {
  accounts: Account[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await accountsApi.getAll();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch accounts"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, isLoading, error, refetch: fetchAccounts };
}
