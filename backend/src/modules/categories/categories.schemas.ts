import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().min(1).max(50).default("tag"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4F46E5"),
});

export const updateCategorySchema = createCategorySchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid() });
