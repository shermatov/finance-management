import { prisma } from "../../lib/prisma.js";
import { convert } from "../../lib/exchangeRates.js";
import { currentPeriodMonthYear } from "../../lib/period.js";
import { listBudgets } from "../budgets/budgets.service.js";
import { getUpcomingBills } from "../bills/bills.service.js";
import type { Currency } from "@prisma/client";

export type LiveNotification =
  | { type: "BUDGET_EXCEEDED"; link: string; params: { category: string; spent: number; amount: number } }
  | { type: "UPCOMING_BILL"; link: string; params: { name: string; date: string; amount: number } }
  | { type: "SAVINGS_MILESTONE"; link: string; params: { name: string; current: number; target: number } }
  | { type: "LOW_BALANCE"; link: string; params: { account: string; balance: number } };

const UPCOMING_BILL_WINDOW_DAYS = 3;
// How low is "low"? Grounded in the user's own recent spending pace rather than a fixed
// magic number — same idea the dashboard's emergency-fund health factor already uses
// (comparing liquid cash to months of expenses), just a much tighter bar (~3 days' worth)
// since this is meant to fire before an account actually runs dry, not measure savings health.
const LOW_BALANCE_DAYS_OF_RUNWAY = 3;

/**
 * Notifications aren't persisted — each call recomputes the current live state (any budget
 * over its limit right now, any bill due within the window, any goal that's hit its target,
 * any account running low) and only for the types the user hasn't turned off in Settings.
 * That means a notification simply stops appearing once its underlying condition is
 * resolved, with no separate "mark as read" step needed.
 */
export async function getNotifications(userId: string): Promise<LiveNotification[]> {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const baseCurrency: Currency = settings?.currency ?? "USD";
  const notifications: LiveNotification[] = [];

  if (settings?.notifyBudgetExceeded !== false) {
    const { month, year } = currentPeriodMonthYear();
    const budgets = await listBudgets(userId, month, year);
    for (const budget of budgets) {
      if (budget.spent > budget.effectiveAmount) {
        notifications.push({
          type: "BUDGET_EXCEEDED",
          link: "/budgets",
          params: { category: budget.category.name, spent: budget.spent, amount: budget.effectiveAmount },
        });
      }
    }
  }

  if (settings?.notifyUpcomingBills !== false) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + UPCOMING_BILL_WINDOW_DAYS);
    const bills = await getUpcomingBills(userId, 50);
    for (const bill of bills) {
      if (bill.dueDate && bill.dueDate <= cutoff) {
        notifications.push({
          type: "UPCOMING_BILL",
          link: "/bills",
          params: { name: bill.name, date: bill.dueDate.toISOString(), amount: Number(bill.amount) },
        });
      }
    }
  }

  if (settings?.notifySavingsMilestone !== false) {
    const goals = await prisma.savingsGoal.findMany({ where: { userId, isActive: true } });
    for (const goal of goals) {
      if (goal.targetAmount && Number(goal.currentAmount) >= Number(goal.targetAmount)) {
        notifications.push({
          type: "SAVINGS_MILESTONE",
          link: "/goals",
          params: { name: goal.name, current: Number(goal.currentAmount), target: Number(goal.targetAmount) },
        });
      }
    }
  }

  if (settings?.notifyLowBalance !== false) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = await prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: thirtyDaysAgo } },
      include: { account: true },
    });
    const convertedExpenses = await Promise.all(
      recentExpenses.map((tx) => convert(Number(tx.amount), tx.account.currency, baseCurrency))
    );
    const dailySpend = convertedExpenses.reduce((s, v) => s + v, 0) / 30;

    if (dailySpend > 0) {
      const threshold = dailySpend * LOW_BALANCE_DAYS_OF_RUNWAY;
      // Only liquid, spendable account types — a low/negative CREDIT_CARD balance is normal,
      // not a low-balance alert.
      const accounts = await prisma.account.findMany({
        where: { userId, isArchived: false, type: { in: ["CASH", "BANK", "SAVINGS"] } },
      });
      for (const account of accounts) {
        const balance = await convert(Number(account.balance), account.currency, baseCurrency);
        // Excludes negative balances too — those are debt/liability-style accounts (see
        // dashboard.service.ts's debt heuristic), not accounts that are simply "running low".
        if (balance >= 0 && balance < threshold) {
          notifications.push({
            type: "LOW_BALANCE",
            link: "/accounts",
            params: { account: account.name, balance },
          });
        }
      }
    }
  }

  return notifications;
}
