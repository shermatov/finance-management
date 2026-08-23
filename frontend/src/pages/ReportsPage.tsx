import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Coins, Receipt, Landmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { useReportSummary, useExportReportCsv } from "@/hooks/useReports";
import { formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import { currentPeriodMonthYear } from "@/lib/period";

export default function ReportsPage() {
  const { t } = useTranslation();
  const initialPeriod = currentPeriodMonthYear(new Date());
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);

  const { data, isLoading } = useReportSummary(month, year);
  const exportCsv = useExportReportCsv();

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  const handleExport = async () => {
    try {
      await exportCsv.mutateAsync({ month, year });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("reports.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("reports.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exportCsv.isPending}>
          <Download className="mr-2 h-4 w-4" /> {t("reports.exportCsv")}
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">{t(`budgets.months.${month}`)} {year}</p>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : !data ? (
        <p className="text-sm text-danger">{t("reports.couldNotLoad")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <StatCard index={0} label={t("reports.income")} value={formatNumber(data.income)} icon={TrendingUp} tone="success" />
            <StatCard index={1} label={t("reports.expenses")} value={formatNumber(data.expenses)} icon={TrendingDown} tone="danger" />
            <StatCard
              index={2}
              label={t("reports.net")}
              value={formatNumber(data.net)}
              icon={Coins}
              tone={data.net >= 0 ? "success" : "danger"}
            />
            <StatCard index={3} label={t("reports.taxPaid")} value={formatNumber(data.taxPaid)} icon={Receipt} tone="warning" />
            <StatCard index={4} label={t("reports.totalDebt")} value={formatNumber(data.totalDebt)} icon={Landmark} tone="danger" />
          </div>

          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">{t("reports.categoryBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryBreakdown.length === 0 ? (
                <EmptyState icon={Receipt} title={t("reports.emptyBreakdown")} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 font-medium">{t("reports.table.category")}</th>
                        <th className="pb-2 text-right font-medium">{t("reports.table.amount")}</th>
                        <th className="pb-2 text-right font-medium">{t("reports.table.percent")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {data.categoryBreakdown.map((item) => (
                        <tr key={item.categoryId ?? "uncategorized"}>
                          <td className="py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                              {item.name}
                            </span>
                          </td>
                          <td className="py-2.5 text-right tabular-nums">{formatNumber(item.amount)}</td>
                          <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                            {data.expenses > 0 ? `${((item.amount / data.expenses) * 100).toFixed(0)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
