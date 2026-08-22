import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useBudgetTransactions } from "@/hooks/useBudgets";
import { formatCurrency, formatDate } from "@/lib/format";
import { Receipt } from "lucide-react";
import type { Budget } from "@/types";

export function BudgetTransactionsDialog({
  open,
  onOpenChange,
  budget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
}) {
  const { t } = useTranslation();
  const { data: transactions, isLoading } = useBudgetTransactions(open ? budget?.id ?? null : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("budgets.transactionsDialog.title", { category: budget?.category.name ?? "" })}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState icon={Receipt} title={t("budgets.transactionsDialog.emptyTitle")} />
        ) : (
          <ul className="divide-y divide-border/60">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tx.category?.name ?? t("common.uncategorized")} · {tx.account.name} · {formatDate(tx.date)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCurrency(tx.amount, tx.account.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
