import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = z.object({
  amount: z.coerce.number().positive(),
});

export const listQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
