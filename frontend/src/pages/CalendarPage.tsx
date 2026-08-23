import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDayDialog } from "@/components/calendar/CalendarDayDialog";
import { useCalendarMonth } from "@/hooks/useCalendar";
import { currentLocale } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarBillOccurrence, Transaction } from "@/types";

export default function CalendarPage() {
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data, isLoading } = useCalendarMonth(month, year);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  const monthDate = new Date(year, month - 1, 1);
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const txByDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of data?.transactions ?? []) {
      const key = format(new Date(tx.date), "yyyy-MM-dd");
      (map.get(key) ?? map.set(key, []).get(key)!).push(tx);
    }
    return map;
  }, [data]);

  const billsByDay = useMemo(() => {
    const map = new Map<string, CalendarBillOccurrence[]>();
    for (const bill of data?.bills ?? []) {
      const key = format(new Date(bill.date), "yyyy-MM-dd");
      (map.get(key) ?? map.set(key, []).get(key)!).push(bill);
    }
    return map;
  }, [data]);

  const weekdayLabels = useMemo(() => {
    const reference = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: reference, end: endOfWeek(reference, { weekStartsOn: 1 }) }).map((d) =>
      new Intl.DateTimeFormat(currentLocale(), { weekday: "short" }).format(d)
    );
  }, []);

  const selectedKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("calendar.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("calendar.subtitle")}</p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">
          {new Intl.DateTimeFormat(currentLocale(), { month: "long", year: "numeric" }).format(monthDate)}
        </p>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px] rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="grid grid-cols-7 border-b border-border/60 bg-secondary/40 text-center text-xs font-medium text-muted-foreground">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, monthDate);
              const dayTx = txByDay.get(key) ?? [];
              const dayBills = billsByDay.get(key) ?? [];
              const hasIncome = dayTx.some((tx) => tx.type === "INCOME");
              const hasExpense = dayTx.some((tx) => tx.type === "EXPENSE");
              const hasBill = dayBills.length > 0;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1.5 border-b border-r border-border/40 p-2 text-left transition-colors last:border-r-0",
                    inMonth ? "hover:bg-secondary/60" : "cursor-default bg-secondary/10 text-muted-foreground/40",
                    selectedKey === key && "bg-primary/10"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day) && inMonth && "bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {inMonth && (hasIncome || hasExpense || hasBill) && (
                    <div className="flex items-center gap-1">
                      {hasIncome && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
                      {hasExpense && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
                      {hasBill && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t("calendar.legend.income")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" /> {t("calendar.legend.expense")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> {t("calendar.legend.bill")}
        </span>
      </div>

      <CalendarDayDialog
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        date={selectedDay}
        transactions={selectedKey ? txByDay.get(selectedKey) ?? [] : []}
        bills={selectedKey ? billsByDay.get(selectedKey) ?? [] : []}
      />
    </div>
  );
}
