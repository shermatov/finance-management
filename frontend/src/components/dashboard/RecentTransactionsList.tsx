import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatNumber, formatDate } from "@/lib/format";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";

export function RecentTransactionsList({ transactions }: { transactions: Transaction[] }) {
  const { t } = useTranslation();
  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("dashboard.recentTx.title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/transactions">{t("common.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t("dashboard.recentTx.emptyTitle")}
            description={t("dashboard.recentTx.emptyDescription")}
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    tx.type === "INCOME" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  )}
                >
                  {tx.type === "INCOME" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category?.name ?? t("common.uncategorized")} · {formatDate(tx.date)}
                  </p>
                </div>
                <p className={cn("shrink-0 text-sm font-semibold tabular-nums", tx.type === "INCOME" ? "text-success" : "text-foreground")}>
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatNumber(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
