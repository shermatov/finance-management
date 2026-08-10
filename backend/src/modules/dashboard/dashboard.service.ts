import { prisma } from "../../lib/prisma.js";
import { getUpcomingBills } from "../bills/bills.service.js";

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
  return { start, end };
}

async function sumByType(userId: string, type: "INCOME" | "EXPENSE", start: Date, end: Date) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

interface HealthFactor {
  score: number;
  value: number;
}

/**
 * Composite score across four factors, weighted by how much each one actually
 * predicts financial trouble: savings rate (30%), debt load relative to income (25%),
 * cash buffer vs. a 3-month emergency fund (25%), and whether the last 3 months are
 * trending better or worse (20%). Each sub-score maps its raw ratio onto 0-100 before
 * weighting, so one bad factor can't be fully masked by one good one.
 */
function computeFinancialHealth(params: {
  accounts: { balance: number }[];
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: { income: number; expenses: number; net: number }[];
}) {
  const { accounts, monthlyIncome, monthlyExpenses, cashFlow } = params;

  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  const savingsRateFactor: HealthFactor = {
    score: Math.round(clamp(((savingsRate + 0.2) / 0.4) * 100, 0, 100)),
    value: savingsRate,
  };

  const totalDebt = accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const annualIncomeEstimate = monthlyIncome * 12;
  const debtToIncomeRatio = annualIncomeEstimate > 0 ? totalDebt / annualIncomeEstimate : totalDebt > 0 ? 1 : 0;
  const debtFactor: HealthFactor = {
    score: Math.round(clamp(100 - debtToIncomeRatio * 100, 0, 100)),
    value: debtToIncomeRatio,
  };

  const liquidCash = accounts.filter((a) => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
  const monthsCovered = monthlyExpenses > 0 ? liquidCash / monthlyExpenses : liquidCash > 0 ? 3 : 0;
  const emergencyFundFactor: HealthFactor = {
    score: Math.round(clamp((monthsCovered / 3) * 100, 0, 100)),
    value: monthsCovered,
  };

  const recentMonths = cashFlow.slice(-3);
  const avgIncome = recentMonths.reduce((s, m) => s + m.income, 0) / recentMonths.length;
  const avgNet = recentMonths.reduce((s, m) => s + m.net, 0) / recentMonths.length;
  const trendRate = avgIncome > 0 ? avgNet / avgIncome : 0;
  const trendFactor: HealthFactor = {
    score: Math.round(clamp(((trendRate + 0.2) / 0.4) * 100, 0, 100)),
    value: trendRate,
  };

  const score = Math.round(
    savingsRateFactor.score * 0.3 + debtFactor.score * 0.25 + emergencyFundFactor.score * 0.25 + trendFactor.score * 0.2
  );

  return {
    score: clamp(score, 0, 100),
    breakdown: {
      savingsRate: savingsRateFactor,
      debtToIncome: debtFactor,
      emergencyFund: emergencyFundFactor,
      trend: trendFactor,
    },
  };
}

export async function getSummary(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
  const currentBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const netWorth = currentBalance; // phase 1: no liabilities/investments valuation beyond account balances

  const { start, end } = monthRange(0);
  const [monthlyIncome, monthlyExpenses] = await Promise.all([
    sumByType(userId, "INCOME", start, end),
    sumByType(userId, "EXPENSE", start, end),
  ]);
  const savings = monthlyIncome - monthlyExpenses;

  const cashFlow = [];
  for (let i = 5; i >= 0; i--) {
    const range = monthRange(i);
    const [income, expenses] = await Promise.all([
      sumByType(userId, "INCOME", range.start, range.end),
      sumByType(userId, "EXPENSE", range.start, range.end),
    ]);
    cashFlow.push({
      month: range.start.toLocaleString("en-US", { month: "short" }),
      income,
      expenses,
      net: income - expenses,
    });
  }

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  const upcomingBills = await getUpcomingBills(userId, 5);

  const savingsGoals = await prisma.savingsGoal.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const categoryBreakdownRaw = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end }, categoryId: { not: null } },
    _sum: { amount: true },
  });
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryBreakdownRaw.map((c) => c.categoryId!).filter(Boolean) } },
  });
  const categoryBreakdown = categoryBreakdownRaw.map((row) => {
    const category = categories.find((c) => c.id === row.categoryId);
    return {
      categoryId: row.categoryId,
      name: category?.name ?? "Uncategorized",
      color: category?.color ?? "#94A3B8",
      amount: Number(row._sum.amount ?? 0),
    };
  });

  const savingsRate = monthlyIncome > 0 ? savings / monthlyIncome : 0;
  const health = computeFinancialHealth({
    accounts: accounts.map((a) => ({ balance: Number(a.balance) })),
    monthlyIncome,
    monthlyExpenses,
    cashFlow,
  });

  return {
    currentBalance,
    netWorth,
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
