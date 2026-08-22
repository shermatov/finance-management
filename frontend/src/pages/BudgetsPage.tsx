import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, PiggyBank, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BudgetFormDialog } from "@/components/budgets/BudgetFormDialog";
import { BudgetTransactionsDialog } from "@/components/budgets/BudgetTransactionsDialog";
import { useBudgets, useDeleteBudget } from "@/hooks/useBudgets";
import { formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { currentPeriodMonthYear } from "@/lib/period";
import type { Budget } from "@/types";

export default function BudgetsPage() {
  const { t } = useTranslation();
  const initialPeriod = currentPeriodMonthYear(new Date());
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);

  const { data: budgets, isLoading } = useBudgets(month, year);
  const deleteBudget = useDeleteBudget();
  const [expandedCarryOverId, setExpandedCarryOverId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  const openCreate = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    try {
      await deleteBudget.mutateAsync(deletingBudget.id);
      toast.success(t("budgets.deleted"));
      setDeletingBudget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const totalBudgeted = (budgets ?? []).reduce((sum, b) => sum + b.effectiveAmount, 0);
  const totalSpent = (budgets ?? []).reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("budgets.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("budgets.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("budgets.addBudget")}
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{t(`budgets.months.${month}`)} {year}</p>
          {!isLoading && budgets && budgets.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("budgets.spentOfBudgeted", { spent: formatNumber(totalSpent), budgeted: formatNumber(totalBudgeted) })}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState
              icon={PiggyBank}
              title={t("budgets.emptyTitle")}
              description={t("budgets.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("budgets.addBudget")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const overBudget = budget.percentage >= 100;
            const nominalAmount = Number(budget.amount);
            const yellowPct = nominalAmount > 0 ? Math.min(100, (budget.carriedOver / nominalAmount) * 100) : 0;
            const greenPct =
              nominalAmount > 0 ? Math.min(100 - yellowPct, (budget.spent / nominalAmount) * 100) : 0;
            const showCarryOverDetail = expandedCarryOverId === budget.id;
            return (
              <Card key={budget.id} className="border-border/60 shadow-soft">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingBudget(budget)}
                        className="flex min-w-0 items-center gap-2 hover:underline"
                        title={t("budgets.viewTransactions") ?? undefined}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: budget.category.color }} />
                        <span className="truncate text-sm font-medium">{budget.category.name}</span>
                      </button>
                      {budget.carriedOver > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedCarryOverId(showCarryOverDetail ? null : budget.id)}
                          className="shrink-0 text-warning hover:opacity-70"
                          aria-label={t("budgets.carriedOver", {
                            amount: formatNumber(budget.carriedOver),
                            original: formatNumber(budget.amount),
                            effective: formatNumber(budget.effectiveAmount),
                          }) ?? undefined}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(budget)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingBudget(budget)}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </div>

                  {showCarryOverDetail && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {t("budgets.carriedOver", {
                          amount: formatNumber(budget.carriedOver),
                          original: formatNumber(budget.amount),
                          effective: formatNumber(budget.effectiveAmount),
                        })}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium tabular-nums">{formatNumber(budget.spent)}</span>
                      <span className="text-muted-foreground">
                        {t("budgets.ofAmount", { amount: formatNumber(budget.effectiveAmount) })}
                      </span>
                    </div>
                    {overBudget ? (
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full w-full rounded-full bg-danger transition-all" />
                      </div>
                    ) : (
                      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                        {yellowPct > 0 && (
                          <div className="h-full bg-warning transition-all" style={{ width: `${yellowPct}%` }} />
                        )}
                        {greenPct > 0 && (
                          <div className="h-full bg-success transition-all" style={{ width: `${greenPct}%` }} />
                        )}
                      </div>
                    )}
                    <p className={cn("flex items-center gap-1 text-xs", overBudget ? "text-danger" : "text-muted-foreground")}>
                      {overBudget && <AlertTriangle className="h-3 w-3" />}
                      {overBudget
                        ? t("budgets.overBudget", { amount: formatNumber(Math.abs(budget.remaining)) })
                        : t("budgets.remaining", { amount: formatNumber(budget.remaining) })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        budget={editingBudget}
        month={month}
        year={year}
        usedCategoryIds={(budgets ?? []).map((b) => b.categoryId)}
      />
      <BudgetTransactionsDialog
        open={!!viewingBudget}
        onOpenChange={(open) => !open && setViewingBudget(null)}
        budget={viewingBudget}
      />
      <ConfirmDialog
        open={!!deletingBudget}
        onOpenChange={(open) => !open && setDeletingBudget(null)}
        title={t("budgets.deleteTitle")}
        description={t("budgets.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deleteBudget.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
