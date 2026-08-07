import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.coerce.date().optional(),
  icon: z.string().min(1).max(50).default("piggy-bank"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22C55E"),
});

export const updateGoalSchema = createGoalSchema.partial();

export const contributeSchema = z.object({
  amount: z.coerce.number().positive(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
