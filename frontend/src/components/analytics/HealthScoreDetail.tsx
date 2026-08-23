import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { factorLabel, factorHint, healthStatus, FACTOR_PILLAR, type FactorKey } from "@/lib/financial-health";
import type { FinancialHealthBreakdown } from "@/types";

const STATUS_STYLE = {
  healthy: { tone: "text-success", ring: "stroke-success", Icon: CheckCircle2 },
  needsAttention: { tone: "text-warning", ring: "stroke-warning", Icon: AlertTriangle },
  atRisk: { tone: "text-danger", ring: "stroke-danger", Icon: AlertTriangle },
};

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

function Pillar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

const PILLAR_ORDER: Array<"spend" | "save" | "borrow" | "plan"> = ["spend", "save", "borrow", "plan"];

export function HealthScoreDetail({
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
  const status = STATUS_STYLE[healthStatus(score)];
  const statusLabel = t(`dashboard.health.${healthStatus(score)}`);

  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - score / 100);

  const factorsByPillar = PILLAR_ORDER.map((pillar) => ({
    pillar,
    keys: (Object.keys(FACTOR_PILLAR) as FactorKey[]).filter((key) => FACTOR_PILLAR[key] === pillar),
  }));

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
              {statusLabel}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.health.savingsRate")}{" "}
              <span className="font-medium text-foreground">{Math.round(savingsRate * 100)}%</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
          {factorsByPillar.map(({ pillar, keys }) => (
            <Pillar key={pillar} label={t(`dashboard.health.pillars.${pillar}`)}>
              {keys.map((key) => (
                <FactorBar
                  key={key}
                  label={factorLabel(key, t)}
                  score={breakdown[key].score}
                  hint={factorHint(key, breakdown, t, hasGoals)}
                />
              ))}
            </Pillar>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
