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

/** Rolls a recurring bill's dueDate forward past "now", resetting status for the new cycle. One-off bills
 * and bills with no due date (a "pay later" backlog item) are left alone — there's nothing to roll forward. */
async function rollForwardIfPast(bill: { id: string; dueDate: Date | null; frequency: Frequency; status: string }) {
  if (bill.frequency === "ONCE" || !bill.dueDate || bill.dueDate >= new Date()) return bill;

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
  const bills = await prisma.bill.findMany({ where: { userId } });
  const rolled = await Promise.all(bills.map((bill) => rollForwardIfPast(bill)));
  // Bills with no due date (pay-later backlog) sort after every dated bill.
  return rolled.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

export async function getUpcomingBills(userId: string, limit: number) {
  const bills = await listBills(userId);
  return bills.filter((b) => b.status === "UNPAID" && b.dueDate).slice(0, limit);
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
    dueDate?: Date | null;
    categoryId?: string;
    accountId?: string;
    debtAccountId?: string | null;
  }
) {
  await assertOwnedAccount(userId, input.accountId);
  await assertOwnedAccount(userId, input.debtAccountId ?? undefined);
  await assertOwnedCategory(userId, input.categoryId);
  return prisma.bill.create({ data: { userId, ...input } });
}

export async function updateBill(userId: string, id: string, input: Record<string, unknown>) {
  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) throw ApiError.notFound("Bill not found");
  if (input.accountId) await assertOwnedAccount(userId, input.accountId as string);
  if (input.debtAccountId) await assertOwnedAccount(userId, input.debtAccountId as string);
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
 * When both `accountId` and `debtAccountId` are set, this is a debt payoff — records a transfer
 * from `accountId` into `debtAccountId` instead of a plain expense, so paying a debt bill both
 * deducts the money and pays down the linked liability account in one action.
 * Recurring bills advance to their next cycle and reopen as UNPAID; one-off bills just stay PAID for good.
 */
export async function markBillPaid(userId: string, id: string) {
  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) throw ApiError.notFound("Bill not found");

  return prisma.$transaction(async (tx) => {
    if (bill.accountId && bill.debtAccountId) {
      await tx.transaction.create({
        data: {
          userId,
          title: bill.name,
          amount: bill.amount,
          type: "TRANSFER",
          date: new Date(),
          accountId: bill.accountId,
          transferFromAccountId: bill.accountId,
          transferToAccountId: bill.debtAccountId,
          categoryId: bill.categoryId,
          notes: `Debt payoff: ${bill.name}`,
        },
      });
      await tx.account.update({
        where: { id: bill.accountId },
        data: { balance: { decrement: Number(bill.amount) } },
      });
      await tx.account.update({
        where: { id: bill.debtAccountId },
        data: { balance: { increment: Number(bill.amount) } },
      });
    } else if (bill.accountId) {
      await tx.transaction.create({
        data: {
          userId,
          title: bill.name,
          amount: bill.amount,
          type: bill.type,
          date: bill.dueDate ?? new Date(),
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
      data: { dueDate: advance(bill.dueDate ?? new Date(), frequency), status: "UNPAID" },
    });
  });
}
