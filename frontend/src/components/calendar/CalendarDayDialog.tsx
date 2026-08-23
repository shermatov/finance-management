import { useTranslation } from "react-i18next";
import { CalendarDays, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatNumber, currentLocale } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarBillOccurrence, Transaction } from "@/types";

export function CalendarDayDialog({
  open,
  onOpenChange,
  date,
  transactions,
  bills,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  transactions: Transaction[];
  bills: CalendarBillOccurrence[];
}) {
  const { t } = useTranslation();
  const title = date
    ? new Intl.DateTimeFormat(currentLocale(), { weekday: "long", month: "long", day: "numeric" }).format(date)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {bills.length === 0 && transactions.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t("calendar.dayDialog.empty")} />
        ) : (
          <div className="space-y-5">
            {bills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {t("calendar.dayDialog.bills")}
                </p>
                <ul className="divide-y divide-border/60">
                  {bills.map((bill) => (
                    <li key={`${bill.billId}-${bill.date}`} className="flex items-center gap-3 py-3">
                      <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{bill.name}</p>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          bill.type === "INCOME" ? "text-success" : "text-danger"
                        )}
                      >
                        {bill.type === "INCOME" ? "+" : "-"}
                        {formatNumber(bill.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {transactions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {t("calendar.dayDialog.transactions")}
                </p>
                <ul className="divide-y divide-border/60">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{tx.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tx.category?.name ?? t("common.uncategorized")} · {tx.account.name}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-danger" : ""
                        )}
                      >
                        {formatCurrency(tx.amount, tx.account.currency)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
