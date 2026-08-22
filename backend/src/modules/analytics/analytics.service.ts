import { prisma } from "../../lib/prisma.js";
import { convert } from "../../lib/exchangeRates.js";
import { periodRange, periodRangeForMonth, currentPeriodMonthYear } from "../../lib/period.js";
import type { Currency } from "@prisma/client";

function periodLabel(start: Date) {
  return `${start.toLocaleString("en-US", { month: "short" })} ${start.getFullYear()}`;
}

export async function getCategoryBreakdown(userId: string, month?: number, year?: number) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const baseCurrency: Currency = settings?.currency ?? "USD";

  const current = currentPeriodMonthYear();
  const m = month ?? current.month;
  const y = year ?? current.year;
  const { start, end } = periodRangeForMonth(m, y);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", categoryId: { not: null }, date: { gte: start, lt: end } },
    include: { account: true, category: true },
  });

  const totals = new Map<string, { name: string; color: string; amount: number }>();
  for (const tx of transactions) {
    const amount = await convert(Number(tx.amount), tx.account.currency, baseCurrency);
    const existing = totals.get(tx.categoryId!);
    if (existing) {
      existing.amount += amount;
    } else {
      totals.set(tx.categoryId!, {
        name: tx.category?.name ?? "Uncategorized",
        color: tx.category?.color ?? "#94A3B8",
        amount,
      });
    }
  }

  const breakdown = [...totals.entries()].map(([categoryId, v]) => ({ categoryId, ...v }));
  const total = breakdown.reduce((s, b) => s + b.amount, 0);

  return { month: m, year: y, baseCurrency, total, breakdown };
}

/**
 * Signed effect a transaction has on one specific account's balance — positive if it
 * grows the account, negative if it shrinks it. Transfers only touch the two accounts
 * named on the row; income/expense only touch their own account.
 */
function deltaFor(
  tx: { type: string; accountId: string; transferFromAccountId: string | null; transferToAccountId: string | null; convertedAmount: number },
  accountId: string
): number {
  if (tx.type === "INCOME" && tx.accountId === accountId) return tx.convertedAmount;
  if (tx.type === "EXPENSE" && tx.accountId === accountId) return -tx.convertedAmount;
  if (tx.type === "TRANSFER") {
    if (tx.transferFromAccountId === accountId) return -tx.convertedAmount;
    if (tx.transferToAccountId === accountId) return tx.convertedAmount;
  }
  return 0;
}

export async function getOverview(userId: string, periods = 12) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const baseCurrency: Currency = settings?.currency ?? "USD";

  const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
  const earliestStart = periodRange(periods - 1).start;

  // Fetch every transaction in the window once (with its account's currency), convert each
  // to the base currency, then bucket in JS below — same approach dashboard.service.ts uses,
  // since the conversion rate depends on each row's own account currency.
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: earliestStart } },
    include: { account: true },
  });
  const converted = await Promise.all(
    rows.map(async (tx) => ({
      ...tx,
      convertedAmount: await convert(Number(tx.amount), tx.account.currency, baseCurrency),
    }))
  );

  const boundaries = [];
  for (let i = periods - 1; i >= 0; i--) {
    boundaries.push({ i, start: periodRange(i).start, label: periodLabel(periodRange(i).start) });
  }

  // --- cash flow trend ---
  const cashFlow = boundaries.map(({ i, label }) => {
    const range = periodRange(i);
    const inRange = converted.filter((tx) => tx.date >= range.start && tx.date < range.end);
    const income = inRange.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.convertedAmount, 0);
    const expenses = inRange.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.convertedAmount, 0);
    return { month: label, income, expenses, net: income - expenses };
  });

  // --- balance history: walk backward from each account's live balance today, subtracting
  // the net effect of everything that happened at/after each period boundary. Uses today's
  // exchange rate throughout (same simplification as the rest of the app — no historical
  // rate lookups), so this is an approximation for accounts whose currency isn't baseCurrency.
  const currentBalances = new Map(
    await Promise.all(accounts.map(async (a) => [a.id, await convert(Number(a.balance), a.currency, baseCurrency)] as const))
  );

  const balancesAtBoundary = boundaries.map(({ start }) => {
    const map = new Map<string, number>();
    for (const account of accounts) {
      const current = currentBalances.get(account.id) ?? 0;
      const laterDelta = converted
        .filter(
          (tx) =>
            tx.date >= start &&
            (tx.accountId === account.id || tx.transferFromAccountId === account.id || tx.transferToAccountId === account.id)
        )
        .reduce((sum, tx) => sum + deltaFor(tx, account.id), 0);
      map.set(account.id, current - laterDelta);
    }
    return map;
  });

  const balanceHistory = boundaries.map(({ label }, idx) => {
    const point: Record<string, number | string> = { month: label };
    for (const account of accounts) point[account.name] = balancesAtBoundary[idx].get(account.id) ?? 0;
    return point;
  });

  // --- debt progress: no dedicated liability flag exists on Account, so any account
  // currently in negative balance is treated as debt — same heuristic dashboard.service.ts
  // already uses for the financial-health debt-to-income factor.
  const debtAccounts = accounts.filter((a) => (currentBalances.get(a.id) ?? 0) < 0);
  const debtProgress = boundaries.map(({ label }, idx) => {
    const point: Record<string, number | string> = { month: label };
    let total = 0;
    for (const account of debtAccounts) {
      const magnitude = Math.max(0, -(balancesAtBoundary[idx].get(account.id) ?? 0));
      point[account.name] = magnitude;
      total += magnitude;
    }
    point.total = total;
    return point;
  });

  return {
    baseCurrency,
    cashFlow,
    balanceHistory,
    accounts: accounts.map((a) => ({ name: a.name, color: a.color })),
    debtProgress,
    debtAccounts: debtAccounts.map((a) => ({ name: a.name, color: a.color })),
  };
}
