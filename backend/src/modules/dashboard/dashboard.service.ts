import { prisma } from "../../lib/prisma.js";
import { getUpcomingBills, listBills } from "../bills/bills.service.js";
import { listBudgets } from "../budgets/budgets.service.js";
import { convert } from "../../lib/exchangeRates.js";
import { periodRange as monthRange, currentPeriodMonthYear } from "../../lib/period.js";
import type { Currency } from "@prisma/client";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Maps `ratio` linearly onto 0-100, where `low` -> 0 and `high` -> 100, clamped at both ends. */
function ratioScore(ratio: number, low: number, high: number): number {
  return Math.round(clamp(((ratio - low) / (high - low)) * 100, 0, 100));
}

/**
 * Modeled on the Financial Health Network's FinHealth Score — a widely-used framework
 * that scores financial health across four pillars (Spend, Save, Borrow, Plan), each with
 * two concrete indicators. This uses 6 of its 8 indicators; a prime credit score and
 * insurance coverage aren't things this app has data for, so they're left out rather than
 * faked. Each pillar gets equal weight (25%); a pillar's weight splits evenly across its
 * two indicators when both are available.
 */
function computeFinancialHealth(params: {
  monthlyIncome: number;
  monthlyExpenses: number;
  liquidCash: number;
  totalDebt: number;
  bills: { status: string; dueDate: Date | null }[];
  goals: { currentAmount: number; targetAmount: number | null }[];
  budgets: { spent: number; effectiveAmount: number }[];
}) {
  const { monthlyIncome, monthlyExpenses, liquidCash, totalDebt, bills, goals, budgets } = params;

  // SPEND — spending less than you earn this month. -20% to +20% savings rate maps to 0-100.
  const savingsRatio = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  const spendLessThanIncome = { score: ratioScore(savingsRatio, -0.2, 0.2), ratio: savingsRatio };

  // SPEND — paying bills on time. Only bills with a due date can be judged; a bill with
  // none is a "pay later" backlog item, not something with an on-time/late verdict. Note:
  // recurring bills silently roll their due date forward past "now" whether or not they
  // were actually paid (see bills.service.ts), so this mostly catches one-off bills left
  // unpaid past their date — a real but partial signal, not a complete payment history.
  const datedBills = bills.filter((b) => b.dueDate !== null);
  const overdue = datedBills.filter((b) => b.status === "UNPAID" && b.dueDate! < new Date());
  const onTime = datedBills.length - overdue.length;
  const payBillsOnTime = {
    score: datedBills.length === 0 ? 100 : Math.round((onTime / datedBills.length) * 100),
    onTime,
    total: datedBills.length,
  };

  // SAVE — liquid savings as a buffer for the unexpected. 3 months of expenses covered maps to 100.
  const monthsCovered = monthlyExpenses > 0 ? liquidCash / monthlyExpenses : liquidCash > 0 ? 3 : 0;
  const liquidSavings = { score: Math.round(clamp((monthsCovered / 3) * 100, 0, 100)), monthsCovered };

  // SAVE — long-term savings, i.e. progress toward active goals with a target amount. No
  // goals set at all is treated as a neutral midpoint rather than penalized to 0 — this
  // measures progress on goals you've chosen to track, not whether you've set any.
  const targeted = goals.filter((g): g is { currentAmount: number; targetAmount: number } => !!g.targetAmount && g.targetAmount > 0);
  const avgGoalProgress =
    targeted.length === 0
      ? 0.5
      : targeted.reduce((sum, g) => sum + Math.min(1, g.currentAmount / g.targetAmount), 0) / targeted.length;
  const longTermSavings = { score: Math.round(avgGoalProgress * 100), ratio: avgGoalProgress };

  // BORROW — manageable debt load relative to annual income. 0% maps to 100, 100%+ maps to 0.
  const annualIncomeEstimate = monthlyIncome * 12;
  const debtRatio = annualIncomeEstimate > 0 ? totalDebt / annualIncomeEstimate : totalDebt > 0 ? 1 : 0;
  const manageableDebt = { score: Math.round(clamp(100 - debtRatio * 100, 0, 100)), ratio: debtRatio };

  // PLAN — planning ahead financially, measured as budgets set and stayed within. No
  // budgets at all scores 0 (there's no plan in place); otherwise it's the share of this
  // month's budgeted categories still within their limit.
  const onTrack = budgets.filter((b) => b.spent <= b.effectiveAmount).length;
  const planAhead = {
    score: budgets.length === 0 ? 0 : Math.round((onTrack / budgets.length) * 100),
    onTrack,
    total: budgets.length,
  };

  const score = Math.round(
    spendLessThanIncome.score * 0.125 +
      payBillsOnTime.score * 0.125 +
      liquidSavings.score * 0.125 +
      longTermSavings.score * 0.125 +
      manageableDebt.score * 0.25 +
      planAhead.score * 0.25
  );

  return {
    score: clamp(score, 0, 100),
    breakdown: { spendLessThanIncome, payBillsOnTime, liquidSavings, longTermSavings, manageableDebt, planAhead },
  };
}

export async function getSummary(userId: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const baseCurrency: Currency = settings?.currency ?? "USD";

  const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
  const convertedBalances = await Promise.all(
    accounts.map((a) => convert(Number(a.balance), a.currency, baseCurrency))
  );
  const currentBalance = convertedBalances.reduce((sum, b) => sum + b, 0);
  const netWorth = currentBalance; // phase 1: no liabilities/investments valuation beyond account balances

  const { start, end } = monthRange(0);
  const sixMonthsAgoStart = monthRange(5).start;

  // Fetch every income/expense transaction in the window once (with its account's
  // currency), convert each to the base currency, then bucket in JS below. Currency
  // conversion can't happen inside a Prisma aggregate/groupBy, since each row may need
  // a different rate depending on which account it belongs to.
  const periodTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: sixMonthsAgoStart }, type: { in: ["INCOME", "EXPENSE"] } },
    include: { account: true },
  });
  const convertedTransactions = await Promise.all(
    periodTransactions.map(async (tx) => ({
      ...tx,
      convertedAmount: await convert(Number(tx.amount), tx.account.currency, baseCurrency),
    }))
  );

  const cashFlow = [];
  for (let i = 5; i >= 0; i--) {
    const range = monthRange(i);
    const inRange = convertedTransactions.filter((tx) => tx.date >= range.start && tx.date < range.end);
    const income = inRange.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.convertedAmount, 0);
    const expenses = inRange.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.convertedAmount, 0);
    cashFlow.push({
      month: range.start.toLocaleString("en-US", { month: "short" }),
      income,
      expenses,
      net: income - expenses,
    });
  }
  const monthlyIncome = cashFlow[cashFlow.length - 1].income;
  const monthlyExpenses = cashFlow[cashFlow.length - 1].expenses;
  const savings = monthlyIncome - monthlyExpenses;

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  const upcomingBills = await getUpcomingBills(userId, 5);
  const allBills = await listBills(userId);

  const savingsGoals = await prisma.savingsGoal.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const currentPeriod = currentPeriodMonthYear();
  const currentBudgets = await listBudgets(userId, currentPeriod.month, currentPeriod.year);

  const currentMonthExpenses = convertedTransactions.filter(
    (tx) => tx.type === "EXPENSE" && tx.categoryId && tx.date >= start && tx.date < end
  );
  const categoryTotals = new Map<string, number>();
  for (const tx of currentMonthExpenses) {
    categoryTotals.set(tx.categoryId!, (categoryTotals.get(tx.categoryId!) ?? 0) + tx.convertedAmount);
  }
  const categories = await prisma.category.findMany({ where: { id: { in: [...categoryTotals.keys()] } } });
  const categoryBreakdown = [...categoryTotals.entries()].map(([categoryId, amount]) => {
    const category = categories.find((c) => c.id === categoryId);
    return {
      categoryId,
      name: category?.name ?? "Uncategorized",
      color: category?.color ?? "#94A3B8",
      amount,
    };
  });

  const savingsRate = monthlyIncome > 0 ? savings / monthlyIncome : 0;
  const liquidCash = convertedBalances.filter((b) => b > 0).reduce((sum, b) => sum + b, 0);
  const totalDebt = convertedBalances.filter((b) => b < 0).reduce((sum, b) => sum + Math.abs(b), 0);
  const health = computeFinancialHealth({
    monthlyIncome,
    monthlyExpenses,
    liquidCash,
    totalDebt,
    bills: allBills,
    goals: savingsGoals.map((g) => ({ currentAmount: Number(g.currentAmount), targetAmount: g.targetAmount ? Number(g.targetAmount) : null })),
    budgets: currentBudgets,
  });

  return {
    currentBalance,
    netWorth,
    baseCurrency,
    monthlyIncome,
    monthlyExpenses,
    savings,
    savingsRate,
    financialHealthScore: health.score,
    financialHealthBreakdown: health.breakdown,
    cashFlow,
    recentTransactions,
    upcomingBills,
    savingsGoals,
    categoryBreakdown,
    accounts,
  };
}
