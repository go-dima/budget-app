import { useCallback, useEffect, useState } from "react";
import { useFilterContext } from "../contexts";
import { reportsApi } from "../api";
import type {
  AggregatedReportItem,
  GroupByOption,
  OverviewResponse,
} from "../types";

interface UseOverviewResult {
  overview: OverviewResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOverview(): UseOverviewResult {
  const { filters } = useFilterContext();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getOverview(filters);
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch overview")
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { overview, isLoading, error, refetch: fetchOverview };
}

interface UseAggregatedReportResult {
  report: AggregatedReportItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAggregatedReport(
  groupBy: GroupByOption = "month"
): UseAggregatedReportResult {
  const { filters } = useFilterContext();
  const [report, setReport] = useState<AggregatedReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getAggregated(groupBy, filters);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch report"));
    } finally {
      setIsLoading(false);
    }
  }, [filters, groupBy]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, isLoading, error, refetch: fetchReport };
}
