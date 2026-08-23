import { Wallet, Landmark, CreditCard, HandCoins, TrendingUp, type LucideIcon } from "lucide-react";
import type { AccountType, Currency } from "@/types";

export const accountTypeMeta: Record<AccountType, { labelKey: string; icon: LucideIcon }> = {
  CASH: { labelKey: "accounts.types.cash", icon: Wallet },
  BANK: { labelKey: "accounts.types.bank", icon: Landmark },
  CREDIT_CARD: { labelKey: "accounts.types.creditCard", icon: CreditCard },
  SAVINGS: { labelKey: "accounts.types.savings", icon: HandCoins },
  INVESTMENT: { labelKey: "accounts.types.investment", icon: TrendingUp },
};

export const accountTypeIconName: Record<AccountType, string> = {
  CASH: "wallet",
  BANK: "landmark",
  CREDIT_CARD: "credit-card",
  SAVINGS: "hand-coins",
  INVESTMENT: "trending-up",
};

export const currencyOptions: Currency[] = ["USD", "EUR", "GBP", "KGS", "RUB", "KZT", "PLN"];

export const accountColorSwatches = [
  "#4F46E5",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];
