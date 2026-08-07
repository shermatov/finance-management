import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatNumber } from "@/lib/format";
import type { SavingsGoal } from "@/types";

export function SavingsGoalsWidget({ goals }: { goals: SavingsGoal[] }) {
  const { t } = useTranslation();
  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("dashboard.savingsGoals.title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/goals">{t("common.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title={t("dashboard.savingsGoals.emptyTitle")}
            description={t("dashboard.savingsGoals.emptyDescription")}
          />
        ) : (
          <ul className="space-y-4">
            {goals.map((goal) => {
              const progress = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
              return (
                <li key={goal.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(goal.currentAmount)} / {formatNumber(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
