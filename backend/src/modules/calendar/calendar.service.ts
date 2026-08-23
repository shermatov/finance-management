import { prisma } from "../../lib/prisma.js";
import { listBills, advance, type Frequency } from "../bills/bills.service.js";

/**
 * Bills only ever store their single *current* due date (see bills.service.ts's
 * roll-forward model) — past cycles aren't kept as separate rows. So for a calendar month,
 * a recurring bill's occurrences within that month are projected forward from its current
 * (already-rolled-forward-past-now) due date, without writing anything back. A guard caps
 * the walk in case a frequency/date combination would otherwise loop pathologically.
 */
function occurrencesInRange(dueDate: Date, frequency: Frequency, rangeStart: Date, rangeEnd: Date): Date[] {
  if (frequency === "ONCE") {
    return dueDate >= rangeStart && dueDate < rangeEnd ? [dueDate] : [];
  }

  const dates: Date[] = [];
  let d = dueDate;
  let guard = 0;
  while (d < rangeStart && guard < 500) {
    d = advance(d, frequency);
    guard++;
  }
  while (d < rangeEnd && guard < 500) {
    dates.push(new Date(d));
    d = advance(d, frequency);
    guard++;
  }
  return dates;
}

export async function getMonth(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { category: true, account: true },
    orderBy: { date: "asc" },
  });

  const bills = await listBills(userId);
  const billOccurrences = bills.flatMap((bill) => {
    if (!bill.dueDate) return [];
    return occurrencesInRange(bill.dueDate, bill.frequency as Frequency, start, end).map((date) => ({
      billId: bill.id,
      name: bill.name,
      amount: Number(bill.amount),
      type: bill.type,
      status: bill.status,
      date,
    }));
  });
  billOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

  return { transactions, bills: billOccurrences };
}
