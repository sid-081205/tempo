import { addDays, dayKey, eventsForRange, todayUtc } from "@/lib/mock";
import { CalendarClient } from "./CalendarClient";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const today = todayUtc();
  // Monday of the current week (getUTCDay: Sun=0).
  const dow = today.getUTCDay();
  const monday = addDays(today, dow === 0 ? -6 : 1 - dow);

  // Three weeks: previous, current, next.
  const start = addDays(monday, -7);
  const events = eventsForRange(start, 21);

  const weeks = [0, 1, 2].map((w) =>
    Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, w * 7 + i))),
  );

  return (
    <CalendarClient
      weeks={weeks}
      events={events}
      todayKey={dayKey(today)}
    />
  );
}
