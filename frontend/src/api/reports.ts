import { api } from "./client";
import type {
  OverviewResponse,
  AggregatedReportItem,
  GlobalFilters,
  GroupByOption,
} from "../types";

export const reportsApi = {
  getOverview: (filters?: GlobalFilters): Promise<OverviewResponse> => {
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
    return api.get(`/api/reports/overview${query ? `?${query}` : ""}`);
  },

  getAggregated: (
    groupBy: GroupByOption,
    filters?: GlobalFilters
  ): Promise<AggregatedReportItem[]> => {
    const params = new URLSearchParams();
    params.set("group_by", groupBy);

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

    return api.get(`/api/reports/aggregated?${params.toString()}`);
  },
};
