import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  PiggyBank,
  Target,
  Receipt,
  BarChart3,
  CalendarDays,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  soon?: boolean;
}

export const navItems: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { labelKey: "nav.transactions", path: "/transactions", icon: ArrowLeftRight },
  { labelKey: "nav.accounts", path: "/accounts", icon: Wallet },
  { labelKey: "nav.categories", path: "/categories", icon: Tags },
  { labelKey: "nav.budgets", path: "/budgets", icon: PiggyBank },
  { labelKey: "nav.goals", path: "/goals", icon: Target },
  { labelKey: "nav.bills", path: "/bills", icon: Receipt },
  { labelKey: "nav.analytics", path: "/analytics", icon: BarChart3 },
  { labelKey: "nav.calendar", path: "/calendar", icon: CalendarDays, soon: true },
  { labelKey: "nav.reports", path: "/reports", icon: FileText, soon: true },
  { labelKey: "nav.settings", path: "/settings", icon: Settings },
];
