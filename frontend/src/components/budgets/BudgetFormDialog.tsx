import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBudget, useUpdateBudget } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/api";
import type { Budget } from "@/types";

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  month,
  year,
  usedCategoryIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
  month: number;
  year: number;
  usedCategoryIds: string[];
}) {
  const { t } = useTranslation();
  const isEditing = !!budget;
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const schema = z.object({
    categoryId: z.string().uuid(t("validation.selectCategory")),
    amount: z.coerce.number().positive(t("validation.enterAmount")),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(
        budget
          ? { categoryId: budget.categoryId, amount: Number(budget.amount) }
          : { categoryId: "", amount: undefined }
      );
    }
  }, [open, budget, reset]);

  const isSubmitting = createBudget.isPending || updateBudget.isPending;
  const availableCategories = (categories ?? []).filter(
    (c) => c.type === "EXPENSE" && (isEditing || !usedCategoryIds.includes(c.id))
  );

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && budget) {
        await updateBudget.mutateAsync({ id: budget.id, amount: values.amount });
        toast.success(t("budgets.updated"));
      } else {
        await createBudget.mutateAsync({ ...values, month, year });
        toast.success(t("budgets.created"));
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
          <DialogTitle>{isEditing ? t("budgets.editBudget") : t("budgets.addBudget")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("budgets.form.category")}</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("budgets.form.selectCategory") ?? undefined} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <p className="text-xs text-danger">{errors.categoryId.message}</p>}
            {!isEditing && availableCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("budgets.form.allCategorized")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">{t("budgets.form.monthlyLimit")}</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("budgets.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
