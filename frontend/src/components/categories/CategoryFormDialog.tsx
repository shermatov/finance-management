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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { accountColorSwatches } from "@/lib/account-meta";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}) {
  const { t } = useTranslation();
  const isEditing = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const schema = z.object({
    name: z.string().min(1, t("validation.required")).max(100),
    type: z.enum(["INCOME", "EXPENSE"]),
    color: z.string(),
  });
  type FormValues = z.infer<typeof schema>;
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "EXPENSE", color: accountColorSwatches[0] },
  });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? { name: category.name, type: category.type as "INCOME" | "EXPENSE", color: category.color }
          : { name: "", type: "EXPENSE", color: accountColorSwatches[0] }
      );
    }
  }, [open, category, reset]);

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, input: { ...values, icon: category.icon } });
        toast.success(t("categories.updated"));
      } else {
        await createCategory.mutateAsync({ ...values, icon: "tag" });
        toast.success(t("categories.created"));
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
          <DialogTitle>{isEditing ? t("categories.editCategory") : t("categories.addCategory")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={field.onChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="EXPENSE">{t("common.expense")}</TabsTrigger>
                  <TabsTrigger value="INCOME">{t("common.income")}</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="name">{t("categories.form.name")}</Label>
            <Input id="name" placeholder={t("categories.form.namePlaceholder") ?? undefined} {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t("categories.form.color")}</Label>
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
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("categories.createCategory")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
