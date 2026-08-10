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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBill, useUpdateBill, type BillInput } from "@/hooks/useBills";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/api";
import type { Bill } from "@/types";

export function BillFormDialog({
  open,
  onOpenChange,
  bill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Bill | null;
}) {
  const { t } = useTranslation();
  const isEditing = !!bill;
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  const schema = z.object({
    name: z.string().min(1, t("validation.required")).max(100),
    amount: z.coerce.number().positive(t("validation.enterAmount")),
    type: z.enum(["INCOME", "EXPENSE"]),
    frequency: z.enum(["ONCE", "WEEKLY", "MONTHLY", "YEARLY"]),
    dueDate: z.string().optional(),
    accountId: z.string().uuid().optional().or(z.literal("")),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    debtAccountId: z.string().uuid().optional().or(z.literal("")),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "EXPENSE", frequency: "ONCE", dueDate: format(new Date(), "yyyy-MM-dd") },
  });

  const type = watch("type");
  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  useEffect(() => {
    if (open) {
      reset(
        bill
          ? {
              name: bill.name,
              amount: Number(bill.amount),
              type: bill.type,
              frequency: bill.frequency,
              dueDate: bill.dueDate ? format(new Date(bill.dueDate), "yyyy-MM-dd") : "",
              accountId: bill.accountId ?? "",
              categoryId: bill.categoryId ?? "",
              debtAccountId: bill.debtAccountId ?? "",
            }
          : {
              name: "",
              amount: undefined,
              type: "EXPENSE",
              frequency: "ONCE",
              dueDate: format(new Date(), "yyyy-MM-dd"),
              accountId: "",
              categoryId: "",
              debtAccountId: "",
            }
      );
    }
  }, [open, bill, reset]);

  const isSubmitting = createBill.isPending || updateBill.isPending;

  const onSubmit = async (values: FormValues) => {
    const input: BillInput = {
      ...values,
      dueDate: values.dueDate || undefined,
      accountId: values.accountId || undefined,
      categoryId: values.categoryId || undefined,
      debtAccountId: values.debtAccountId || undefined,
    };
    try {
      if (isEditing && bill) {
        await updateBill.mutateAsync({ id: bill.id, input });
        toast.success(t("bills.updated"));
      } else {
        await createBill.mutateAsync(input);
        toast.success(t("bills.created"));
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
          <DialogTitle>{isEditing ? t("bills.editBill") : t("bills.addBill")}</DialogTitle>
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
            <Label htmlFor="name">{t("bills.form.name")}</Label>
            <Input id="name" placeholder={t("bills.form.namePlaceholder") ?? undefined} {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t("bills.form.amount")}</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                {isEditing
                  ? t("bills.form.nextDueDate", { optional: t("common.optional") })
                  : t("bills.form.dueDate", { optional: t("common.optional") })}
              </Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate ? (
                <p className="text-xs text-danger">{errors.dueDate.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("bills.form.dueDateHint")}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("bills.form.frequency")}</Label>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONCE">{t("bills.oneTime")}</SelectItem>
                    <SelectItem value="WEEKLY">{t("bills.weekly")}</SelectItem>
                    <SelectItem value="MONTHLY">{t("bills.monthly")}</SelectItem>
                    <SelectItem value="YEARLY">{t("bills.yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("bills.form.account", { optional: t("common.optional") })}</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.none") ?? undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">{t("bills.form.accountHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("bills.form.category", { optional: t("common.optional") })}</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.uncategorized") ?? undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("bills.form.debtAccount", { optional: t("common.optional") })}</Label>
            <Controller
              control={control}
              name="debtAccountId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.none") ?? undefined} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">{t("bills.form.debtAccountHint")}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("bills.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
