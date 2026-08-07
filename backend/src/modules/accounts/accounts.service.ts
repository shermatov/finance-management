import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAccount(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) throw ApiError.notFound("Account not found");
  return account;
}

export async function createAccount(
  userId: string,
  input: { name: string; type: string; balance: number; currency: string; icon: string; color: string }
) {
  return prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type as never,
      balance: input.balance,
      currency: input.currency as never,
      icon: input.icon,
      color: input.color,
    },
  });
}

export async function updateAccount(userId: string, id: string, input: Record<string, unknown>) {
  await getAccount(userId, id);
  return prisma.account.update({ where: { id }, data: input as never });
}

export async function deleteAccount(userId: string, id: string) {
  await getAccount(userId, id);
  const txCount = await prisma.transaction.count({ where: { accountId: id } });
  if (txCount > 0) {
    throw ApiError.badRequest("Cannot delete an account with existing transactions. Archive it instead.");
  }
  await prisma.account.delete({ where: { id } });
}

export async function transferBetweenAccounts(
  userId: string,
  input: { fromAccountId: string; toAccountId: string; amount: number; date: Date; notes?: string }
) {
  if (input.fromAccountId === input.toAccountId) {
    throw ApiError.badRequest("Source and destination accounts must be different");
  }

  const [fromAccount, toAccount] = await Promise.all([
    getAccount(userId, input.fromAccountId),
    getAccount(userId, input.toAccountId),
  ]);

  return prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: fromAccount.id },
      data: { balance: { decrement: input.amount } },
    });
    await tx.account.update({
      where: { id: toAccount.id },
      data: { balance: { increment: input.amount } },
    });

    return tx.transaction.create({
      data: {
        userId,
        title: `Transfer: ${fromAccount.name} → ${toAccount.name}`,
        amount: input.amount,
        type: "TRANSFER",
        date: input.date,
        notes: input.notes,
        accountId: fromAccount.id,
        transferFromAccountId: fromAccount.id,
        transferToAccountId: toAccount.id,
      },
    });
  });
}
