import type { CalEvent, EventKind } from "./types";
import { addDays, dayKey, eventsForRange } from "./mock";
import { composioUserId, getComposio, getConnectionStatuses } from "./composio";

export interface CalendarData {
  source: "google" | "mock";
  events: CalEvent[];
}

/** Heuristic prediction until Tempo has learned this event from your data. */
function predictImpact(
  title: string,
  attendeeCount: number,
  durationMin: number,
): CalEvent["impact"] & { kind: EventKind } {
  const t = title.toLowerCase();

  if (/\b(run|gym|workout|yoga|swim|ride|lift|climb|walk)\b/.test(t)) {
    return {
      kind: "workout",
      effect: "restores",
      hrDelta: 40,
      recoveryMin: 20,
      summary: "Looks like training. Elevated on purpose, restorative after.",
    };
  }
  if (/\b(dinner|lunch|coffee|drinks|brunch|hang|party|date)\b/.test(t)) {
    return {
      kind: "social",
      effect: "restores",
      hrDelta: -3,
      recoveryMin: 0,
      summary: "Social time usually restores you. Tempo will confirm from your data.",
    };
  }
  if (
    /\b(review|planning|interview|escalation|client|deadline|board|pitch)\b/.test(t) ||
    attendeeCount >= 4
  ) {
    const cost = Math.min(13, 8 + Math.round(attendeeCount * 0.8));
    return {
      kind: "review",
      effect: "elevates",
      hrDelta: cost,
      recoveryMin: Math.min(45, Math.round(durationMin * 0.4) + 15),
      summary: `Meetings like this usually cost you. Predicted +${cost} bpm; Tempo refines this as it learns.`,
    };
  }
  if (/\b(1:1|1on1|sync|standup|stand-up|check.?in|catch.?up)\b/.test(t) || attendeeCount >= 1) {
    return {
      kind: "sync",
      effect: "elevates",
      hrDelta: 6,
      recoveryMin: 12,
      summary: "A typical sync. Mild elevation predicted; Tempo refines this as it learns.",
    };
  }
  return {
    kind: "focus",
    effect: "neutral",
    hrDelta: -1,
    recoveryMin: 0,
    summary: "Solo time. Usually your calmest working state.",
  };
}

interface GoogleEvent {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string }[];
}

function toCalEvent(g: GoogleEvent): CalEvent | null {
  const startIso = g.start?.dateTime;
  const endIso = g.end?.dateTime;
  if (!startIso || !endIso) return null; // skip all-day events

  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = dayKey(
    new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())),
  );
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
  let endMin = end.getUTCHours() * 60 + end.getUTCMinutes();
  if (endMin <= startMin) endMin = 24 * 60; // crosses midnight; clamp to day end

  const title = g.summary ?? "Untitled event";
  const attendeeCount = g.attendees?.length ?? 0;
  const { kind, ...impact } = predictImpact(title, attendeeCount, endMin - startMin);

  return {
    id: g.id ?? `${day}-${startMin}`,
    title,
    kind,
    day,
    startMin,
    endMin,
    attendeeIds: [],
    impact,
  };
}

/**
 * Real Google Calendar events via Composio when connected; mock otherwise.
 */
export async function getCalendarData(
  start: Date,
  days: number,
): Promise<CalendarData> {
  const fallback = (): CalendarData => ({
    source: "mock",
    events: eventsForRange(start, days),
  });

  const composio = getComposio();
  if (!composio) return fallback();

  try {
    const statuses = await getConnectionStatuses();
    if (statuses["googlecalendar"] !== "connected") return fallback();

    const timeMin = start.toISOString();
    const timeMax = addDays(start, days).toISOString();

    const result = await composio.tools.execute("GOOGLECALENDAR_EVENTS_LIST", {
      userId: composioUserId(),
      version: "latest",
      dangerouslySkipVersionCheck: true,
      arguments: {
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      },
    });

    if (!result.successful) return fallback();

    const data = result.data as { items?: GoogleEvent[] } | undefined;
    const items = data?.items ?? [];
    const events = items
      .map(toCalEvent)
      .filter((e): e is CalEvent => e !== null);

    return { source: "google", events };
  } catch {
    return fallback();
  }
}
