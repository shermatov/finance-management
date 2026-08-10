import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Bill } from "@/types";

export function UpcomingBillsList({ bills }: { bills: Bill[] }) {
  const { t } = useTranslation();
  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("dashboard.upcoming.title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/bills">{t("common.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t("dashboard.upcoming.emptyTitle")}
            description={t("dashboard.upcoming.emptyDescription")}
          />
        ) : (
          <ul className="space-y-3">
            {bills.map((bill) => (
              <li key={bill.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">{bill.name}</p>
                  {bill.dueDate && (
                    <p className="text-xs text-muted-foreground">{t("dashboard.upcoming.due", { date: formatDate(bill.dueDate) })}</p>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    bill.type === "INCOME" ? "text-success" : "text-foreground"
                  )}
                >
                  {bill.type === "INCOME" ? "+" : "-"}
                  {formatNumber(bill.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
