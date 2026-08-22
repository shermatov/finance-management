import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { periodRangeForMonth } from "../../lib/period.js";

function categoryWhere(userId: string, categoryId: string): Prisma.TransactionWhereInput {
  return { userId, categoryId, type: "EXPENSE" };
}

/** Categories that are their own significant, deliberately-tracked concept and should never
 * roll into "Other" even though they don't have their own budget line (debt, tax, a wedding
 * fund, rent). Matched by name, same as how the "Other" budget itself is identified. */
const NEVER_ROLLS_INTO_OTHER = ["Rent", "Долг", "Налог", "Той, кошумча"];

/** The "Other" budget (matched by category name) is a rollup rather than tracking its own
 * category's transactions: it matches every EXPENSE transaction whose category doesn't have
 * its own budget line this month and isn't one of the always-separate categories above (plus
 * anything uncategorized). That way specific categories like "Present" or "Travel" can stay
 * distinctly labeled on transactions while still counting toward the Other total, without
 * needing to recategorize anything. */
async function otherWhere(
  userId: string,
  otherCategoryId: string,
  month: number,
  year: number
): Promise<Prisma.TransactionWhereInput> {
  const [otherBudgets, neverRollsCategories] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year, categoryId: { not: otherCategoryId } },
      select: { categoryId: true },
    }),
    prisma.category.findMany({
      where: { userId, name: { in: NEVER_ROLLS_INTO_OTHER } },
      select: { id: true },
    }),
  ]);
  const excludedCategoryIds = [...otherBudgets.map((b) => b.categoryId), ...neverRollsCategories.map((c) => c.id)];

  return {
    userId,
    type: "EXPENSE",
    OR: [{ categoryId: null }, { categoryId: { notIn: excludedCategoryIds } }],
  };
}

async function whereForBudget(userId: string, categoryId: string, categoryName: string, month: number, year: number) {
  return categoryName === "Other" ? otherWhere(userId, categoryId, month, year) : categoryWhere(userId, categoryId);
}

async function spentForBudget(userId: string, categoryId: string, categoryName: string, month: number, year: number) {
  const { start, end } = periodRangeForMonth(month, year);
  const where = await whereForBudget(userId, categoryId, categoryName, month, year);
  const result = await prisma.transaction.aggregate({
    where: { ...where, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

/** Walks a category's budget history in chronological order up to (month, year), carrying any
 * overspend from one month into a reduced limit for the next — going over isn't just forgotten
 * at midnight, it eats into what you have available next month for that same category. Returns
 * the effective (possibly reduced) limit for the requested month and how much was carried in. */
async function effectiveLimit(
  userId: string,
  categoryId: string,
  categoryName: string,
  month: number,
  year: number
): Promise<{ effectiveAmount: number; carriedOver: number }> {
  const history = await prisma.budget.findMany({
    where: { userId, categoryId, OR: [{ year: { lt: year } }, { year, month: { lte: month } }] },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  let carry = 0;
  for (const b of history) {
    const effective = Number(b.amount) - carry;
    if (b.month === month && b.year === year) {
      return { effectiveAmount: effective, carriedOver: carry };
    }
    const spent = await spentForBudget(userId, categoryId, categoryName, b.month, b.year);
    carry = Math.max(0, spent - effective);
  }
  return { effectiveAmount: 0, carriedOver: 0 };
}

/** The exact transactions behind a budget's "spent" figure — uses the same matching logic as
 * spentForBudget (including the Other rollup's cross-category matching), so the list always
 * adds up to precisely what the budget card shows as spent. */
export async function listBudgetTransactions(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId }, include: { category: true } });
  if (!budget) throw ApiError.notFound("Budget not found");

  const { start, end } = periodRangeForMonth(budget.month, budget.year);
  const where = await whereForBudget(userId, budget.categoryId, budget.category.name, budget.month, budget.year);

  return prisma.transaction.findMany({
    where: { ...where, date: { gte: start, lt: end } },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });
}

export async function listBudgets(userId: string, month: number, year: number) {
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  return Promise.all(
    budgets.map(async (budget) => {
      const spent = await spentForBudget(userId, budget.categoryId, budget.category.name, month, year);
      const { effectiveAmount, carriedOver } = await effectiveLimit(
        userId,
        budget.categoryId,
        budget.category.name,
        month,
        year
      );
      return {
        ...budget,
        spent,
        effectiveAmount,
        carriedOver,
        remaining: effectiveAmount - spent,
        percentage: effectiveAmount > 0 ? Math.round((spent / effectiveAmount) * 100) : spent > 0 ? 100 : 0,
      };
    })
  );
}

export async function createBudget(
  userId: string,
  input: { categoryId: string; amount: number; month: number; year: number }
) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, userId } });
  if (!category) throw ApiError.badRequest("Category not found");
  if (category.type !== "EXPENSE") throw ApiError.badRequest("Budgets can only be set on expense categories");

  const existing = await prisma.budget.findFirst({
    where: { userId, categoryId: input.categoryId, month: input.month, year: input.year },
  });
  if (existing) throw ApiError.conflict("A budget for this category and month already exists");

  return prisma.budget.create({ data: { userId, ...input }, include: { category: true } });
}

export async function updateBudget(userId: string, id: string, input: { amount: number }) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw ApiError.notFound("Budget not found");
  return prisma.budget.update({ where: { id }, data: input, include: { category: true } });
}

export async function deleteBudget(userId: string, id: string) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw ApiError.notFound("Budget not found");
  await prisma.budget.delete({ where: { id } });
}
