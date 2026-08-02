import { addDays, dayKey, eventsForRange, todayUtc } from "@/lib/mock";
import { getCalendarData } from "@/lib/calendar";
import { withTimeout } from "@/lib/fast";
import { CalendarClient } from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const today = todayUtc();
  const dow = today.getUTCDay();
  const monday = addDays(today, dow === 0 ? -6 : 1 - dow);
  const start = addDays(monday, -7);
  const seed = eventsForRange(start, 21);

  const result = await withTimeout(getCalendarData(start, 21), 900, null);
  const live = result?.live ?? [];
  const events = result
    ? result.events
    : seed;

  const weeks = [0, 1, 2].map((w) =>
    Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, w * 7 + i))),
  );

  return (
    <CalendarClient
      weeks={weeks}
      events={events}
      todayKey={dayKey(today)}
      live={live}
    />
  );
}
