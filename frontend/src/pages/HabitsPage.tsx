import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { HabitFormDialog } from "@/components/habits/HabitFormDialog";
import { useHabits, useLogHabitToday, useDeleteHabit } from "@/hooks/useHabits";
import { getErrorMessage } from "@/lib/api";
import { currentLocale } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

function weekdayLabels(): string[] {
  const today = new Date();
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels.push(new Intl.DateTimeFormat(currentLocale(), { weekday: "narrow" }).format(d));
  }
  return labels;
}

function WeekActivity({ last7Days, color }: { last7Days: boolean[]; color: string }) {
  const labels = useMemo(weekdayLabels, []);
  return (
    <div className="flex items-center justify-between gap-1">
      {last7Days.map((done, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
          <div
            className={cn("h-5 w-5 rounded-md border", !done && "border-border/60 bg-secondary")}
            style={done ? { backgroundColor: color, borderColor: color } : undefined}
          />
        </div>
      ))}
    </div>
  );
}

function HabitCard({
  habit,
  onLog,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  onLog: (habit: Habit, value?: number) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
            >
              <Flame className="h-5 w-5" />
            </div>
            <p className="min-w-0 truncate text-sm font-medium">{habit.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(habit)}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        </div>

        <WeekActivity last7Days={habit.last7Days} color={habit.color} />

        {habit.unit ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("habits.todayLabel")}</span>
              <span className="flex items-center gap-1.5 font-medium">
                {t("habits.todayAmount", { value: habit.todayValue ?? 0, unit: habit.unit })}
                {!!habit.todayValue && (
                  <button
                    type="button"
                    onClick={() => onLog(habit, 0)}
                    className="text-muted-foreground hover:text-danger"
                    aria-label={t("common.delete") ?? undefined}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const amount = Number(value);
                if (amount > 0) onLog(habit, amount);
                setValue("");
              }}
            >
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={t("habits.addAmountPlaceholder", { unit: habit.unit }) ?? undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-10"
              />
              <Button type="submit" className="shrink-0">
                {t("habits.add")}
              </Button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onLog(habit)}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
              habit.doneToday
                ? "border-transparent bg-warning/15 text-warning"
                : "border-border/60 text-muted-foreground hover:bg-secondary"
            )}
          >
            <Flame className={cn("h-4 w-4", habit.doneToday && "fill-warning")} />
            {habit.doneToday ? t("habits.doneToday") : t("habits.markToday")}
          </button>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Flame className="h-3.5 w-3.5" style={{ color: habit.color }} />
            {t("habits.currentStreak", { count: habit.currentStreak })}
          </span>
          <span>{t("habits.bestStreak", { count: habit.bestStreak })}</span>
        </div>
        {habit.unit && habit.totalValue > 0 && (
          <p className="-mt-2 text-xs text-muted-foreground">{t("habits.totalValue", { value: habit.totalValue, unit: habit.unit })}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HabitsPage() {
  const { t } = useTranslation();
  const { data: habits, isLoading } = useHabits();
  const logToday = useLogHabitToday();
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

  const handleLog = async (habit: Habit, value?: number) => {
    try {
      await logToday.mutateAsync({ id: habit.id, value });
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

  const doneTodayCount = (habits ?? []).filter((h) => h.doneToday).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("habits.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("habits.subtitle")}</p>
          {!isLoading && habits && habits.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("habits.summary", { total: habits.length, done: doneTodayCount })}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("habits.addHabit")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
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
            <HabitCard key={habit.id} habit={habit} onLog={handleLog} onEdit={openEdit} onDelete={setDeletingHabit} />
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
