import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

async function spentForCategory(userId: string, categoryId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const result = await prisma.transaction.aggregate({
    where: { userId, categoryId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function listBudgets(userId: string, month: number, year: number) {
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  return Promise.all(
    budgets.map(async (budget) => {
      const spent = await spentForCategory(userId, budget.categoryId, month, year);
      const amount = Number(budget.amount);
      return {
        ...budget,
        spent,
        remaining: amount - spent,
        percentage: amount > 0 ? Math.round((spent / amount) * 100) : 0,
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
