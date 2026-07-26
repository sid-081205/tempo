import type { CalEvent, Insight } from "./types";
import { dayKey, todayUtc } from "./mock";
import { executeTool, getComposio, getConnectionStatuses } from "./composio";

export interface GmailProposal {
  title: string;
  /** ISO date YYYY-MM-DD */
  day: string;
  startMin: number;
  durationMin: number;
  attendees: string[];
  note: string;
}

interface RawEmail {
  subject: string;
  from: string;
  to: string;
  date: string;
  text: string;
}

/* One extraction per server every 10 minutes; both the calendar and the
   insights page read from it. */
let cache: { at: number; items: GmailProposal[] } | null = null;
let inflight: Promise<GmailProposal[]> | null = null;
const TTL_MS = 10 * 60 * 1000;

function pick(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return "";
}

async function fetchRecentEmails(): Promise<RawEmail[]> {
  const res = await executeTool("GMAIL_FETCH_EMAILS", {
    user_id: "me",
    query: "newer_than:7d",
    max_results: 15,
    include_payload: true,
    verbose: true,
  });
  if (!res.successful) return [];

  const data = res.data as { messages?: Record<string, unknown>[] } | undefined;
  return (data?.messages ?? []).map((m) => ({
    subject: pick(m.subject, m.messageSubject),
    from: pick(m.sender, m.from),
    to: pick(m.to, m.recipient),
    date: pick(m.messageTimestamp, m.date, m.internalDate),
    text: pick(m.messageText, m.snippet, m.preview).slice(0, 600),
  }));
}

async function extractProposals(emails: RawEmail[]): Promise<GmailProposal[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || emails.length === 0) return [];

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey });

  const today = dayKey(todayUtc());
  const emailBlock = emails
    .map(
      (e, i) =>
        `[${i}] from: ${e.from} | to: ${e.to} | date: ${e.date}\nsubject: ${e.subject}\n${e.text}`,
    )
    .join("\n---\n");

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Today is ${today} (UTC). Extract meeting/call proposals from these emails: anything where people suggest meeting, calling, or scheduling something. Resolve relative dates ("sunday", "tomorrow") to concrete future dates from the email's date. Return JSON: {"proposals":[{"title":string (short, e.g. "Mechanistic interpretability chat with Rohan"),"date":"YYYY-MM-DD","start_time":"HH:MM" (24h; if ambiguous like 8:30 assume evening 20:30 unless context says morning),"duration_min":number (default 45),"attendees":[names of the other people involved],"note":string (one plain sentence: who proposed what, mention uncertainty like "Priya might join")}]}. Only include real proposals. Empty array if none.`,
      },
      { role: "user", content: emailBlock },
    ],
  });

  try {
    const parsed = JSON.parse(
      completion.choices[0]?.message?.content ?? "{}",
    ) as {
      proposals?: {
        title?: string;
        date?: string;
        start_time?: string;
        duration_min?: number;
        attendees?: string[];
        note?: string;
      }[];
    };
    return (parsed.proposals ?? [])
      .filter((p) => p.title && p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date))
      .map((p) => {
        const [h, m] = (p.start_time ?? "18:00").split(":").map(Number);
        return {
          title: p.title!,
          day: p.date!,
          startMin: (h || 18) * 60 + (m || 0),
          durationMin: p.duration_min ?? 45,
          attendees: p.attendees ?? [],
          note: p.note ?? "Proposed over email.",
        };
      });
  } catch {
    return [];
  }
}

/** Meeting proposals found in recent Gmail. Empty unless Gmail is connected. */
export async function getGmailProposals(): Promise<GmailProposal[]> {
  if (!getComposio()) return [];
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const statuses = await getConnectionStatuses();
      if (statuses["gmail"] !== "connected") return [];
      const emails = await fetchRecentEmails();
      const items = await extractProposals(emails);
      cache = { at: Date.now(), items };
      return items;
    } catch {
      return [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function proposalToCalEvent(p: GmailProposal, i: number): CalEvent {
  return {
    id: `gmail-${i}`,
    title: p.title,
    kind: "external",
    day: p.day,
    startMin: p.startMin,
    endMin: p.startMin + p.durationMin,
    attendeeIds: [],
    impact: {
      effect: "neutral",
      hrDelta: 3,
      recoveryMin: 10,
      summary: `From your Gmail: ${p.note} Not booked yet.`,
    },
  };
}

export function proposalToInsight(p: GmailProposal, i: number): Insight {
  return {
    id: `gmail-insight-${i}`,
    category: "future",
    title: `Put "${p.title}" on the calendar`,
    body: `${p.note} Tempo found this in your Gmail. One tap and it's booked${p.attendees.length ? ` with ${p.attendees.join(" and ")}` : ""}.`,
    stat: "Gmail",
    statLabel: "found in your email",
    action: "Schedule it",
    schedule: {
      title: p.title,
      day: p.day,
      startMin: p.startMin,
      durationMin: p.durationMin,
    },
  };
}
