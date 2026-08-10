import { z } from "zod";

const accountTypes = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS", "INVESTMENT"] as const;
const currencies = ["USD", "EUR", "GBP", "KGS", "RUB", "KZT", "PLN"] as const;

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(accountTypes),
  balance: z.number().finite().default(0),
  currency: z.enum(currencies).default("USD"),
  icon: z.string().min(1).max(50).default("wallet"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4F46E5"),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  // Currency the entered `amount` is denominated in. Defaults to the source account's own
  // currency if omitted; when different, it's converted into the source currency first.
  currency: z.enum(currencies).optional(),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional(),
});
