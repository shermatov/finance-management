import { z } from "zod";

const statusEnum = z.enum(["PLANNED", "IN_PROGRESS", "DONE"]);

export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  status: statusEnum.default("PLANNED"),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  status: statusEnum.optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
