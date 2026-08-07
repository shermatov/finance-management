import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

interface ListFilters {
  page: number;
  limit: number;
  search?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  accountId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy: "date" | "amount" | "title";
  sortDir: "asc" | "desc";
}

export async function listTransactions(userId: string, filters: ListFilters) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(filters.type && { type: filters.type }),
    ...(filters.accountId && { accountId: filters.accountId }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.search && { title: { contains: filters.search, mode: "insensitive" } }),
    ...((filters.dateFrom || filters.dateTo) && {
      date: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
    ...((filters.minAmount !== undefined || filters.maxAmount !== undefined) && {
      amount: {
        ...(filters.minAmount !== undefined && { gte: filters.minAmount }),
        ...(filters.maxAmount !== undefined && { lte: filters.maxAmount }),
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true, attachments: true },
      orderBy: { [filters.sortBy]: filters.sortDir },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) };
}

export async function getTransaction(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true, account: true, attachments: true },
  });
  if (!transaction) throw ApiError.notFound("Transaction not found");
  return transaction;
}

async function assertOwnedAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw ApiError.badRequest("Account not found");
  return account;
}

async function assertOwnedCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw ApiError.badRequest("Category not found");
  return category;
}

function balanceDelta(type: "INCOME" | "EXPENSE", amount: number) {
  return type === "INCOME" ? amount : -amount;
}

export async function createTransaction(
  userId: string,
  input: {
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    date: Date;
    accountId: string;
    categoryId?: string;
    notes?: string;
  }
) {
  await assertOwnedAccount(userId, input.accountId);
  if (input.categoryId) await assertOwnedCategory(userId, input.categoryId);

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
        title: input.title,
        amount: input.amount,
        type: input.type,
        date: input.date,
        accountId: input.accountId,
        categoryId: input.categoryId,
        notes: input.notes,
      },
      include: { category: true, account: true },
    });

    await tx.account.update({
      where: { id: input.accountId },
      data: { balance: { increment: balanceDelta(input.type, input.amount) } },
    });

    return transaction;
  });
}

export async function updateTransaction(userId: string, id: string, input: Record<string, unknown>) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw ApiError.notFound("Transaction not found");
  if (existing.type === "TRANSFER") {
    throw ApiError.badRequest("Transfers cannot be edited; delete and recreate instead");
  }

  const accountId = (input.accountId as string | undefined) ?? existing.accountId;
  const categoryId = input.categoryId as string | undefined;
  if (input.accountId) await assertOwnedAccount(userId, accountId);
  if (categoryId) await assertOwnedCategory(userId, categoryId);

  const type = (input.type as "INCOME" | "EXPENSE" | undefined) ?? (existing.type as "INCOME" | "EXPENSE");
  const amount = (input.amount as number | undefined) ?? Number(existing.amount);

  return prisma.$transaction(async (tx) => {
    // reverse old effect on the old account
    await tx.account.update({
      where: { id: existing.accountId },
      data: {
        balance: { increment: -balanceDelta(existing.type as "INCOME" | "EXPENSE", Number(existing.amount)) },
      },
    });

    // apply new effect on the (possibly new) account
    await tx.account.update({
      where: { id: accountId },
      data: { balance: { increment: balanceDelta(type, amount) } },
    });

    return tx.transaction.update({
      where: { id },
      data: input as never,
      include: { category: true, account: true },
    });
  });
}

export async function deleteTransaction(userId: string, id: string) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw ApiError.notFound("Transaction not found");

  await prisma.$transaction(async (tx) => {
    if (existing.type === "TRANSFER") {
      if (existing.transferFromAccountId) {
        await tx.account.update({
          where: { id: existing.transferFromAccountId },
          data: { balance: { increment: Number(existing.amount) } },
        });
      }
      if (existing.transferToAccountId) {
        await tx.account.update({
          where: { id: existing.transferToAccountId },
          data: { balance: { decrement: Number(existing.amount) } },
        });
      }
    } else {
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: -balanceDelta(existing.type as "INCOME" | "EXPENSE", Number(existing.amount)) },
        },
      });
    }

    await tx.transaction.delete({ where: { id } });
  });
}
