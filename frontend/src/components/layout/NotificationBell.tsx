import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, AlertTriangle, Receipt, PartyPopper, Wallet, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useUnseenNotifications } from "@/hooks/useNotifications";
import { formatNumber, formatDate } from "@/lib/format";
import type { LiveNotification } from "@/types";

const TYPE_ICON: Record<LiveNotification["type"], LucideIcon> = {
  BUDGET_EXCEEDED: AlertTriangle,
  UPCOMING_BILL: Receipt,
  SAVINGS_MILESTONE: PartyPopper,
  LOW_BALANCE: Wallet,
};

const TYPE_TONE: Record<LiveNotification["type"], string> = {
  BUDGET_EXCEEDED: "text-danger",
  UPCOMING_BILL: "text-warning",
  SAVINGS_MILESTONE: "text-success",
  LOW_BALANCE: "text-warning",
};

function notificationText(t: ReturnType<typeof useTranslation>["t"], n: LiveNotification) {
  switch (n.type) {
    case "BUDGET_EXCEEDED":
      return {
        title: t("notifications.budgetExceeded.title", { category: n.params.category }),
        message: t("notifications.budgetExceeded.message", {
          spent: formatNumber(n.params.spent),
          amount: formatNumber(n.params.amount),
        }),
      };
    case "UPCOMING_BILL":
      return {
        title: t("notifications.upcomingBill.title", { name: n.params.name }),
        message: t("notifications.upcomingBill.message", {
          date: formatDate(n.params.date),
          amount: formatNumber(n.params.amount),
        }),
      };
    case "SAVINGS_MILESTONE":
      return {
        title: t("notifications.savingsMilestone.title", { name: n.params.name }),
        message: t("notifications.savingsMilestone.message", {
          current: formatNumber(n.params.current),
          target: formatNumber(n.params.target),
        }),
      };
    case "LOW_BALANCE":
      return {
        title: t("notifications.lowBalance.title", { account: n.params.account }),
        message: t("notifications.lowBalance.message", { balance: formatNumber(n.params.balance) }),
      };
  }
}

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();
  const { unseenCount, markAllSeen } = useUnseenNotifications(notifications);
  const count = notifications?.length ?? 0;

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllSeen()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unseenCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("notifications.empty")}</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications!.map((n, i) => {
              const Icon = TYPE_ICON[n.type];
              const { title, message } = notificationText(t, n);
              return (
                <DropdownMenuItem key={i} className="flex items-start gap-2.5 py-2.5" onClick={() => navigate(n.link)}>
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TYPE_TONE[n.type]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="truncate text-xs text-muted-foreground">{message}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
