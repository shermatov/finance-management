/**
 * "Financial month" boundaries for this app run from the 15th of one calendar month to the
 * 14th of the next (payday), not the 1st — matching when income/expenses actually cycle for
 * this user, instead of the calendar month.
 */

/** Range for the financial month `offset` periods back from `reference` (0 = current period). */
export function periodRange(offset = 0, reference = new Date()) {
  const day = reference.getDate();
  const baseMonth = reference.getMonth() - (day < 15 ? 1 : 0);
  const start = new Date(reference.getFullYear(), baseMonth - offset, 15);
  const end = new Date(reference.getFullYear(), baseMonth - offset + 1, 15);
  return { start, end };
}

/** Range for an explicitly-labeled financial month (1-12) — e.g. month=8 means the period
 * Aug 15 -> Sep 15, keeping the same human "August" label even though the 1st isn't in it. */
export function periodRangeForMonth(month: number, year: number) {
  const start = new Date(year, month - 1, 15);
  const end = new Date(year, month, 15);
  return { start, end };
}

/** Which (month, year) label `reference` currently falls into, per the 15th cutover. */
export function currentPeriodMonthYear(reference = new Date()) {
  const day = reference.getDate();
  let month = reference.getMonth() + 1;
  let year = reference.getFullYear();
  if (day < 15) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return { month, year };
}
