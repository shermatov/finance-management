import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { useTheme } from "@/context/ThemeContext";
import { chartInk } from "@/lib/chart-colors";
import { formatNumber } from "@/lib/format";
import type { AccountLegendItem } from "@/types";

export function AccountBalanceChart({
  data,
  accounts,
}: {
  data: Array<Record<string, number | string>>;
  accounts: AccountLegendItem[];
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const grid = chartInk.gridline[resolvedTheme];

  if (accounts.length === 0) {
    return (
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">{t("analytics.accountBalance.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Wallet}
            title={t("analytics.accountBalance.emptyTitle")}
            description={t("analytics.accountBalance.emptyDescription")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("analytics.accountBalance.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartInk.muted, fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartInk.muted, fontSize: 12 }}
                tickFormatter={(v) => `${v >= 1000 || v <= -1000 ? `${Math.round(v / 100) / 10}k` : v}`}
                width={56}
              />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {accounts.map((account) => (
                <Line
                  key={account.name}
                  type="monotone"
                  dataKey={account.name}
                  name={account.name}
                  stroke={account.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
