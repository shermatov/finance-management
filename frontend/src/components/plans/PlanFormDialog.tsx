import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePlan, useUpdatePlan, type PlanInput } from "@/hooks/usePlans";
import { getErrorMessage } from "@/lib/api";
import type { Plan } from "@/types";

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
}) {
  const { t } = useTranslation();
  const isEditing = !!plan;
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const schema = z.object({
    title: z.string().min(1, t("validation.required")).max(200),
    description: z.string().max(2000).optional(),
    dueDate: z.string().optional(),
    status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", dueDate: "", status: "PLANNED" },
  });

  useEffect(() => {
    if (open) {
      reset(
        plan
          ? {
              title: plan.title,
              description: plan.description ?? "",
              dueDate: plan.dueDate ? format(new Date(plan.dueDate), "yyyy-MM-dd") : "",
              status: plan.status,
            }
          : { title: "", description: "", dueDate: "", status: "PLANNED" }
      );
    }
  }, [open, plan, reset]);

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  const onSubmit = async (values: FormValues) => {
    const input: PlanInput = {
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate || undefined,
      status: values.status,
    };
    try {
      if (isEditing && plan) {
        await updatePlan.mutateAsync({ id: plan.id, input });
        toast.success(t("plans.updated"));
      } else {
        await createPlan.mutateAsync(input);
        toast.success(t("plans.created"));
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
          <DialogTitle>{isEditing ? t("plans.editPlan") : t("plans.addPlan")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("plans.form.title")}</Label>
            <Input id="title" placeholder={t("plans.form.titlePlaceholder") ?? undefined} {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t("plans.form.description", { optional: t("common.optional") })}</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">{t("plans.form.dueDate", { optional: t("common.optional") })}</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("plans.form.status")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">{t("plans.status.PLANNED")}</SelectItem>
                      <SelectItem value="IN_PROGRESS">{t("plans.status.IN_PROGRESS")}</SelectItem>
                      <SelectItem value="DONE">{t("plans.status.DONE")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("plans.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
