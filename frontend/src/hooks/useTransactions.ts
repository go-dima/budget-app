import { useCallback, useEffect, useState } from "react";
import { transactionsApi } from "../api";
import { useFilterContext } from "../contexts";
import type { Transaction } from "../types";

interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTransactions(): UseTransactionsResult {
  const { filters } = useFilterContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.getAll(filters);
      setTransactions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch transactions")
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}
