import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Circle, CircleDot, CheckCircle2, ChevronDown, ChevronRight, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PlanFormDialog } from "@/components/plans/PlanFormDialog";
import { usePlans, useUpdatePlan, useDeletePlan } from "@/hooks/usePlans";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

const STATUS_CYCLE: Record<Plan["status"], Plan["status"]> = {
  PLANNED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PLANNED",
};

const STATUS_ICON = {
  PLANNED: Circle,
  IN_PROGRESS: CircleDot,
  DONE: CheckCircle2,
};

const STATUS_TONE = {
  PLANNED: "text-muted-foreground",
  IN_PROGRESS: "text-warning",
  DONE: "text-success",
};

function PlanRow({
  plan,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  onToggleStatus: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}) {
  const Icon = STATUS_ICON[plan.status];
  const isDone = plan.status === "DONE";
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-3 last:border-b-0">
      <button type="button" onClick={() => onToggleStatus(plan)} className={cn("mt-0.5 shrink-0", STATUS_TONE[plan.status])}>
        <Icon className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isDone && "text-muted-foreground line-through")}>{plan.title}</p>
        {plan.description && <p className="truncate text-xs text-muted-foreground">{plan.description}</p>}
        {plan.dueDate && <p className="text-xs text-muted-foreground">{formatDate(plan.dueDate)}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(plan)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(plan)}>
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const { t } = useTranslation();
  const { data: plans, isLoading } = usePlans();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const openCreate = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleToggleStatus = async (plan: Plan) => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, input: { status: STATUS_CYCLE[plan.status] } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    try {
      await deletePlan.mutateAsync(deletingPlan.id);
      toast.success(t("plans.deleted"));
      setDeletingPlan(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const activePlans = (plans ?? []).filter((p) => p.status !== "DONE");
  const donePlans = (plans ?? []).filter((p) => p.status === "DONE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("plans.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("plans.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("plans.addPlan")}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : !plans || plans.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState
              icon={ListTodo}
              title={t("plans.emptyTitle")}
              description={t("plans.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("plans.addPlan")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5">
              {activePlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("plans.nothingActive")}</p>
              ) : (
                activePlans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} onToggleStatus={handleToggleStatus} onEdit={openEdit} onDelete={setDeletingPlan} />
                ))
              )}
            </CardContent>
          </Card>

          {donePlans.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setDoneOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {doneOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {t("plans.doneFolder", { count: donePlans.length })}
              </button>
              {doneOpen && (
                <Card className="border-border/60 shadow-soft">
                  <CardContent className="p-5">
                    {donePlans.map((plan) => (
                      <PlanRow key={plan.id} plan={plan} onToggleStatus={handleToggleStatus} onEdit={openEdit} onDelete={setDeletingPlan} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} plan={editingPlan} />
      <ConfirmDialog
        open={!!deletingPlan}
        onOpenChange={(open) => !open && setDeletingPlan(null)}
        title={t("plans.deleteTitle")}
        description={t("plans.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deletePlan.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
