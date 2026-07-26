import type { CalEvent, EventKind } from "./types";
import { addDays, dayKey, eventsForRange } from "./mock";
import { getGmailProposals, proposalToCalEvent } from "./gmail";
import { executeTool, getComposio, getConnectionStatuses } from "./composio";

export interface CalendarData {
  /** Which live sources contributed events (demo data is always included). */
  live: ("google" | "gmail")[];
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
 * Everything visible at once: generated demo events as the base layer, with
 * real Google Calendar events and Gmail-detected proposals merged on top
 * when those sources are connected.
 */
export async function getCalendarData(
  start: Date,
  days: number,
): Promise<CalendarData> {
  const events: CalEvent[] = eventsForRange(start, days);
  const live: CalendarData["live"] = [];
  const endKey = dayKey(addDays(start, days));
  const startKey = dayKey(start);

  if (!getComposio()) return { live, events };

  // Real Google Calendar events.
  try {
    const statuses = await getConnectionStatuses();
    if (statuses["googlecalendar"] === "connected") {
      const result = await executeTool("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin: start.toISOString(),
        timeMax: addDays(start, days).toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });
      if (result.successful) {
        const data = result.data as { items?: GoogleEvent[] } | undefined;
        const googleEvents = (data?.items ?? [])
          .map(toCalEvent)
          .filter((e): e is CalEvent => e !== null);
        if (googleEvents.length) {
          events.push(...googleEvents);
          live.push("google");
        }
      }
    }
  } catch {
    // Live calendar unavailable; the base layer still renders.
  }

  // Meeting proposals found in Gmail.
  try {
    const proposals = await getGmailProposals();
    const proposalEvents = proposals
      .map(proposalToCalEvent)
      .filter((e) => e.day >= startKey && e.day < endKey);
    if (proposalEvents.length) {
      events.push(...proposalEvents);
      live.push("gmail");
    }
  } catch {
    // Same: never block the calendar on a live source.
  }

  return { live, events };
}
