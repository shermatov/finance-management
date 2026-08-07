import { prisma } from "../../lib/prisma.js";

export async function getSettings(userId: string) {
  const existing = await prisma.settings.findUnique({ where: { userId } });
  if (existing) return existing;
  // Defensive fallback: every user gets a Settings row at registration, but guard against older/edge-case data.
  return prisma.settings.create({ data: { userId } });
}

export async function updateSettings(userId: string, input: Record<string, unknown>) {
  await getSettings(userId);
  return prisma.settings.update({ where: { userId }, data: input as never });
}
