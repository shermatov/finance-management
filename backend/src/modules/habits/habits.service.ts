import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { Habit, HabitLog } from "@prisma/client";

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
 * full history for the longest run ever. Streaks key off log *presence* only — the logged
 * value (for quantity-tracked habits) never factors in, so switching a habit between
 * checkbox and quantity mode doesn't retroactively change past streaks.
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

/** Oldest-to-newest, ending today — for a small weekly activity view in the UI. */
function last7Days(dateKeys: Set<string>): boolean[] {
  const today = todayUTC();
  const days: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dateKeys.has(dayKey(addDays(today, -i))));
  }
  return days;
}

function withStats(habit: Habit, logs: HabitLog[]) {
  const keys = new Set(logs.map((l) => dayKey(l.date)));
  const todayLog = logs.find((l) => dayKey(l.date) === dayKey(todayUTC()));
  const totalValue = logs.reduce((sum, l) => sum + (l.value ?? 0), 0);
  return {
    ...habit,
    ...computeStreaks(keys),
    todayValue: todayLog?.value ?? null,
    totalValue,
    last7Days: last7Days(keys),
  };
}

export async function listHabits(userId: string) {
  const habits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const logs = await prisma.habitLog.findMany({ where: { userId } });
  return habits.map((habit) => withStats(habit, logs.filter((l) => l.habitId === habit.id)));
}

export async function createHabit(userId: string, input: { title: string; icon: string; color: string; unit?: string }) {
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

/**
 * Logs today's entry. For a plain checkbox habit (no unit), this is a toggle: creates
 * today's log if missing, removes it if present, ignoring `value`. For a quantity-tracked
 * habit (unit set), a positive `value` creates/overwrites today's amount, while 0 or
 * omitting it clears today's entry — same on/off semantics, just quantity-aware.
 */
export async function logToday(userId: string, id: string, value?: number) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw ApiError.notFound("Habit not found");

  const today = todayUTC();
  const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: id, date: today } } });

  if (habit.unit) {
    if (value && value > 0) {
      if (existing) {
        await prisma.habitLog.update({ where: { id: existing.id }, data: { value } });
      } else {
        await prisma.habitLog.create({ data: { habitId: id, userId, date: today, value } });
      }
    } else if (existing) {
      await prisma.habitLog.delete({ where: { id: existing.id } });
    }
  } else if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({ data: { habitId: id, userId, date: today } });
  }

  const logs = await prisma.habitLog.findMany({ where: { habitId: id } });
  return withStats(habit, logs);
}
