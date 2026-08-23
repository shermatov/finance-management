import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FinancialHealthBreakdown } from "@/types";

function factorTone(score: number) {
  if (score >= 70) return "bg-success";
  if (score >= 40) return "bg-warning";
  return "bg-danger";
}

function FactorBar({ label, score, hint }: { label: string; score: number; hint: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", factorTone(score))} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Pillar({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function FinancialHealthCard({
  score,
  savingsRate,
  breakdown,
  hasGoals,
}: {
  score: number;
  savingsRate: number;
  breakdown: FinancialHealthBreakdown;
  hasGoals: boolean;
}) {
  const { t } = useTranslation();
  const status =
    score >= 70
      ? { label: t("dashboard.health.healthy"), tone: "text-success", ring: "stroke-success", Icon: CheckCircle2 }
      : score >= 40
        ? { label: t("dashboard.health.needsAttention"), tone: "text-warning", ring: "stroke-warning", Icon: AlertTriangle }
        : { label: t("dashboard.health.atRisk"), tone: "text-danger", ring: "stroke-danger", Icon: AlertTriangle };

  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - score / 100);

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{t("dashboard.health.title")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("dashboard.health.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-6">
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={status.ring}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className={cn("flex items-center gap-1.5 text-sm font-medium", status.tone)}>
              <status.Icon className="h-4 w-4" />
              {status.label}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.health.savingsRate")}{" "}
              <span className="font-medium text-foreground">{Math.round(savingsRate * 100)}%</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border/60 pt-4">
          <Pillar label={t("dashboard.health.pillars.spend")}>
            <FactorBar
              label={t("dashboard.health.factorSpendLessThanIncome")}
              score={breakdown.spendLessThanIncome.score}
              hint={t("dashboard.health.savedThisMonth", { value: Math.round(breakdown.spendLessThanIncome.ratio * 100) })}
            />
            <FactorBar
              label={t("dashboard.health.factorPayBillsOnTime")}
              score={breakdown.payBillsOnTime.score}
              hint={
                breakdown.payBillsOnTime.total === 0
                  ? t("dashboard.health.noBillsToTrack")
                  : t("dashboard.health.billsOnTime", { onTime: breakdown.payBillsOnTime.onTime, total: breakdown.payBillsOnTime.total })
              }
            />
          </Pillar>

          <Pillar label={t("dashboard.health.pillars.save")}>
            <FactorBar
              label={t("dashboard.health.factorLiquidSavings")}
              score={breakdown.liquidSavings.score}
              hint={t("dashboard.health.monthsCovered", { value: breakdown.liquidSavings.monthsCovered.toFixed(1) })}
            />
            <FactorBar
              label={t("dashboard.health.factorLongTermSavings")}
              score={breakdown.longTermSavings.score}
              hint={
                hasGoals
                  ? t("dashboard.health.avgGoalProgress", { value: Math.round(breakdown.longTermSavings.ratio * 100) })
                  : t("dashboard.health.noGoalsYet")
              }
            />
          </Pillar>

          <Pillar label={t("dashboard.health.pillars.borrow")}>
            <FactorBar
              label={t("dashboard.health.factorManageableDebt")}
              score={breakdown.manageableDebt.score}
              hint={t("dashboard.health.ofAnnualIncome", { value: Math.round(breakdown.manageableDebt.ratio * 100) })}
            />
          </Pillar>

          <Pillar label={t("dashboard.health.pillars.plan")}>
            <FactorBar
              label={t("dashboard.health.factorPlanAhead")}
              score={breakdown.planAhead.score}
              hint={
                breakdown.planAhead.total === 0
                  ? t("dashboard.health.noBudgetsYet")
                  : t("dashboard.health.budgetsOnTrack", { onTrack: breakdown.planAhead.onTrack, total: breakdown.planAhead.total })
              }
            />
          </Pillar>
        </div>
      </CardContent>
    </Card>
  );
}
