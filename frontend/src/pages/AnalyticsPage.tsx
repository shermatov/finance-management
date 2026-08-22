import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { AccountBalanceChart } from "@/components/analytics/AccountBalanceChart";
import { DebtProgressChart } from "@/components/analytics/DebtProgressChart";
import { useAnalyticsOverview, useCategoryBreakdown } from "@/hooks/useAnalytics";
import { currentPeriodMonthYear } from "@/lib/period";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const initialPeriod = currentPeriodMonthYear(new Date());
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(12);
  const { data: categoryData, isLoading: categoryLoading } = useCategoryBreakdown(month, year);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("analytics.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
      </div>

      <Tabs defaultValue="category">
        <TabsList className="flex-wrap">
          <TabsTrigger value="category">{t("analytics.tabs.category")}</TabsTrigger>
          <TabsTrigger value="cashflow">{t("analytics.tabs.cashflow")}</TabsTrigger>
          <TabsTrigger value="balances">{t("analytics.tabs.balances")}</TabsTrigger>
          <TabsTrigger value="debt">{t("analytics.tabs.debt")}</TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold">{t(`budgets.months.${month}`)} {year}</p>
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {categoryLoading ? (
            <Skeleton className="h-72 rounded-2xl" />
          ) : (
            <CategoryPieChart data={categoryData?.breakdown ?? []} />
          )}
        </TabsContent>

        <TabsContent value="cashflow">
          {overviewLoading ? <Skeleton className="h-72 rounded-2xl" /> : <CashFlowChart data={overview?.cashFlow ?? []} />}
        </TabsContent>

        <TabsContent value="balances">
          {overviewLoading ? (
            <Skeleton className="h-72 rounded-2xl" />
          ) : (
            <AccountBalanceChart data={overview?.balanceHistory ?? []} accounts={overview?.accounts ?? []} />
          )}
        </TabsContent>

        <TabsContent value="debt">
          {overviewLoading ? (
            <Skeleton className="h-72 rounded-2xl" />
          ) : (
            <DebtProgressChart data={overview?.debtProgress ?? []} debtAccounts={overview?.debtAccounts ?? []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
