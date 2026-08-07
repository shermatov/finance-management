import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGoal, useUpdateGoal, type GoalInput } from "@/hooks/useGoals";
import { accountColorSwatches } from "@/lib/account-meta";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SavingsGoal } from "@/types";

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: SavingsGoal | null;
}) {
  const { t } = useTranslation();
  const isEditing = !!goal;
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const schema = z.object({
    name: z.string().min(1, t("validation.required")).max(100),
    targetAmount: z.coerce.number().positive(t("validation.enterTargetAmount")),
    currentAmount: z.coerce.number().min(0, t("validation.cantBeNegative")),
    deadline: z.string().optional(),
    color: z.string(),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", targetAmount: undefined, currentAmount: 0, deadline: "", color: accountColorSwatches[0] },
  });

  useEffect(() => {
    if (open) {
      reset(
        goal
          ? {
              name: goal.name,
              targetAmount: Number(goal.targetAmount),
              currentAmount: Number(goal.currentAmount),
              deadline: goal.deadline ? format(new Date(goal.deadline), "yyyy-MM-dd") : "",
              color: goal.color,
            }
          : { name: "", targetAmount: undefined, currentAmount: 0, deadline: "", color: accountColorSwatches[0] }
      );
    }
  }, [open, goal, reset]);

  const isSubmitting = createGoal.isPending || updateGoal.isPending;

  const onSubmit = async (values: FormValues) => {
    const input: GoalInput = {
      name: values.name,
      targetAmount: values.targetAmount,
      currentAmount: values.currentAmount,
      deadline: values.deadline || undefined,
      color: values.color,
      icon: "piggy-bank",
    };
    try {
      if (isEditing && goal) {
        await updateGoal.mutateAsync({ id: goal.id, input });
        toast.success(t("goals.updated"));
      } else {
        await createGoal.mutateAsync(input);
        toast.success(t("goals.created"));
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
          <DialogTitle>{isEditing ? t("goals.editGoal") : t("goals.addGoal")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("goals.form.name")}</Label>
            <Input id="name" placeholder={t("goals.form.namePlaceholder") ?? undefined} {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">{t("goals.form.targetAmount")}</Label>
              <Input id="targetAmount" type="number" step="0.01" {...register("targetAmount")} />
              {errors.targetAmount && <p className="text-xs text-danger">{errors.targetAmount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentAmount">{t("goals.form.startingAmount")}</Label>
              <Input id="currentAmount" type="number" step="0.01" {...register("currentAmount")} />
              {errors.currentAmount && <p className="text-xs text-danger">{errors.currentAmount.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline">{t("goals.form.deadline", { optional: t("common.optional") })}</Label>
            <Input id="deadline" type="date" {...register("deadline")} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("goals.form.color")}</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {accountColorSwatches.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                        field.value === color && "ring-2 ring-foreground"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("goals.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
