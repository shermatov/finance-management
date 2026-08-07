import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

type Frequency = "ONCE" | "WEEKLY" | "MONTHLY" | "YEARLY";

function advance(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (frequency === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  return next;
}

/** Rolls a recurring bill's dueDate forward past "now", resetting status for the new cycle. One-off bills are left alone — a past due date just means it's overdue, not that it should reschedule itself. */
async function rollForwardIfPast(bill: { id: string; dueDate: Date; frequency: Frequency; status: string }) {
  if (bill.frequency === "ONCE" || bill.dueDate >= new Date()) return bill;

  let dueDate = bill.dueDate;
  while (dueDate < new Date()) {
    dueDate = advance(dueDate, bill.frequency);
  }

  return prisma.bill.update({
    where: { id: bill.id },
    data: { dueDate, status: "UNPAID" },
  });
}

export async function listBills(userId: string) {
  const bills = await prisma.bill.findMany({ where: { userId }, orderBy: { dueDate: "asc" } });
  const rolled = await Promise.all(bills.map((bill) => rollForwardIfPast(bill)));
  return rolled.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function getUpcomingBills(userId: string, limit: number) {
  const bills = await listBills(userId);
  return bills.filter((b) => b.status === "UNPAID").slice(0, limit);
}

async function assertOwnedAccount(userId: string, accountId?: string) {
  if (!accountId) return;
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw ApiError.badRequest("Account not found");
}

async function assertOwnedCategory(userId: string, categoryId?: string) {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw ApiError.badRequest("Category not found");
}

export async function createBill(
  userId: string,
  input: {
    name: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    frequency: Frequency;
    dueDate: Date;
    categoryId?: string;
    accountId?: string;
  }
) {
  await assertOwnedAccount(userId, input.accountId);
  await assertOwnedCategory(userId, input.categoryId);
  return prisma.bill.create({ data: { userId, ...input } });
}

export async function updateBill(userId: string, id: string, input: Record<string, unknown>) {
  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) throw ApiError.notFound("Bill not found");
  if (input.accountId) await assertOwnedAccount(userId, input.accountId as string);
  if (input.categoryId) await assertOwnedCategory(userId, input.categoryId as string);
  return prisma.bill.update({ where: { id }, data: input as never });
}

export async function deleteBill(userId: string, id: string) {
  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) throw ApiError.notFound("Bill not found");
  await prisma.bill.delete({ where: { id } });
}

/**
 * Marks the current cycle paid/received: records a real transaction (if an account is linked).
 * Recurring bills advance to their next cycle and reopen as UNPAID; one-off bills just stay PAID for good.
 */
export async function markBillPaid(userId: string, id: string) {
  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) throw ApiError.notFound("Bill not found");

  return prisma.$transaction(async (tx) => {
    if (bill.accountId) {
      await tx.transaction.create({
        data: {
          userId,
          title: bill.name,
          amount: bill.amount,
          type: bill.type,
          date: bill.dueDate,
          accountId: bill.accountId,
          categoryId: bill.categoryId,
          notes: `Recorded from bill: ${bill.name}`,
        },
      });
      await tx.account.update({
        where: { id: bill.accountId },
        data: { balance: { increment: bill.type === "INCOME" ? Number(bill.amount) : -Number(bill.amount) } },
      });
    }

    const frequency = bill.frequency as Frequency;
    if (frequency === "ONCE") {
      return tx.bill.update({ where: { id: bill.id }, data: { status: "PAID" } });
    }

    return tx.bill.update({
      where: { id: bill.id },
      data: { dueDate: advance(bill.dueDate, frequency), status: "UNPAID" },
    });
  });
}
