import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listGoals(userId: string) {
  return prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export async function createGoal(
  userId: string,
  input: {
    name: string;
    targetAmount?: number;
    currentAmount: number;
    deadline?: Date;
    isActive: boolean;
    icon: string;
    color: string;
  }
) {
  return prisma.savingsGoal.create({ data: { userId, ...input } });
}

export async function updateGoal(userId: string, id: string, input: Record<string, unknown>) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw ApiError.notFound("Savings goal not found");
  return prisma.savingsGoal.update({ where: { id }, data: input as never });
}

export async function deleteGoal(userId: string, id: string) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw ApiError.notFound("Savings goal not found");
  await prisma.savingsGoal.delete({ where: { id } });
}

export async function contributeToGoal(userId: string, id: string, amount: number) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw ApiError.notFound("Savings goal not found");
  return prisma.savingsGoal.update({
    where: { id },
    data: { currentAmount: { increment: amount } },
  });
}
