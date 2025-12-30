import type {
  AggregatedReportItem,
  GlobalFilters,
  GroupByOption,
  OverviewResponse,
} from "../types";
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

export const reportsApi = {
  getOverview: async (
    filters?: Partial<GlobalFilters>
  ): Promise<OverviewResponse> => {
    const params = buildFilterParams(filters);
    const response = await apiClient.get<OverviewResponse>("/reports/overview", {
      params,
    });
    return response.data;
  },

  getAggregated: async (
    groupBy: GroupByOption = "month",
    filters?: Partial<GlobalFilters>
  ): Promise<AggregatedReportItem[]> => {
    const params = buildFilterParams(filters);
    params.set("group_by", groupBy);
    const response = await apiClient.get<AggregatedReportItem[]>(
      "/reports/aggregated",
      { params }
    );
    return response.data;
  },
};
