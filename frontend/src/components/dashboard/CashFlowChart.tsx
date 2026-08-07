import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/context/ThemeContext";
import { chartInk, chartSeries } from "@/lib/chart-colors";
import { formatNumber } from "@/lib/format";
import type { CashFlowPoint } from "@/types";
import { EmptyState } from "@/components/common/EmptyState";
import { TrendingUp } from "lucide-react";

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const income = chartSeries.income[resolvedTheme];
  const expense = chartSeries.expense[resolvedTheme];
  const grid = chartInk.gridline[resolvedTheme];
  const hasActivity = data.some((point) => point.income > 0 || point.expenses > 0);

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.cashFlow.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasActivity ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={income} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={income} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={expense} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={expense} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartInk.muted, fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: chartInk.muted, fontSize: 12 }}
                  tickFormatter={(v) => `${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`}
                  width={56}
                />
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={t("dashboard.cashFlow.income")}
                  stroke={income}
                  strokeWidth={2}
                  fill="url(#income-gradient)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={t("dashboard.cashFlow.expenses")}
                  stroke={expense}
                  strokeWidth={2}
                  fill="url(#expense-gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title={t("dashboard.cashFlow.emptyTitle")}
            description={t("dashboard.cashFlow.emptyDescription")}
          />
        )}
      </CardContent>
    </Card>
  );
}
