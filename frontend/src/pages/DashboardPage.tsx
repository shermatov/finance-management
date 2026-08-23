import { Wallet, TrendingUp, TrendingDown, HandCoins, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FinancialHealthCard } from "@/components/dashboard/FinancialHealthCard";
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList";
import { UpcomingBillsList } from "@/components/dashboard/UpcomingBillsList";
import { SavingsGoalsWidget } from "@/components/dashboard/SavingsGoalsWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">{t("dashboard.couldNotLoad")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard index={0} label={t("dashboard.currentBalance")} value={formatNumber(data.currentBalance)} icon={Wallet} tone="primary" />
        <StatCard index={1} label={t("dashboard.monthlyIncome")} value={formatNumber(data.monthlyIncome)} icon={TrendingUp} tone="success" />
        <StatCard index={2} label={t("dashboard.monthlyExpenses")} value={formatNumber(data.monthlyExpenses)} icon={TrendingDown} tone="danger" />
        <StatCard index={3} label={t("dashboard.savings")} value={formatNumber(data.savings)} icon={HandCoins} tone="warning" />
        <StatCard index={4} label={t("dashboard.netWorth")} value={formatNumber(data.netWorth)} icon={Landmark} tone="primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowChart data={data.cashFlow} />
        </div>
        <FinancialHealthCard
          score={data.financialHealthScore}
          savingsRate={data.savingsRate}
          breakdown={data.financialHealthBreakdown}
          hasGoals={data.savingsGoals.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPieChart data={data.categoryBreakdown} />
        <SavingsGoalsWidget goals={data.savingsGoals} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactionsList transactions={data.recentTransactions} />
        <UpcomingBillsList bills={data.upcomingBills} />
      </div>
    </div>
  );
}
