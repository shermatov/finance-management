import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateHabit, useUpdateHabit } from "@/hooks/useHabits";
import { getErrorMessage } from "@/lib/api";
import type { Habit } from "@/types";

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
}) {
  const { t } = useTranslation();
  const isEditing = !!habit;
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const schema = z.object({
    title: z.string().min(1, t("validation.required")).max(200),
    unit: z.string().max(30).optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", unit: "" },
  });

  useEffect(() => {
    if (open) reset({ title: habit?.title ?? "", unit: habit?.unit ?? "" });
  }, [open, habit, reset]);

  const isSubmitting = createHabit.isPending || updateHabit.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && habit) {
        await updateHabit.mutateAsync({ id: habit.id, input: { title: values.title, unit: values.unit || null } });
        toast.success(t("habits.updated"));
      } else {
        await createHabit.mutateAsync({ title: values.title, unit: values.unit || undefined });
        toast.success(t("habits.created"));
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t("habits.editHabit") : t("habits.addHabit")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("habits.form.title")}</Label>
            <Input id="title" placeholder={t("habits.form.titlePlaceholder") ?? undefined} {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit">{t("habits.form.unit", { optional: t("common.optional") })}</Label>
            <Input id="unit" placeholder={t("habits.form.unitPlaceholder") ?? undefined} {...register("unit")} />
            <p className="text-xs text-muted-foreground">{t("habits.form.unitHint")}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("habits.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
