import { z } from "zod";

export const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  icon: z.string().min(1).max(50).default("flame"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F97316"),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
