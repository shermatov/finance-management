import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReportSummary } from "@/types";

export function useReportSummary(month: number, year: number) {
  return useQuery({
    queryKey: ["report-summary", month, year],
    queryFn: async () =>
      (await api.get<ReportSummary>("/reports/summary", { params: { month, year } })).data,
  });
}

export function useExportReportCsv() {
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const res = await api.get("/reports/export", { params: { month, year }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${year}-${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
