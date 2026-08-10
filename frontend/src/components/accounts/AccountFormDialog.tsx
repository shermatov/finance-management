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
import { useCreateAccount, useUpdateAccount, type AccountInput } from "@/hooks/useAccounts";
import { useSettings } from "@/hooks/useSettings";
import { accountColorSwatches, accountTypeIconName, accountTypeMeta, currencyOptions } from "@/lib/account-meta";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Account, AccountType, Currency } from "@/types";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const { data: settings } = useSettings();
  const defaultCurrency = settings?.currency ?? "USD";

  const schema = z.object({
    name: z.string().min(1, t("validation.required")).max(100),
    type: z.enum(["CASH", "BANK", "CREDIT_CARD", "SAVINGS", "INVESTMENT"]),
    balance: z.coerce.number().finite(),
    currency: z.enum(["USD", "EUR", "GBP", "KGS", "RUB", "KZT", "PLN"]),
    color: z.string(),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "BANK", balance: 0, currency: defaultCurrency, color: accountColorSwatches[0] },
  });

  useEffect(() => {
    if (open) {
      reset(
        account
          ? {
              name: account.name,
              type: account.type,
              balance: Number(account.balance),
              currency: account.currency,
              color: account.color,
            }
          : { name: "", type: "BANK", balance: 0, currency: defaultCurrency, color: accountColorSwatches[0] }
      );
    }
  }, [open, account, reset, defaultCurrency]);

  const isSubmitting = createAccount.isPending || updateAccount.isPending;

  const onSubmit = async (values: FormValues) => {
    const input: AccountInput = { ...values, icon: accountTypeIconName[values.type] };
    try {
      if (isEditing && account) {
        await updateAccount.mutateAsync({ id: account.id, input });
        toast.success(t("accounts.updated"));
      } else {
        await createAccount.mutateAsync(input);
        toast.success(t("accounts.created"));
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
          <DialogTitle>{isEditing ? t("accounts.editAccount") : t("accounts.addAccount")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("accounts.form.name")}</Label>
            <Input id="name" placeholder={t("accounts.form.namePlaceholder") ?? undefined} {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("accounts.form.type")}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(accountTypeMeta) as AccountType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(accountTypeMeta[type].labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("accounts.form.currency")}</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency: Currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="balance">{isEditing ? t("accounts.form.balance") : t("accounts.form.startingBalance")}</Label>
            <Input id="balance" type="number" step="0.01" {...register("balance")} />
            {errors.balance && <p className="text-xs text-danger">{errors.balance.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t("accounts.form.color")}</Label>
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
              {isSubmitting ? t("common.saving") : isEditing ? t("common.saveChanges") : t("accounts.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
