import { NextResponse } from "next/server";
import type OpenAI from "openai";
import {
  PEOPLE,
  addDays,
  dayKey,
  getInsights,
  getPendingInvite,
  getTodayStory,
  getWorkouts,
  metricsForDay,
  metricsForLastDays,
  todayUtc,
} from "@/lib/mock";
import {
  executeTool,
  getComposio,
  getConnectionStatuses,
} from "@/lib/composio";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContext(): string {
  const today = metricsForDay(todayUtc());
  const yesterday = metricsForDay(addDays(todayUtc(), -1));
  const last14 = metricsForLastDays(14);
  const week = last14.slice(-7);
  const prevWeek = last14.slice(0, 7);
  const avg = (xs: number[]) =>
    Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
  const workouts = getWorkouts(7);
  const insights = getInsights();
  const invite = getPendingInvite();

  return [
    `Today: HRV ${today.hrv} ms, resting HR ${today.restingHr} bpm, recovery ${today.recovery}/100, sleep ${today.sleepHours} h (score ${today.sleepScore}, efficiency ${today.sleepEfficiency}%, deep ${today.deepH} h, REM ${today.remH} h, resp rate ${today.respRate}/min), energy ${today.energy}/100, strain ${today.strain}, ~${today.calories} kcal, meeting load ${today.meetingHours} h.`,
    `Yesterday: ${yesterday.meetingHours} h of meetings, sleep before that ${yesterday.sleepHours} h, strain ${yesterday.strain}.`,
    `7-day averages (vs previous 7): sleep ${avg(week.map((m) => m.sleepHours))} h (${avg(prevWeek.map((m) => m.sleepHours))}), HRV ${avg(week.map((m) => m.hrv))} ms (${avg(prevWeek.map((m) => m.hrv))}), resting HR ${avg(week.map((m) => m.restingHr))} (${avg(prevWeek.map((m) => m.restingHr))}), recovery ${avg(week.map((m) => m.recovery))} (${avg(prevWeek.map((m) => m.recovery))}), meetings ${avg(week.map((m) => m.meetingHours))} h/day.`,
    `Workouts last 7 days: ${workouts.map((w) => `${w.title} ${w.durationMin}min avg ${w.avgHr}bpm ${w.calories}kcal`).join("; ") || "none"}.`,
    `Story: ${getTodayStory()}`,
    `People (learned effects): ${PEOPLE.map((p) => `${p.name} (${p.relation}, ${p.hrDelta > 0 ? "+" : ""}${p.hrDelta} bpm, last seen ${p.daysSinceSeen}d ago)`).join("; ")}.`,
    `Current insights: ${insights.map((i) => `${i.title} (${i.body})`).join(" | ")}`,
    `Pending invite: "${invite.title}" from ${invite.from}, predicted +${invite.predictedHrDelta} bpm and ${invite.predictedRecoveryMin} min recovery.`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Tools (real actions via Composio)                                   */
/* ------------------------------------------------------------------ */

const TOOL_DEFS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description:
        "Create a real event on the user's Google Calendar. Use when the user asks to schedule, book, or block time.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          start_datetime: {
            type: "string",
            description: "Naive local datetime YYYY-MM-DDTHH:MM:SS, no timezone suffix",
          },
          duration_min: { type: "integer", description: "Duration in minutes" },
          attendee_emails: {
            type: "array",
            items: { type: "string" },
            description: "Optional attendee email addresses",
          },
        },
        required: ["title", "start_datetime", "duration_min"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "List real events from the user's Google Calendar in a time range.",
      parameters: {
        type: "object",
        properties: {
          time_min: { type: "string", description: "ISO datetime, start of range" },
          time_max: { type: "string", description: "ISO datetime, end of range" },
        },
        required: ["time_min", "time_max"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_recent_emails",
      description:
        "Fetch the user's recent Gmail messages (subjects, senders, snippets). Use to answer questions about email or find proposed plans.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Gmail search query, e.g. 'newer_than:7d' or 'from:priya'",
          },
          max_results: { type: "integer", description: "Max 10" },
        },
        required: [],
      },
    },
  },
];

async function runTool(
  name: string,
  rawArgs: string,
  statuses: Record<string, string>,
): Promise<string> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs || "{}");
  } catch {
    return JSON.stringify({ error: "Bad tool arguments." });
  }

  try {
    if (name === "create_calendar_event" || name === "list_calendar_events") {
      if (statuses["googlecalendar"] !== "connected") {
        return JSON.stringify({
          error: "Google Calendar isn't connected. Ask the user to connect it in Settings.",
        });
      }
    }
    if (name === "fetch_recent_emails" && statuses["gmail"] !== "connected") {
      return JSON.stringify({
        error: "Gmail isn't connected. Ask the user to connect it in Settings.",
      });
    }

    if (name === "create_calendar_event") {
      const duration = Number(args.duration_min) || 45;
      const result = await executeTool("GOOGLECALENDAR_CREATE_EVENT", {
        calendar_id: "primary",
        summary: String(args.title ?? "Tempo event"),
        description: "Scheduled by Tempo.",
        start_datetime: String(args.start_datetime),
        event_duration_hour: Math.floor(duration / 60),
        event_duration_minutes: duration % 60,
        timezone: "UTC",
        ...(Array.isArray(args.attendee_emails) && args.attendee_emails.length
          ? { attendees: args.attendee_emails }
          : {}),
      });
      return JSON.stringify(
        result.successful
          ? { ok: true, booked: args.title, at: args.start_datetime }
          : { error: result.error ?? "Calendar refused." },
      );
    }

    if (name === "list_calendar_events") {
      const result = await executeTool("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin: String(args.time_min),
        timeMax: String(args.time_max),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 25,
      });
      if (!result.successful) {
        return JSON.stringify({ error: result.error ?? "Calendar refused." });
      }
      const data = result.data as {
        items?: {
          summary?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string };
          attendees?: { email?: string }[];
        }[];
      };
      const events = (data.items ?? []).slice(0, 25).map((e) => ({
        title: e.summary,
        start: e.start?.dateTime ?? e.start?.date,
        end: e.end?.dateTime,
        attendees: (e.attendees ?? []).map((a) => a.email),
      }));
      return JSON.stringify({ events }).slice(0, 2500);
    }

    if (name === "fetch_recent_emails") {
      const result = await executeTool("GMAIL_FETCH_EMAILS", {
        user_id: "me",
        query: String(args.query ?? "newer_than:7d"),
        max_results: Math.min(10, Number(args.max_results) || 8),
        include_payload: true,
        verbose: true,
      });
      if (!result.successful) {
        return JSON.stringify({ error: result.error ?? "Gmail refused." });
      }
      const data = result.data as { messages?: Record<string, unknown>[] };
      const emails = (data.messages ?? []).slice(0, 10).map((m) => ({
        from: m.sender ?? m.from,
        to: m.to,
        subject: m.subject,
        date: m.messageTimestamp ?? m.date,
        snippet: String(m.messageText ?? m.snippet ?? "").slice(0, 280),
      }));
      return JSON.stringify({ emails }).slice(0, 3000);
    }

    return JSON.stringify({ error: `Unknown tool ${name}.` });
  } catch (err) {
    return JSON.stringify({ error: String(err).slice(0, 200) });
  }
}

/* ------------------------------------------------------------------ */
/* Canned fallback (no API key needed)                                 */
/* ------------------------------------------------------------------ */

function cannedReply(text: string): string {
  const q = text.toLowerCase();
  const today = metricsForDay(todayUtc());
  const yesterday = metricsForDay(addDays(todayUtc(), -1));

  if (q.includes("sleep")) {
    return `You slept ${today.sleepHours} hours. Not because of exercise. Yesterday had ${yesterday.meetingHours} hours of meetings, most of them back-to-back. Your last three worst nights all followed days like that. Tonight is recoverable: nothing after 6pm, and I'd keep it that way.`;
  }
  if (q.includes("mom")) {
    return `Calls with your mom drop your heart rate 6 bpm on average. It's been 15 days since the last one. Sunday 5pm is free. Want me to hold it?`;
  }
  if (q.includes("4pm") || q.includes("sync") || q.includes("energy")) {
    return `Your energy dipped every day this week around the 4pm sync. It sits exactly on your circadian low, so even a light meeting feels expensive there. Moving it to 11am would cost the team nothing and save you the daily dip.`;
  }
  if (q.includes("expensive") || q.includes("meeting") || q.includes("marcus")) {
    return `Client calls with Marcus. They average +12 bpm and take about 40 minutes to come down from. You have one tomorrow with nothing blocked after it. I'd add a 20 minute buffer.`;
  }
  if (q.includes("hrv")) {
    return `HRV is at ${today.hrv} ms today. The pattern is clean: it dips after your heaviest meeting days and recovers fully on weekends, about 12% higher on Saturday and Sunday. The variable is meetings, not training.`;
  }
  if (q.includes("who") || q.includes("see") || q.includes("friend")) {
    return `Sid and Ava. Evenings with Sid lower your next-day strain, and walks with Ava are your most consistent recovery activity. And call your mom. It's been two weeks, and those calls drop your heart rate 6 bpm.`;
  }
  return `Here's where you stand: HRV ${today.hrv} ms, sleep ${today.sleepHours} h, energy ${today.energy}/100, ${today.meetingHours} h of meetings today. Ask me why any of those look the way they do. That's the part your wearable can't answer.`;
}

/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are Tempo, a personal health agent. You read the user's calendar, email, and health data and explain what their schedule is doing to their body. Voice: short, plain, direct. No em dashes. No emojis. Like a sharp friend, not an AI. Ground every answer in the data below. Keep answers under 120 words unless asked for detail.

You have real tools: create_calendar_event, list_calendar_events, fetch_recent_emails. Use them when the user asks about their real calendar or email, or asks you to schedule something. Use at most 2 tool calls per reply. If a tool says a service isn't connected, tell the user to connect it in Settings.

`;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const { default: OpenAIClient } = await import("openai");
      const openai = new OpenAIClient({ apiKey });
      const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

      const toolsEnabled = Boolean(getComposio());
      const statuses = toolsEnabled ? await getConnectionStatuses() : {};
      const statusLine = toolsEnabled
        ? `Connected services: ${Object.entries(statuses)
            .filter(([, v]) => v === "connected")
            .map(([k]) => k)
            .join(", ") || "none yet"}.\nToday's date: ${dayKey(todayUtc())} (UTC).\n\n`
        : "";

      const convo: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: SYSTEM_PROMPT + statusLine + "DATA:\n" + buildContext(),
        },
        ...messages.slice(-10),
      ];

      // Bounded tool loop: at most 2 rounds of tools, then a final answer.
      for (let round = 0; round < 3; round++) {
        const completion = await openai.chat.completions.create({
          model,
          max_tokens: 400,
          messages: convo,
          ...(toolsEnabled && round < 2 ? { tools: TOOL_DEFS } : {}),
        });

        const msg = completion.choices[0]?.message;
        if (!msg) break;

        if (msg.tool_calls?.length) {
          convo.push(msg);
          for (const call of msg.tool_calls.slice(0, 2)) {
            if (call.type !== "function") continue;
            const output = await runTool(
              call.function.name,
              call.function.arguments,
              statuses,
            );
            convo.push({
              role: "tool",
              tool_call_id: call.id,
              content: output,
            });
          }
          continue;
        }

        return NextResponse.json({
          reply: msg.content ?? "I lost my train of thought. Ask again?",
        });
      }

      return NextResponse.json({
        reply: "That took more steps than it should have. Try asking again?",
      });
    } catch {
      // Fall through to the canned engine so the demo never breaks.
    }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return NextResponse.json({ reply: cannedReply(lastUser?.content ?? "") });
}
