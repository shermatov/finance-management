import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { HabitFormDialog } from "@/components/habits/HabitFormDialog";
import { useHabits, useToggleHabitToday, useDeleteHabit } from "@/hooks/useHabits";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

export default function HabitsPage() {
  const { t } = useTranslation();
  const { data: habits, isLoading } = useHabits();
  const toggleToday = useToggleHabitToday();
  const deleteHabit = useDeleteHabit();

  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const openCreate = () => {
    setEditingHabit(null);
    setFormOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormOpen(true);
  };

  const handleToggle = async (habit: Habit) => {
    try {
      await toggleToday.mutateAsync(habit.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingHabit) return;
    try {
      await deleteHabit.mutateAsync(deletingHabit.id);
      toast.success(t("habits.deleted"));
      setDeletingHabit(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("habits.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("habits.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("habits.addHabit")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : !habits || habits.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState
              icon={Flame}
              title={t("habits.emptyTitle")}
              description={t("habits.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("habits.addHabit")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <Card key={habit.id} className="border-border/60 shadow-soft">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{habit.title}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(habit)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingHabit(habit)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(habit)}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors",
                    habit.doneToday
                      ? "border-transparent bg-warning/15 text-warning"
                      : "border-border/60 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Flame className={cn("h-5 w-5", habit.doneToday && "fill-warning")} />
                  {habit.doneToday ? t("habits.doneToday") : t("habits.markToday")}
                </button>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("habits.currentStreak", { count: habit.currentStreak })}</span>
                  <span>{t("habits.bestStreak", { count: habit.bestStreak })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} habit={editingHabit} />
      <ConfirmDialog
        open={!!deletingHabit}
        onOpenChange={(open) => !open && setDeletingHabit(null)}
        title={t("habits.deleteTitle")}
        description={t("habits.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deleteHabit.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
