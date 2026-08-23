import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CalendarMonthResponse } from "@/types";

export function useCalendarMonth(month: number, year: number) {
  return useQuery({
    queryKey: ["calendar", month, year],
    queryFn: async () =>
      (await api.get<CalendarMonthResponse>("/calendar", { params: { month, year } })).data,
  });
}
