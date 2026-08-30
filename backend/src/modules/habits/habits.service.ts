import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Current streak counts consecutive completed days working backward from today (or from
 * yesterday if today isn't marked yet — the day isn't "missed" until it's actually over, so
 * an unmarked today shouldn't zero out an otherwise-intact streak). Best streak scans the
 * full history for the longest run ever.
 */
function computeStreaks(dateKeys: Set<string>) {
  const today = todayUTC();
  const doneToday = dateKeys.has(dayKey(today));

  let cursor = doneToday ? today : addDays(today, -1);
  let currentStreak = 0;
  while (dateKeys.has(dayKey(cursor))) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...dateKeys].sort();
  let bestStreak = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const key of sorted) {
    run = prevKey && dayKey(addDays(new Date(prevKey), 1)) === key ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prevKey = key;
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak), doneToday };
}

export async function listHabits(userId: string) {
  const habits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const logs = await prisma.habitLog.findMany({ where: { userId } });

  return habits.map((habit) => {
    const keys = new Set(logs.filter((l) => l.habitId === habit.id).map((l) => dayKey(l.date)));
    return { ...habit, ...computeStreaks(keys) };
  });
}

export async function createHabit(userId: string, input: { title: string; icon: string; color: string }) {
  return prisma.habit.create({ data: { userId, ...input } });
}

export async function updateHabit(userId: string, id: string, input: Record<string, unknown>) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw ApiError.notFound("Habit not found");
  return prisma.habit.update({ where: { id }, data: input as never });
}

export async function deleteHabit(userId: string, id: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw ApiError.notFound("Habit not found");
  await prisma.habit.delete({ where: { id } });
}

/** Toggles today's completion — creates today's log if missing, removes it if present. */
export async function toggleToday(userId: string, id: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw ApiError.notFound("Habit not found");

  const today = todayUTC();
  const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: id, date: today } } });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({ data: { habitId: id, userId, date: today } });
  }

  const logs = await prisma.habitLog.findMany({ where: { habitId: id } });
  const keys = new Set(logs.map((l) => dayKey(l.date)));
  return { ...habit, ...computeStreaks(keys) };
}
