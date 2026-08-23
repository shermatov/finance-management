import type { TFunction } from "i18next";
import type { FinancialHealthBreakdown } from "@/types";

export const FACTOR_KEYS = [
  "spendLessThanIncome",
  "payBillsOnTime",
  "liquidSavings",
  "longTermSavings",
  "manageableDebt",
  "planAhead",
] as const;

export type FactorKey = (typeof FACTOR_KEYS)[number];

export const FACTOR_PILLAR: Record<FactorKey, "spend" | "save" | "borrow" | "plan"> = {
  spendLessThanIncome: "spend",
  payBillsOnTime: "spend",
  liquidSavings: "save",
  longTermSavings: "save",
  manageableDebt: "borrow",
  planAhead: "plan",
};

export function factorLabel(key: FactorKey, t: TFunction): string {
  const map: Record<FactorKey, string> = {
    spendLessThanIncome: t("dashboard.health.factorSpendLessThanIncome"),
    payBillsOnTime: t("dashboard.health.factorPayBillsOnTime"),
    liquidSavings: t("dashboard.health.factorLiquidSavings"),
    longTermSavings: t("dashboard.health.factorLongTermSavings"),
    manageableDebt: t("dashboard.health.factorManageableDebt"),
    planAhead: t("dashboard.health.factorPlanAhead"),
  };
  return map[key];
}

export function factorHint(key: FactorKey, breakdown: FinancialHealthBreakdown, t: TFunction, hasGoals: boolean): string {
  switch (key) {
    case "spendLessThanIncome":
      return t("dashboard.health.savedThisMonth", { value: Math.round(breakdown.spendLessThanIncome.ratio * 100) });
    case "payBillsOnTime":
      return breakdown.payBillsOnTime.total === 0
        ? t("dashboard.health.noBillsToTrack")
        : t("dashboard.health.billsOnTime", { onTime: breakdown.payBillsOnTime.onTime, total: breakdown.payBillsOnTime.total });
    case "liquidSavings":
      return t("dashboard.health.monthsCovered", { value: breakdown.liquidSavings.monthsCovered.toFixed(1) });
    case "longTermSavings":
      return hasGoals
        ? t("dashboard.health.avgGoalProgress", { value: Math.round(breakdown.longTermSavings.ratio * 100) })
        : t("dashboard.health.noGoalsYet");
    case "manageableDebt":
      return t("dashboard.health.ofAnnualIncome", { value: Math.round(breakdown.manageableDebt.ratio * 100) });
    case "planAhead":
      return breakdown.planAhead.total === 0
        ? t("dashboard.health.noBudgetsYet")
        : t("dashboard.health.budgetsOnTrack", { onTrack: breakdown.planAhead.onTrack, total: breakdown.planAhead.total });
  }
}

export function weakestFactor(breakdown: FinancialHealthBreakdown): FactorKey {
  return FACTOR_KEYS.reduce((min, key) => (breakdown[key].score < breakdown[min].score ? key : min), FACTOR_KEYS[0]);
}

export function healthStatus(score: number): "healthy" | "needsAttention" | "atRisk" {
  if (score >= 70) return "healthy";
  if (score >= 40) return "needsAttention";
  return "atRisk";
}
