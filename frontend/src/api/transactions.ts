import type { GlobalFilters, Transaction } from "../types";
import apiClient from "./client";

function buildFilterParams(filters?: Partial<GlobalFilters>): URLSearchParams {
  const params = new URLSearchParams();

  if (filters?.accountIds?.length) {
    params.set("account_ids", filters.accountIds.join(","));
  }
  if (filters?.categoryNames?.length) {
    params.set("categories", filters.categoryNames.join(","));
  }
  if (filters?.dateRange?.from) {
    params.set("date_from", filters.dateRange.from.toString());
  }
  if (filters?.dateRange?.to) {
    params.set("date_to", filters.dateRange.to.toString());
  }

  return params;
}

export const transactionsApi = {
  getAll: async (filters?: Partial<GlobalFilters>): Promise<Transaction[]> => {
    const params = buildFilterParams(filters);
    const response = await apiClient.get<Transaction[]>("/transactions", {
      params,
    });
    return response.data;
  },
};
