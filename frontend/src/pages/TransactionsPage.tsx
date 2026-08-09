import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TransactionFiltersBar } from "@/components/transactions/TransactionFilters";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { useDeleteTransaction, useTransactions, type TransactionFilters } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const accountIdParam = searchParams.get("accountId") ?? undefined;
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 20, accountId: accountIdParam });
  const { data, isLoading } = useTransactions(filters);
  const deleteTransaction = useDeleteTransaction();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const openCreate = () => {
    setEditingTx(null);
    setFormOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTx) return;
    try {
      await deleteTransaction.mutateAsync(deletingTx.id);
      toast.success(t("transactions.deleted"));
      setDeletingTx(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("transactions.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("transactions.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("transactions.addTransaction")}
        </Button>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <TransactionFiltersBar filters={filters} onChange={setFilters} />

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("transactions.emptyTitle")}
              description={t("transactions.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("transactions.addTransaction")}
                </Button>
              }
            />
          ) : (
            <>
              <ul className="divide-y divide-border/60 sm:hidden">
                {data.items.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-3 py-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        tx.type === "INCOME"
                          ? "bg-success/10 text-success"
                          : tx.type === "TRANSFER"
                            ? "bg-primary/10 text-primary"
                            : "bg-danger/10 text-danger"
                      )}
                    >
                      {tx.type === "INCOME" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : tx.type === "TRANSFER" ? (
                        <ArrowLeftRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tx.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tx.category?.name ?? t("common.uncategorized")} · {tx.account.name} · {formatDate(tx.date)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-foreground" : "text-primary"
                      )}
                    >
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(tx.amount, tx.account.currency)}
                    </p>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={tx.type === "TRANSFER"}
                        onClick={() => openEdit(tx)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingTx(tx)}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="py-2 font-medium">{t("transactions.colTitle")}</th>
                      <th className="py-2 font-medium">{t("transactions.colCategory")}</th>
                      <th className="py-2 font-medium">{t("transactions.colAccount")}</th>
                      <th className="py-2 font-medium">{t("transactions.colDate")}</th>
                      <th className="py-2 text-right font-medium">{t("transactions.colAmount")}</th>
                      <th className="py-2 text-right font-medium">{t("transactions.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.items.map((tx) => (
                      <tr key={tx.id} className="group">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                tx.type === "INCOME"
                                  ? "bg-success/10 text-success"
                                  : tx.type === "TRANSFER"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-danger/10 text-danger"
                              )}
                            >
                              {tx.type === "INCOME" ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : tx.type === "TRANSFER" ? (
                                <ArrowLeftRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{tx.title}</div>
                              {tx.notes && <div className="text-xs text-muted-foreground">{tx.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">{tx.category?.name ?? "—"}</td>
                        <td className="py-3 text-muted-foreground">{tx.account.name}</td>
                        <td className="py-3 text-muted-foreground">{formatDate(tx.date)}</td>
                        <td
                          className={cn(
                            "py-3 text-right font-semibold tabular-nums",
                            tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-foreground" : "text-primary"
                          )}
                        >
                          {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                          {formatCurrency(tx.amount, tx.account.currency)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={tx.type === "TRANSFER"}
                              onClick={() => openEdit(tx)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingTx(tx)}>
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <span>
                  {t("transactions.countLabel", { count: data.total })} ·{" "}
                  {t("transactions.pageLabel", { page: data.page, total: Math.max(1, data.totalPages) })}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog open={formOpen} onOpenChange={setFormOpen} transaction={editingTx} />
      <ConfirmDialog
        open={!!deletingTx}
        onOpenChange={(open) => !open && setDeletingTx(null)}
        title={t("transactions.deleteTitle")}
        description={t("transactions.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deleteTransaction.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
