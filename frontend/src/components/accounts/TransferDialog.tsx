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
import { useTransferBetweenAccounts } from "@/hooks/useAccounts";
import { getErrorMessage } from "@/lib/api";
import type { Account } from "@/types";

export function TransferDialog({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
}) {
  const { t } = useTranslation();
  const transfer = useTransferBetweenAccounts();

  const schema = z
    .object({
      fromAccountId: z.string().uuid(t("validation.selectAccount")),
      toAccountId: z.string().uuid(t("validation.selectAccount")),
      amount: z.coerce.number().positive(t("validation.enterAmount")),
      notes: z.string().optional(),
    })
    .refine((data) => data.fromAccountId !== data.toAccountId, {
      message: t("validation.sourceDestinationDiffer"),
      path: ["toAccountId"],
    });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const fromAccountId = watch("fromAccountId");
  const toAccountId = watch("toAccountId");
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const currenciesDiffer = !!fromAccount && !!toAccount && fromAccount.currency !== toAccount.currency;

  const onSubmit = async (values: FormValues) => {
    try {
      await transfer.mutateAsync(values);
      toast.success(t("accounts.transferDialog.completed"));
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
          <DialogTitle>{t("accounts.transferDialog.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("accounts.transferDialog.from")}</Label>
              <Controller
                control={control}
                name="fromAccountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("accounts.transferDialog.selectAccount") ?? undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.fromAccountId && <p className="text-xs text-danger">{errors.fromAccountId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("accounts.transferDialog.to")}</Label>
              <Controller
                control={control}
                name="toAccountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("accounts.transferDialog.selectAccount") ?? undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.toAccountId && <p className="text-xs text-danger">{errors.toAccountId.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">
              {fromAccount
                ? t("accounts.transferDialog.amountInCurrency", { currency: fromAccount.currency })
                : t("accounts.transferDialog.amount")}
            </Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount ? (
              <p className="text-xs text-danger">{errors.amount.message}</p>
            ) : currenciesDiffer ? (
              <p className="text-xs text-muted-foreground">
                {t("accounts.transferDialog.currencyConvertHint", {
                  from: fromAccount!.currency,
                  to: toAccount!.currency,
                })}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("accounts.transferDialog.notes", { optional: t("common.optional") })}</Label>
            <Input id="notes" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={transfer.isPending}>
              {transfer.isPending ? t("accounts.transferDialog.transferring") : t("accounts.transferDialog.transfer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
