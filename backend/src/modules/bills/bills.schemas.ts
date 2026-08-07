import { z } from "zod";

export const createBillSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE"),
  frequency: z.enum(["ONCE", "WEEKLY", "MONTHLY", "YEARLY"]),
  dueDate: z.coerce.date(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
});

export const updateBillSchema = createBillSchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid() });
