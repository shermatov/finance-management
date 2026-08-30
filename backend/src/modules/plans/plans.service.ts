import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { PlanStatus } from "@prisma/client";

export async function listPlans(userId: string) {
  const plans = await prisma.plan.findMany({ where: { userId } });
  // Active plans (Planned/In Progress) before Done, sorted by due date within that
  // group — dateless plans sort last, same convention bills.service.ts's listBills uses.
  return plans.sort((a, b) => {
    const aDone = a.status === "DONE" ? 1 : 0;
    const bDone = b.status === "DONE" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

export async function createPlan(
  userId: string,
  input: { title: string; description?: string; dueDate?: Date; status: PlanStatus }
) {
  return prisma.plan.create({ data: { userId, ...input } });
}

export async function updatePlan(userId: string, id: string, input: Record<string, unknown>) {
  const plan = await prisma.plan.findFirst({ where: { id, userId } });
  if (!plan) throw ApiError.notFound("Plan not found");
  return prisma.plan.update({ where: { id }, data: input as never });
}

export async function deletePlan(userId: string, id: string) {
  const plan = await prisma.plan.findFirst({ where: { id, userId } });
  if (!plan) throw ApiError.notFound("Plan not found");
  await prisma.plan.delete({ where: { id } });
}
