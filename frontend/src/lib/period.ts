// Budget/analytics "months" run 15th-to-15th (payday), not calendar 1st-to-1st,
// matching the backend's lib/period.ts and the dashboard.
export function currentPeriodMonthYear(now: Date) {
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  if (now.getDate() < 15) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return { month, year };
}
