import { z } from "zod";

export const createTransactionSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.coerce.date(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid() });

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortBy: z.enum(["date", "amount", "title"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
