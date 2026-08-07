import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MoreVertical, Plus, Wallet, ArrowLeftRight, Pencil, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { TransferDialog } from "@/components/accounts/TransferDialog";
import { useAccounts, useUpdateAccount } from "@/hooks/useAccounts";
import { accountTypeMeta } from "@/lib/account-meta";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/api";
import type { Account } from "@/types";

export default function AccountsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: accounts, isLoading } = useAccounts();
  const updateAccount = useUpdateAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [archivingAccount, setArchivingAccount] = useState<Account | null>(null);

  const openCreate = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleArchive = async () => {
    if (!archivingAccount) return;
    try {
      await updateAccount.mutateAsync({ id: archivingAccount.id, input: { isArchived: true } as never });
      toast.success(t("accounts.archived"));
      setArchivingAccount(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("accounts.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("accounts.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={!accounts || accounts.length < 2}>
            <ArrowLeftRight className="mr-2 h-4 w-4" /> {t("accounts.transfer")}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("accounts.addAccount")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState
              icon={Wallet}
              title={t("accounts.emptyTitle")}
              description={t("accounts.emptyDescription")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("accounts.addAccount")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const meta = accountTypeMeta[account.type];
            return (
              <Card
                key={account.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/transactions?accountId=${account.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/transactions?accountId=${account.id}`);
                }}
                className="cursor-pointer border-border/60 shadow-soft transition-shadow hover:shadow-glow"
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: account.color }}
                    >
                      <meta.icon className="h-5 w-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => openEdit(account)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setArchivingAccount(account)} className="text-danger">
                          <Archive className="mr-2 h-4 w-4" /> {t("common.archive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{account.name}</p>
                  <p
                    className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
                    title={formatCurrency(account.balance, account.currency)}
                  >
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <Badge variant="outline" className="mt-3 text-xs">
                    {t(meta.labelKey)}
                  </Badge>
                  <p className="mt-3 text-xs text-muted-foreground">{t("accounts.viewHistory")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AccountFormDialog open={formOpen} onOpenChange={setFormOpen} account={editingAccount} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} accounts={accounts ?? []} />
      <ConfirmDialog
        open={!!archivingAccount}
        onOpenChange={(open) => !open && setArchivingAccount(null)}
        title={t("accounts.archiveTitle")}
        description={t("accounts.archiveDescription")}
        confirmLabel={t("common.archive")}
        destructive
        isLoading={updateAccount.isPending}
        onConfirm={handleArchive}
      />
    </div>
  );
}
