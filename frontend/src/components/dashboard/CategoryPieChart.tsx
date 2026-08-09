import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { useTheme } from "@/context/ThemeContext";
import { categoricalColor } from "@/lib/chart-colors";
import { formatNumber } from "@/lib/format";
import type { CategoryBreakdownItem } from "@/types";

const MAX_SLOTS = 8;

export function CategoryPieChart({ data }: { data: CategoryBreakdownItem[] }) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (data.length === 0) {
    return (
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.categoryPie.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={PieIcon}
            title={t("dashboard.categoryPie.emptyTitle")}
            description={t("dashboard.categoryPie.emptyDescription")}
          />
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, MAX_SLOTS - 1);
  const rest = sorted.slice(MAX_SLOTS - 1);
  const restTotal = rest.reduce((sum, item) => sum + item.amount, 0);
  const chartData =
    restTotal > 0 ? [...top, { name: t("dashboard.categoryPie.other"), amount: restTotal, categoryId: null, color: "" }] : top;
  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.categoryPie.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "h-96 w-full" : "h-72 w-full"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="name"
                innerRadius={isMobile ? 50 : 60}
                outerRadius={isMobile ? 75 : 90}
                paddingAngle={2}
                strokeWidth={2}
                stroke="hsl(var(--card))"
                cy={isMobile ? "35%" : "50%"}
                label={({ percent }) => (percent >= 0.08 ? `${Math.round(percent * 100)}%` : "")}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={categoricalColor(index, resolvedTheme)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${formatNumber(value)} (${((value / total) * 100).toFixed(0)}%)`, name]}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
              />
              <Legend
                iconType="circle"
                layout={isMobile ? "horizontal" : "vertical"}
                align={isMobile ? "center" : "right"}
                verticalAlign={isMobile ? "bottom" : "middle"}
                wrapperStyle={
                  isMobile
                    ? { fontSize: 12, lineHeight: "20px", paddingTop: 16 }
                    : { fontSize: 12, lineHeight: "20px" }
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
