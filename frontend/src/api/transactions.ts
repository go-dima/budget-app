import { api } from "./client";
import type { Transaction, GlobalFilters } from "../types";

export const transactionsApi = {
  list: (filters?: GlobalFilters): Promise<Transaction[]> => {
    const params = new URLSearchParams();

    if (filters?.accountIds?.length) {
      params.set("account_ids", filters.accountIds.join(","));
    }
    if (filters?.categoryNames?.length) {
      params.set("categories", filters.categoryNames.join(","));
    }
    if (filters?.dateRange?.from != null) {
      params.set("date_from", String(filters.dateRange.from));
    }
    if (filters?.dateRange?.to != null) {
      params.set("date_to", String(filters.dateRange.to));
    }

    const query = params.toString();
    return api.get(`/api/transactions${query ? `?${query}` : ""}`);
  },
};
