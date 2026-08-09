import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BillFormDialog } from "@/components/bills/BillFormDialog";
import { useBills, useDeleteBill, useMarkBillPaid } from "@/hooks/useBills";
import { formatNumber, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Bill } from "@/types";

export default function BillsPage() {
  const { t } = useTranslation();
  const { data: bills, isLoading } = useBills();
  const deleteBill = useDeleteBill();
  const markPaid = useMarkBillPaid();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [paidOpen, setPaidOpen] = useState(false);

  const openCreate = () => {
    setEditingBill(null);
    setFormOpen(true);
  };

  const openEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBill) return;
    try {
      await deleteBill.mutateAsync(deletingBill.id);
      toast.success(t("bills.deleted"));
      setDeletingBill(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMarkPaid = async () => {
    if (!payingBill) return;
    const isOnce = payingBill.frequency === "ONCE";
    try {
      await markPaid.mutateAsync(payingBill.id);
      if (isOnce) {
        toast.success(payingBill.type === "INCOME" ? t("bills.markedReceived") : t("bills.markedPaid"));
      } else {
        toast.success(payingBill.type === "INCOME" ? t("bills.markedReceivedNext") : t("bills.markedPaidNext"));
      }
      setPayingBill(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const renderBillCard = (bill: Bill) => {
    const isOnce = bill.frequency === "ONCE";
    const isPaid = bill.status === "PAID";
    const isOverdue = !isPaid && new Date(bill.dueDate) < new Date();
    const frequencyLabel = isOnce
      ? t("bills.oneTime")
      : t(`bills.${bill.frequency.toLowerCase()}` as "bills.weekly" | "bills.monthly" | "bills.yearly");
    return (
      <Card key={bill.id} className={cn("border-border/60 shadow-soft", isPaid && "opacity-60")}>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-2 sm:items-center sm:gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:mt-0 sm:h-10 sm:w-10",
                bill.type === "INCOME" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              )}
            >
              {bill.type === "INCOME" ? (
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              ) : (
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{bill.name}</p>
              <p
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-danger" : "text-muted-foreground"
                )}
              >
                {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                <span className="truncate">
                  {isPaid
                    ? t("bills.paid")
                    : `${frequencyLabel} · ${isOverdue ? t("bills.overdue") : t("bills.due")} ${formatDate(bill.dueDate)}`}
                </span>
              </p>
            </div>
            <p className={cn("shrink-0 text-sm font-semibold tabular-nums", bill.type === "INCOME" ? "text-success" : "text-foreground")}>
              {bill.type === "INCOME" ? "+" : "-"}
              {formatNumber(bill.amount)}
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
            {!isPaid && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-10 sm:w-10"
                title={isOnce ? t("bills.markAsPaid") ?? undefined : t("bills.markCycleDone") ?? undefined}
                onClick={() => setPayingBill(bill)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-success sm:h-4 sm:w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-10 sm:w-10" onClick={() => openEdit(bill)}>
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-10 sm:w-10" onClick={() => setDeletingBill(bill)}>
              <Trash2 className="h-3.5 w-3.5 text-danger sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const activeBills = (bills ?? []).filter((b) => b.status !== "PAID");
  const paidBills = (bills ?? []).filter((b) => b.status === "PAID");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("bills.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("bills.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("bills.addBill")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : !bills || bills.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState
              icon={Receipt}
              title={t("bills.emptyTitle")}
              description={t("bills.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("bills.addBill")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("bills.nothingActive")}</p>
          ) : (
            <div className="space-y-3">{activeBills.map(renderBillCard)}</div>
          )}

          {paidBills.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaidOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {paidOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Folder className="h-4 w-4" />
                {t("bills.paidFolder", { count: paidBills.length })}
              </button>
              {paidOpen && <div className="space-y-3">{paidBills.map(renderBillCard)}</div>}
            </div>
          )}
        </div>
      )}

      <BillFormDialog open={formOpen} onOpenChange={setFormOpen} bill={editingBill} />
      <ConfirmDialog
        open={!!deletingBill}
        onOpenChange={(open) => !open && setDeletingBill(null)}
        title={t("bills.deleteTitle")}
        description={t("bills.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deleteBill.isPending}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={!!payingBill}
        onOpenChange={(open) => !open && setPayingBill(null)}
        title={payingBill?.type === "INCOME" ? t("bills.confirmReceivedTitle") : t("bills.confirmPaidTitle")}
        description={
          payingBill
            ? t("bills.confirmDescription", {
                amount: formatNumber(payingBill.amount),
                type: payingBill.type === "INCOME" ? t("common.income") : t("common.expense"),
                next:
                  payingBill.frequency !== "ONCE"
                    ? t("bills.confirmDescriptionNext")
                    : t("bills.confirmDescriptionOnce"),
              })
            : undefined
        }
        confirmLabel={payingBill?.type === "INCOME" ? t("bills.markAsReceived") : t("bills.markAsPaid")}
        isLoading={markPaid.isPending}
        onConfirm={handleMarkPaid}
      />
    </div>
  );
}
