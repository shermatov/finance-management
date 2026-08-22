import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsOverview, CategoryBreakdownResponse } from "@/types";

export function useAnalyticsOverview(periods = 12) {
  return useQuery({
    queryKey: ["analytics-overview", periods],
    queryFn: async () =>
      (await api.get<AnalyticsOverview>("/analytics/overview", { params: { periods } })).data,
  });
}

export function useCategoryBreakdown(month: number, year: number) {
  return useQuery({
    queryKey: ["analytics-category-breakdown", month, year],
    queryFn: async () =>
      (await api.get<CategoryBreakdownResponse>("/analytics/category-breakdown", { params: { month, year } })).data,
  });
}
