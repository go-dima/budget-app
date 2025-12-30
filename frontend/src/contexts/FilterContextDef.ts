import { createContext } from "react";
import type { GlobalFilters } from "../types";

export interface FilterContextValue {
  filters: GlobalFilters;
  excludedCategories: string[];
  allCategories: string[];
  lastTransactionDate: number | null;
  setAccountIds: (ids: string[]) => void;
  setCategoryNames: (names: string[]) => void;
  setDateRange: (from: number | null, to: number | null) => void;
  setDateRangeFromLastTransaction: () => void;
  setDateRangeFromToday: () => void;
  resetFilters: () => void;
  refreshCategories: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

export const FilterContext = createContext<FilterContextValue | null>(null);
