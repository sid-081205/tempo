import { NextResponse } from "next/server";
import {
  PEOPLE,
  addDays,
  getInsights,
  getPendingInvite,
  getTodayStory,
  metricsForDay,
  todayUtc,
} from "@/lib/mock";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContext(): string {
  const today = metricsForDay(todayUtc());
  const yesterday = metricsForDay(addDays(todayUtc(), -1));
  const insights = getInsights();
  const invite = getPendingInvite();

  return [
    `Today: HRV ${today.hrv} ms, resting HR ${today.restingHr} bpm, sleep ${today.sleepHours} h (score ${today.sleepScore}), energy ${today.energy}/100, meeting load ${today.meetingHours} h.`,
    `Yesterday: ${yesterday.meetingHours} h of meetings, sleep before that ${yesterday.sleepHours} h.`,
    `Story: ${getTodayStory()}`,
    `People (learned effects): ${PEOPLE.map((p) => `${p.name} (${p.relation}, ${p.hrDelta > 0 ? "+" : ""}${p.hrDelta} bpm, last seen ${p.daysSinceSeen}d ago)`).join("; ")}.`,
    `Current insights: ${insights.map((i) => i.title).join("; ")}.`,
    `Pending invite: "${invite.title}" from ${invite.from}, predicted +${invite.predictedHrDelta} bpm and ${invite.predictedRecoveryMin} min recovery.`,
  ].join("\n");
}

const SYSTEM_PROMPT = `You are Tempo, a personal health agent. You read the user's calendar and health data and explain what their schedule is doing to their body. Voice: short, plain, direct. No em dashes. No emojis. Like a sharp friend, not an AI. Ground every answer in the data below. Keep answers under 120 words unless asked for detail.

DATA:
`;

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
  if (q.includes("invite") || q.includes("q3") || q.includes("accept")) {
    return `The Q3 planning review from Priya will likely cost you around 40 minutes of elevated heart rate, based on your history with that group. I'd accept it, but let me block a 20 minute buffer after so it doesn't bleed into the rest of your day.`;
  }
  if (q.includes("week") || q.includes("tomorrow") || q.includes("thursday")) {
    return `Thursday is the one to watch. Product review, a Marcus call, and the 4pm sync stack up, and in your data that combination is a bad-sleep setup. One of the three can move. I'd move the sync.`;
  }
  return `Here's where you stand: HRV ${today.hrv} ms, sleep ${today.sleepHours} h, energy ${today.energy}/100, ${today.meetingHours} h of meetings today. Ask me why any of those look the way they do. That's the part your wearable can't answer.`;
}

/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + buildContext() },
          ...messages.slice(-10),
        ],
      });
      const reply =
        completion.choices[0]?.message?.content ??
        "I lost my train of thought. Ask again?";
      return NextResponse.json({ reply });
    } catch {
      // Fall through to the canned engine so the demo never breaks.
    }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return NextResponse.json({ reply: cannedReply(lastUser?.content ?? "") });
}
