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

export function FinancialHealthCard({
  score,
  savingsRate,
  breakdown,
}: {
  score: number;
  savingsRate: number;
  breakdown: FinancialHealthBreakdown;
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
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.health.title")}</CardTitle>
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

        <div className="space-y-3 border-t border-border/60 pt-4">
          <FactorBar
            label={t("dashboard.health.factorSavingsRate")}
            score={breakdown.savingsRate.score}
            hint={t("dashboard.health.thisMonth", { value: Math.round(breakdown.savingsRate.value * 100) })}
          />
          <FactorBar
            label={t("dashboard.health.factorDebt")}
            score={breakdown.debtToIncome.score}
            hint={t("dashboard.health.ofAnnualIncome", { value: Math.round(breakdown.debtToIncome.value * 100) })}
          />
          <FactorBar
            label={t("dashboard.health.factorEmergency")}
            score={breakdown.emergencyFund.score}
            hint={t("dashboard.health.monthsCovered", { value: breakdown.emergencyFund.value.toFixed(1) })}
          />
          <FactorBar
            label={t("dashboard.health.factorTrend")}
            score={breakdown.trend.score}
            hint={t("dashboard.health.avgNetVsIncome", { value: Math.round(breakdown.trend.value * 100) })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
