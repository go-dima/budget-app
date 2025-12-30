import type { Account } from "../types";
import apiClient from "./client";

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>("/accounts");
    return response.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  },
};
