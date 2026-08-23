import { z } from "zod";

export const createGoalSchema = z
  .object({
    name: z.string().min(1).max(100),
    targetAmount: z.coerce.number().positive().optional(),
    currentAmount: z.coerce.number().min(0).default(0),
    deadline: z.coerce.date().optional(),
    isActive: z.coerce.boolean().default(true),
    icon: z.string().min(1).max(50).default("coins"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22C55E"),
  })
  .refine((data) => !data.isActive || data.targetAmount !== undefined, {
    message: "Target amount is required for active goals",
    path: ["targetAmount"],
  });

export const updateGoalSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    targetAmount: z.coerce.number().positive().optional().nullable(),
    currentAmount: z.coerce.number().min(0).optional(),
    deadline: z.coerce.date().optional().nullable(),
    isActive: z.coerce.boolean().optional(),
    icon: z.string().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  })
  .refine((data) => data.isActive !== true || data.targetAmount === undefined || data.targetAmount !== null, {
    message: "Target amount is required for active goals",
    path: ["targetAmount"],
  });

export const contributeSchema = z.object({
  amount: z.coerce.number().positive(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
