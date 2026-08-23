import { prisma } from "../../lib/prisma.js";
import { convert } from "../../lib/exchangeRates.js";
import { periodRangeForMonth } from "../../lib/period.js";
import type { Currency } from "@prisma/client";

export async function getSummary(userId: string, month: number, year: number) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const baseCurrency: Currency = settings?.currency ?? "USD";
  const { start, end } = periodRangeForMonth(month, year);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end }, type: { in: ["INCOME", "EXPENSE"] } },
    include: { account: true, category: true },
  });
  const converted = await Promise.all(
    transactions.map(async (tx) => ({
      ...tx,
      convertedAmount: await convert(Number(tx.amount), tx.account.currency, baseCurrency),
    }))
  );

  const income = converted.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.convertedAmount, 0);
  const expenses = converted.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.convertedAmount, 0);
  // Tax is tracked as ordinary EXPENSE transactions in a "Налог" category (see the
  // QUARTERLY auto-compute tax bill), not a separate ledger — so this is a name match,
  // same convention budgets.service.ts's NEVER_ROLLS_INTO_OTHER list already relies on.
  const taxPaid = converted
    .filter((tx) => tx.type === "EXPENSE" && tx.category?.name === "Налог")
    .reduce((s, tx) => s + tx.convertedAmount, 0);

  const categoryTotals = new Map<string, { name: string; color: string; amount: number }>();
  for (const tx of converted) {
    if (tx.type !== "EXPENSE" || !tx.categoryId) continue;
    const existing = categoryTotals.get(tx.categoryId);
    if (existing) existing.amount += tx.convertedAmount;
    else categoryTotals.set(tx.categoryId, { name: tx.category?.name ?? "Uncategorized", color: tx.category?.color ?? "#94A3B8", amount: tx.convertedAmount });
  }
  const categoryBreakdown = [...categoryTotals.entries()]
    .map(([categoryId, v]) => ({ categoryId, ...v }))
    .sort((a, b) => b.amount - a.amount);

  // No dedicated liability flag exists on Account — any account currently in the negative
  // is treated as debt, same heuristic dashboard.service.ts and analytics.service.ts use.
  const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
  const convertedBalances = await Promise.all(accounts.map((a) => convert(Number(a.balance), a.currency, baseCurrency)));
  const totalDebt = convertedBalances.filter((b) => b < 0).reduce((s, b) => s + Math.abs(b), 0);
  const debtAccountIds = accounts.filter((_, i) => convertedBalances[i] < 0).map((a) => a.id);

  const debtPayments = await prisma.transaction.findMany({
    where: { userId, type: "TRANSFER", date: { gte: start, lt: end }, transferToAccountId: { in: debtAccountIds } },
    include: { account: true },
  });
  const debtPaidAmounts = await Promise.all(
    debtPayments.map((tx) => convert(Number(tx.amount), tx.account.currency, baseCurrency))
  );
  const debtPaidThisPeriod = debtPaidAmounts.reduce((s, v) => s + v, 0);

  return {
    month,
    year,
    baseCurrency,
    income,
    expenses,
    net: income - expenses,
    savingsRate: income > 0 ? (income - expenses) / income : 0,
    taxPaid,
    totalDebt,
    debtPaidThisPeriod,
    categoryBreakdown,
  };
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function getTransactionsCsv(userId: string, month: number, year: number): Promise<string> {
  const { start, end } = periodRangeForMonth(month, year);
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  });

  const header = ["Date", "Title", "Type", "Category", "Account", "Currency", "Amount", "Notes"];
  const rows = transactions.map((tx) => [
    tx.date.toISOString().slice(0, 10),
    tx.title,
    tx.type,
    tx.category?.name ?? "",
    tx.account.name,
    tx.account.currency,
    tx.amount.toString(),
    tx.notes ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\n");
}
