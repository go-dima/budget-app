import { api } from "./client";
import type { Account } from "../types";

export const accountsApi = {
  list: (): Promise<Account[]> => api.get("/api/accounts"),

  get: (id: string): Promise<Account> => api.get(`/api/accounts/${id}`),
};
