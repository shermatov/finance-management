import { useForm } from "react-hook-form";
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
import { useContributeToGoal } from "@/hooks/useGoals";
import { getErrorMessage } from "@/lib/api";
import type { SavingsGoal } from "@/types";

export function ContributeDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoal | null;
}) {
  const { t } = useTranslation();
  const contribute = useContributeToGoal();

  const schema = z.object({
    amount: z.coerce.number().positive(t("validation.enterAmount")),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    if (!goal) return;
    try {
      await contribute.mutateAsync({ id: goal.id, amount: values.amount });
      toast.success(t("goals.contribute.added"));
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("goals.contribute.title", { name: goal?.name ?? "" })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">{t("goals.contribute.amount")}</Label>
            <Input id="amount" type="number" step="0.01" autoFocus {...register("amount")} />
            {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={contribute.isPending}>
              {contribute.isPending ? t("goals.contribute.adding") : t("goals.contribute.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
