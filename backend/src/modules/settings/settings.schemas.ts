import { z } from "zod";

export const updateSettingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  currency: z.enum(["USD", "EUR", "GBP", "KGS", "RUB", "KZT", "PLN"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(50).optional(),
  notifyBudgetExceeded: z.boolean().optional(),
  notifyUpcomingBills: z.boolean().optional(),
  notifySavingsMilestone: z.boolean().optional(),
  notifyLowBalance: z.boolean().optional(),
});
