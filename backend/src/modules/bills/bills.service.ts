import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { convert } from "../../lib/exchangeRates.js";

type Frequency = "ONCE" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

function advance(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (frequency === "QUARTERLY") next.setMonth(next.getMonth() + 3);
  else if (frequency === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  return next;
}

/** How many months of income an auto-computed bill looks back over, matching its own cycle
 * length (a QUARTERLY tax bill is recomputed off the last 3 months of income, etc). */
function lookbackMonths(frequency: Frequency): number {
  if (frequency === "QUARTERLY") return 3;
  if (frequency === "YEARLY") return 12;
  return 1;
}

/** Recomputes an auto-compute bill's amount as `rate x total income` in the window immediately
 * before `asOf`, sized to the bill's own cycle length — since income varies month to month,
 * this is what makes a variable-income tax bill actually track what's really owed each cycle. */
async function computeAutoAmount(userId: string, rate: number, asOf: Date, frequency: Frequency): Promise<number> {
  const months = lookbackMonths(frequency);
  const windowStart = new Date(asOf);
  windowStart.setMonth(windowStart.getMonth() - months);

  const result = await prisma.transaction.aggregate({
    where: { userId, type: "INCOME", date: { gte: windowStart, lt: asOf } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0) * rate;
}

/** Rolls a recurring bill's dueDate forward past "now", resetting status for the new cycle. One-off bills
 * and bills with no due date (a "pay later" backlog item) are left alone — there's nothing to roll forward.
 * Auto-compute bills (see `autoComputeRate`) get their amount recalculated for the new cycle too. */
async function rollForwardIfPast(bill: {
  id: string;
  userId: string;
  dueDate: Date | null;
  frequency: Frequency;
  status: string;
  autoComputeRate: unknown;
}) {
  if (bill.frequency === "ONCE" || !bill.dueDate || bill.dueDate >= new Date()) return bill;

  let dueDate = bill.dueDate;
  while (dueDate < new Date()) {
    dueDate = advance(dueDate, bill.frequency);
  }

  const amount = bill.autoComputeRate
    ? await computeAutoAmount(bill.userId, Number(bill.autoComputeRate), dueDate, bill.frequency)
    : undefined;

  return prisma.bill.update({
    where: { id: bill.id },
    data: { dueDate, status: "UNPAID", ...(amount !== undefined && { amount }) },
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
    autoComputeRate?: number | null;
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
  const bill = await prisma.bill.findFirst({
    where: { id, userId },
    include: { account: true, debtAccount: true },
  });
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
      const convertedAmount = await convert(Number(bill.amount), bill.account!.currency, bill.debtAccount!.currency);
      await tx.account.update({
        where: { id: bill.accountId },
        data: { balance: { decrement: Number(bill.amount) } },
      });
      await tx.account.update({
        where: { id: bill.debtAccountId },
        data: { balance: { increment: convertedAmount } },
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

    const nextDueDate = advance(bill.dueDate ?? new Date(), frequency);
    const nextAmount = bill.autoComputeRate
      ? await computeAutoAmount(userId, Number(bill.autoComputeRate), nextDueDate, frequency)
      : undefined;

    return tx.bill.update({
      where: { id: bill.id },
      data: {
        dueDate: nextDueDate,
        status: "UNPAID",
        ...(nextAmount !== undefined && { amount: nextAmount }),
      },
    });
  });
}
