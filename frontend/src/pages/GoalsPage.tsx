import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Target,
  Pencil,
  Trash2,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GoalFormDialog } from "@/components/goals/GoalFormDialog";
import { ContributeDialog } from "@/components/goals/ContributeDialog";
import { useGoals, useDeleteGoal } from "@/hooks/useGoals";
import { formatNumber, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import type { SavingsGoal } from "@/types";

export default function GoalsPage() {
  const { t } = useTranslation();
  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
  const [somedayOpen, setSomedayOpen] = useState(false);

  const openCreate = () => {
    setEditingGoal(null);
    setFormOpen(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const openActivate = (goal: SavingsGoal) => {
    setEditingGoal({ ...goal, isActive: true });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoal.mutateAsync(deletingGoal.id);
      toast.success(t("goals.deleted"));
      setDeletingGoal(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const activeGoals = (goals ?? []).filter((g) => g.isActive);
  const somedayGoals = (goals ?? []).filter((g) => !g.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("goals.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("goals.addGoal")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState
              icon={Target}
              title={t("goals.emptyTitle")}
              description={t("goals.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("goals.addGoal")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("goals.nothingActive")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((goal) => {
                const current = Number(goal.currentAmount);
                const target = Number(goal.targetAmount);
                const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                const achieved = current >= target;
                return (
                  <Card key={goal.id} className="border-border/60 shadow-soft">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{goal.name}</p>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground">{t("goals.by", { date: formatDate(goal.deadline) })}</p>
                          )}
                        </div>
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                          style={{ backgroundColor: goal.color }}
                        >
                          {achieved ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium tabular-nums">{formatNumber(current)}</span>
                          <span className="text-muted-foreground">{t("goals.ofAmount", { amount: formatNumber(target) })}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: goal.color }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {achieved ? t("goals.goalReached", { percent: progress }) : t("goals.fundedPercent", { percent: progress })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 pt-1">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setContributingGoal(goal)}>
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> {t("goals.addFunds")}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(goal)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingGoal(goal)}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {somedayGoals.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSomedayOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {somedayOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Folder className="h-4 w-4" />
                {t("goals.somedayFolder", { count: somedayGoals.length })}
              </button>
              {somedayOpen && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {somedayGoals.map((goal) => (
                    <Card key={goal.id} className="border-border/60 shadow-soft">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-medium">{goal.name}</p>
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: goal.color }}
                          >
                            <Target className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("goals.somedayHint")}</p>
                        <div className="flex items-center gap-1 pt-1">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openActivate(goal)}>
                            <Zap className="mr-1.5 h-3.5 w-3.5" /> {t("goals.activate")}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingGoal(goal)}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} goal={editingGoal} />
      <ContributeDialog
        open={!!contributingGoal}
        onOpenChange={(open) => !open && setContributingGoal(null)}
        goal={contributingGoal}
      />
      <ConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        title={t("goals.deleteTitle")}
        description={t("goals.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deleteGoal.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
