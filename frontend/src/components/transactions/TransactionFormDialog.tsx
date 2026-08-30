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
import { useCreateTransaction, useUpdateTransaction, type TransactionInput } from "@/hooks/useTransactions";
import { AttachmentsSection } from "./AttachmentsSection";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/api";
import type { Transaction } from "@/types";

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
}) {
  const { t } = useTranslation();
  const isEditing = !!transaction;
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const schema = z.object({
    title: z.string().min(1, t("validation.required")).max(200),
    amount: z.coerce.number().positive(t("validation.enterAmount")),
    type: z.enum(["INCOME", "EXPENSE"]),
    date: z.string().min(1, t("validation.required")),
    accountId: z.string().uuid(t("validation.selectAccount")),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    notes: z.string().max(2000).optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "EXPENSE", date: format(new Date(), "yyyy-MM-dd") },
  });

  const type = watch("type");

  useEffect(() => {
    if (open) {
      reset(
        transaction
          ? {
              title: transaction.title,
              amount: Number(transaction.amount),
              type: transaction.type as "INCOME" | "EXPENSE",
              date: format(new Date(transaction.date), "yyyy-MM-dd"),
              accountId: transaction.accountId,
              categoryId: transaction.categoryId ?? "",
              notes: transaction.notes ?? "",
            }
          : { title: "", amount: undefined, type: "EXPENSE", date: format(new Date(), "yyyy-MM-dd"), accountId: "", categoryId: "", notes: "" }
      );
    }
  }, [open, transaction, reset]);

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;
  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  const onSubmit = async (values: FormValues) => {
    const input: TransactionInput = {
      ...values,
      categoryId: values.categoryId || undefined,
    };
    try {
      if (isEditing && transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, input });
        toast.success(t("transactions.updated"));
      } else {
        await createTransaction.mutateAsync(input);
        toast.success(t("transactions.added"));
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
          <DialogTitle>{isEditing ? t("transactions.editTransaction") : t("transactions.addTransaction")}</DialogTitle>
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
            <Label htmlFor="title">{t("transactions.form.titleLabel")}</Label>
            <Input id="title" placeholder={t("transactions.form.titlePlaceholder") ?? undefined} {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t("transactions.form.amount")}</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">{t("transactions.form.date")}</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("transactions.form.account")}</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactions.form.selectAccount") ?? undefined} />
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
              {errors.accountId && <p className="text-xs text-danger">{errors.accountId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("transactions.form.category")}</Label>
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
            <Label htmlFor="notes">{t("transactions.form.notesLabel", { optional: t("common.optional") })}</Label>
            <Input id="notes" {...register("notes")} />
          </div>

          {isEditing && transaction && <AttachmentsSection transactionId={transaction.id} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("transactions.addTransaction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
