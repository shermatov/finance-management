import { z } from "zod";

export const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  icon: z.string().min(1).max(50).default("flame"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F97316"),
  unit: z.string().min(1).max(30).optional(),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  unit: z.string().min(1).max(30).optional().nullable(),
});

export const logTodaySchema = z.object({
  value: z.coerce.number().int().min(0).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
