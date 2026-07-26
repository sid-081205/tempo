import { formatDayLabel, formatShortDay, formatTime } from "./format";
import type {
  CalEvent,
  DayMetrics,
  EventKind,
  HeartPoint,
  Insight,
  PendingInvite,
  Person,
  Workout,
} from "./types";

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(seedString: string) {
  return mulberry32(hashString(seedString));
}

/* ------------------------------------------------------------------ */
/* Time helpers (UTC everywhere for determinism)                       */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

export function nowMinutes(): number {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}


/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export const PEOPLE: Person[] = [
  {
    id: "mom",
    name: "Mom",
    relation: "family",
    hrDelta: -6,
    effect: "restores",
    note: "Calls with your mom drop your heart rate 6 bpm on average.",
    hue: 25,
    daysSinceSeen: 15,
  },
  {
    id: "sid",
    name: "Sid",
    relation: "friend",
    hrDelta: -4,
    effect: "restores",
    note: "Evenings with Sid reliably lower your strain the next day.",
    hue: 150,
    daysSinceSeen: 6,
  },
  {
    id: "ava",
    name: "Ava",
    relation: "friend",
    hrDelta: -3,
    effect: "restores",
    note: "Walks with Ava are your most consistent recovery activity.",
    hue: 200,
    daysSinceSeen: 3,
  },
  {
    id: "priya",
    name: "Priya",
    relation: "manager",
    hrDelta: 9,
    effect: "elevates",
    note: "1:1s with Priya raise your heart rate ~9 bpm. Fridays are worse.",
    hue: 285,
    daysSinceSeen: 2,
  },
  {
    id: "jake",
    name: "Jake",
    relation: "colleague",
    hrDelta: 2,
    effect: "neutral",
    note: "Meetings with Jake barely move your numbers.",
    hue: 45,
    daysSinceSeen: 1,
  },
  {
    id: "elena",
    name: "Elena",
    relation: "colleague",
    hrDelta: 7,
    effect: "elevates",
    note: "The 4pm sync Elena runs coincides with your daily energy dip.",
    hue: 330,
    daysSinceSeen: 1,
  },
  {
    id: "marcus",
    name: "Marcus",
    relation: "client",
    hrDelta: 12,
    effect: "elevates",
    note: "Client calls with Marcus cost you ~40 minutes of elevated heart rate.",
    hue: 0,
    daysSinceSeen: 2,
  },
];

export function getPerson(id: string): Person {
  return PEOPLE.find((p) => p.id === id) ?? PEOPLE[0];
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

function impactFor(
  kind: EventKind,
  hrDelta: number,
  recoveryMin: number,
  summary: string,
): CalEvent["impact"] {
  // Workouts spike heart rate but are restorative, not costly.
  const effect =
    kind === "workout" || hrDelta <= -2
      ? "restores"
      : hrDelta >= 5
        ? "elevates"
        : "neutral";
  return { effect, hrDelta, recoveryMin, summary };
}

interface Template {
  title: string;
  kind: EventKind;
  startMin: number;
  endMin: number;
  attendeeIds: string[];
  hrDelta: number;
  recoveryMin: number;
  summary: string;
}

function templatesFor(date: Date, offsetFromToday: number): Template[] {
  const dow = date.getUTCDay();
  const out: Template[] = [];
  const isYesterday = offsetFromToday === -1;

  const weekday = dow >= 1 && dow <= 5;

  if (weekday) {
    out.push({
      title: "Morning run",
      kind: "workout",
      startMin: 7 * 60,
      endMin: 7 * 60 + 40,
      attendeeIds: [],
      hrDelta: 42,
      recoveryMin: 18,
      summary: "Hard effort, good kind. Your HRV thanks you tomorrow.",
    });
  }

  if (weekday) {
    out.push({
      title: "Team standup",
      kind: "sync",
      startMin: 9 * 60 + 30,
      endMin: 10 * 60,
      attendeeIds: ["jake", "elena"],
      hrDelta: 4,
      recoveryMin: 5,
      summary: "Short and cheap. Barely registers.",
    });
  }

  if (isYesterday) {
    // The brutal back-to-back day that explains last night's bad sleep.
    out.push(
      {
        title: "Product review",
        kind: "review",
        startMin: 10 * 60,
        endMin: 11 * 60 + 30,
        attendeeIds: ["priya", "jake"],
        hrDelta: 8,
        recoveryMin: 25,
        summary: "Reviews with Priya run hot. +8 bpm for the duration.",
      },
      {
        title: "Client escalation with Marcus",
        kind: "external",
        startMin: 11 * 60 + 30,
        endMin: 12 * 60 + 30,
        attendeeIds: ["marcus"],
        hrDelta: 13,
        recoveryMin: 45,
        summary: "Your most expensive meeting type. 45 min to come back down.",
      },
      {
        title: "Roadmap workshop",
        kind: "review",
        startMin: 12 * 60 + 30,
        endMin: 14 * 60,
        attendeeIds: ["priya", "elena", "jake"],
        hrDelta: 9,
        recoveryMin: 30,
        summary: "Third back-to-back. No lunch. Your body noticed.",
      },
      {
        title: "Hiring debrief",
        kind: "sync",
        startMin: 14 * 60,
        endMin: 15 * 60,
        attendeeIds: ["jake"],
        hrDelta: 6,
        recoveryMin: 15,
        summary: "Fourth hour of meetings without a break.",
      },
    );
  } else if (weekday) {
    if (dow === 1 || dow === 4) {
      out.push({
        title: "Product review",
        kind: "review",
        startMin: 11 * 60,
        endMin: 12 * 60 + 30,
        attendeeIds: ["priya", "jake"],
        hrDelta: 8,
        recoveryMin: 25,
        summary: "Reviews with Priya run hot. +8 bpm for the duration.",
      });
    }
    if (dow === 2 || dow === 4) {
      out.push({
        title: "Client call with Marcus",
        kind: "external",
        startMin: 14 * 60,
        endMin: 15 * 60,
        attendeeIds: ["marcus"],
        hrDelta: 12,
        recoveryMin: 40,
        summary: "Calls with Marcus cost ~40 minutes of elevated heart rate.",
      });
    }
    if (dow === 3) {
      out.push({
        title: "1:1 with Priya",
        kind: "oneOnOne",
        startMin: 13 * 60,
        endMin: 13 * 60 + 30,
        attendeeIds: ["priya"],
        hrDelta: 9,
        recoveryMin: 20,
        summary: "1:1s with your manager average +9 bpm.",
      });
    }
    out.push({
      title: "Deep work",
      kind: "focus",
      startMin: 10 * 60 + 15,
      endMin: 12 * 60,
      attendeeIds: [],
      hrDelta: -2,
      recoveryMin: 0,
      summary: "Your calmest working state. Protect this block.",
    });
  }

  if (weekday) {
    out.push({
      title: "4pm sync",
      kind: "sync",
      startMin: 16 * 60,
      endMin: 16 * 60 + 45,
      attendeeIds: ["elena", "jake"],
      hrDelta: 7,
      recoveryMin: 20,
      summary: "Sits exactly on your daily energy dip. Worst possible slot.",
    });
  }

  if (dow === 6) {
    out.push(
      {
        title: "Long run",
        kind: "workout",
        startMin: 9 * 60,
        endMin: 10 * 60 + 20,
        attendeeIds: [],
        hrDelta: 45,
        recoveryMin: 25,
        summary: "Weekly long effort. Deep sleep follows.",
      },
      {
        title: "Dinner with Sid",
        kind: "social",
        startMin: 19 * 60,
        endMin: 21 * 60 + 30,
        attendeeIds: ["sid"],
        hrDelta: -4,
        recoveryMin: 0,
        summary: "Evenings with Sid lower next-day strain. Keep them.",
      },
    );
  }

  if (dow === 0) {
    out.push({
      title: "Walk with Ava",
      kind: "social",
      startMin: 10 * 60 + 30,
      endMin: 11 * 60 + 30,
      attendeeIds: ["ava"],
      hrDelta: -3,
      recoveryMin: 0,
      summary: "Your most consistent recovery activity.",
    });
    // Mom call only appears 2+ weeks back — that's the point of the nudge.
    if (offsetFromToday <= -14) {
      out.push({
        title: "Call Mom",
        kind: "call",
        startMin: 17 * 60,
        endMin: 17 * 60 + 40,
        attendeeIds: ["mom"],
        hrDelta: -6,
        recoveryMin: 0,
        summary: "Heart rate drops 6 bpm on average during these calls.",
      });
    }
  }

  return out;
}

export function eventsForDay(date: Date): CalEvent[] {
  const today = todayUtc();
  const offset = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  const key = dayKey(date);
  const r = rng("events:" + key);

  return templatesFor(date, offset).map((t, i) => {
    const jitter = Math.round((r() - 0.5) * 2) * 5; // -5, 0, +5 min
    return {
      id: `${key}-${i}`,
      title: t.title,
      kind: t.kind,
      day: key,
      startMin: t.startMin + jitter,
      endMin: t.endMin + jitter,
      attendeeIds: t.attendeeIds,
      impact: impactFor(t.kind, t.hrDelta, t.recoveryMin, t.summary),
    };
  });
}

export function eventsForRange(start: Date, days: number): CalEvent[] {
  const out: CalEvent[] = [];
  for (let i = 0; i < days; i++) out.push(...eventsForDay(addDays(start, i)));
  return out;
}

/* ------------------------------------------------------------------ */
/* Heart-rate series                                                   */
/* ------------------------------------------------------------------ */

/** Smooth circadian baseline bpm for minute-of-day. */
function baselineBpm(min: number): number {
  const h = min / 60;
  if (h < 6) return 54 + 2 * Math.sin((h / 6) * Math.PI);
  if (h < 8) return 54 + (h - 6) * 6; // wake ramp
  if (h < 22) return 66 + 3 * Math.sin(((h - 8) / 14) * Math.PI * 2);
  return 62 - (h - 22) * 3;
}

function eventContribution(min: number, events: CalEvent[]): number {
  let add = 0;
  for (const e of events) {
    const ramp = 6; // minutes to ramp in/out
    if (min >= e.startMin - ramp && min <= e.endMin) {
      const into = Math.min(1, (min - (e.startMin - ramp)) / ramp);
      add += e.impact.hrDelta * into;
    } else if (min > e.endMin && min <= e.endMin + e.impact.recoveryMin) {
      const decay = 1 - (min - e.endMin) / Math.max(1, e.impact.recoveryMin);
      add += e.impact.hrDelta * 0.55 * decay;
    }
  }
  return add;
}

/** Heart-rate points for one day at `step`-minute resolution, capped at `untilMin`. */
export function heartSeriesForDay(
  date: Date,
  step = 5,
  untilMin = 24 * 60,
): HeartPoint[] {
  const key = dayKey(date);
  const r = rng("hr:" + key);
  const events = eventsForDay(date);
  const points: HeartPoint[] = [];
  let noise = 0;
  for (let m = 0; m <= Math.min(untilMin, 24 * 60 - step); m += step) {
    noise = noise * 0.7 + (r() - 0.5) * 3.2;
    const bpm = baselineBpm(m) + eventContribution(m, events) + noise;
    points.push({ t: m, bpm: Math.round(bpm * 10) / 10 });
  }
  return points;
}

export type Range = "6h" | "24h" | "7d";

export type MetricId = "hr" | "hrv" | "strain" | "calories" | "resp";

export interface MetricSeries {
  id: MetricId;
  label: string;
  unit: string;
  color: string;
  points: HeartPoint[];
  current: number;
}

export interface PulseWindow {
  range: Range;
  /** Total minutes covered by the window. */
  windowMin: number;
  events: (CalEvent & { startT: number; endT: number })[];
  metrics: MetricSeries[];
  /** Ticks for the shared x axis: [t, label] */
  ticks: [number, string][];
}

const METRIC_DEFS: { id: MetricId; label: string; unit: string; color: string }[] = [
  { id: "hr", label: "Heart rate", unit: "bpm", color: "hsl(228 54% 36%)" },
  { id: "hrv", label: "HRV", unit: "ms", color: "hsl(140 32% 34%)" },
  { id: "strain", label: "Strain", unit: "", color: "hsl(228 52% 55%)" },
  { id: "calories", label: "Energy burned", unit: "kcal", color: "hsl(55 24% 25%)" },
  { id: "resp", label: "Respiratory rate", unit: "/min", color: "hsl(55 12% 45%)" },
];

/** Per-minute event contribution for a given metric. */
function metricEventAdd(metric: MetricId, min: number, events: CalEvent[]): number {
  if (metric === "hr") return eventContribution(min, events);

  let add = 0;
  for (const e of events) {
    const during = min >= e.startMin && min <= e.endMin;
    const inRecovery =
      min > e.endMin && min <= e.endMin + e.impact.recoveryMin;
    const decay = inRecovery
      ? 1 - (min - e.endMin) / Math.max(1, e.impact.recoveryMin)
      : 0;

    if (metric === "hrv") {
      const dip =
        e.kind === "workout" ? -12 : e.impact.hrDelta > 0 ? -e.impact.hrDelta * 0.6 : -e.impact.hrDelta * 0.8;
      if (during) add += dip;
      else if (inRecovery) add += dip * 0.6 * decay;
    } else if (metric === "resp") {
      const bump = e.kind === "workout" ? 6.5 : e.impact.hrDelta * 0.06;
      if (during) add += bump;
      else if (inRecovery) add += bump * 0.5 * decay;
    }
  }
  return add;
}

/** Per-minute accumulation rate for cumulative metrics (strain, calories). */
function metricRate(metric: MetricId, min: number, events: CalEvent[]): number {
  const asleep = min < 390; // ~6:30am
  let rate = 0;
  if (metric === "strain") rate = asleep ? 0.002 : 0.02;
  if (metric === "calories") rate = asleep ? 0.95 : 1.2;

  for (const e of events) {
    if (min < e.startMin || min > e.endMin) continue;
    if (metric === "strain") {
      rate += e.kind === "workout" ? 0.33 : Math.max(0, e.impact.hrDelta) * 0.006;
    } else {
      rate += e.kind === "workout" ? 7.5 : Math.max(0, e.impact.hrDelta) * 0.08;
    }
  }
  return rate;
}

function metricSeriesForDay(
  metric: MetricId,
  date: Date,
  step: number,
  untilMin: number,
): HeartPoint[] {
  if (metric === "hr") return heartSeriesForDay(date, step, untilMin);

  const key = dayKey(date);
  const events = eventsForDay(date);
  const r = rng(metric + ":" + key);
  const m = metricsForDay(date);
  const points: HeartPoint[] = [];
  const cumulative = metric === "strain" || metric === "calories";

  let acc = 0;
  let noise = 0;
  for (let min = 0; min <= Math.min(untilMin, 24 * 60 - step); min += step) {
    let value: number;
    if (cumulative) {
      acc += metricRate(metric, min, events) * step;
      value = acc;
    } else {
      noise = noise * 0.7 + (r() - 0.5) * (metric === "hrv" ? 3 : 0.5);
      const h = min / 60;
      const base =
        metric === "hrv"
          ? m.hrv + 7 * Math.cos((h / 24) * Math.PI * 2) // higher overnight
          : m.respRate + 0.5 * Math.cos((h / 24) * Math.PI * 2);
      value = base + metricEventAdd(metric, min, events) + noise;
    }
    points.push({ t: min, bpm: Math.round(value * 10) / 10 });
  }
  return points;
}

export function getPulseWindow(
  range: Range,
  extraEvents: CalEvent[] = [],
): PulseWindow {
  const today = todayUtc();
  const nowMin = nowMinutes();
  const step = range === "7d" ? 30 : 5;

  const windowMin =
    range === "7d" ? 7 * 24 * 60 : range === "24h" ? 24 * 60 : 6 * 60;

  // Window ends at "now"; starts windowMin earlier (may reach into previous days).
  const startAbsFromToday = nowMin - windowMin;
  const firstDayOffset = Math.floor(startAbsFromToday / (24 * 60));

  const extrasByDay = new Map<string, CalEvent[]>();
  for (const e of extraEvents) {
    if (!extrasByDay.has(e.day)) extrasByDay.set(e.day, []);
    extrasByDay.get(e.day)!.push(e);
  }

  const events: PulseWindow["events"] = [];
  const seriesById = new Map<MetricId, HeartPoint[]>(
    METRIC_DEFS.map((d) => [d.id, []]),
  );
  // Cumulative metrics accumulate across the whole window, not per day,
  // so the line never cliffs at midnight.
  const cumulativeBase = new Map<MetricId, number>([
    ["strain", 0],
    ["calories", 0],
  ]);

  for (let d = firstDayOffset; d <= 0; d++) {
    const date = addDays(today, d);
    const dayStartT = d * 24 * 60 - startAbsFromToday; // window-minute where this day begins
    const until = d === 0 ? nowMin : 24 * 60;

    for (const def of METRIC_DEFS) {
      const target = seriesById.get(def.id)!;
      const isCumulative = cumulativeBase.has(def.id);
      const base = cumulativeBase.get(def.id) ?? 0;
      const dayPoints = metricSeriesForDay(def.id, date, step, until);
      for (const p of dayPoints) {
        const t = dayStartT + p.t;
        if (t >= 0 && t <= windowMin) {
          target.push({ t, bpm: isCumulative ? p.bpm + base : p.bpm });
        }
      }
      if (isCumulative && dayPoints.length) {
        cumulativeBase.set(def.id, base + dayPoints[dayPoints.length - 1].bpm);
      }
    }

    for (const e of eventsForDay(date)) {
      const startT = dayStartT + e.startMin;
      const endT = dayStartT + e.endMin;
      const visibleUntil = dayStartT + until;
      if (endT >= 0 && startT <= Math.min(windowMin, visibleUntil)) {
        events.push({ ...e, startT: Math.max(0, startT), endT: Math.min(windowMin, endT) });
      }
    }

    // Live events (Google Calendar, Gmail proposals) for this day: not
    // clipped at "now", only at the window edge.
    for (const e of extrasByDay.get(dayKey(date)) ?? []) {
      const startT = dayStartT + e.startMin;
      const endT = dayStartT + e.endMin;
      if (endT >= 0 && startT <= windowMin) {
        events.push({ ...e, startT: Math.max(0, startT), endT: Math.min(windowMin, endT) });
      }
    }
  }

  const ticks: [number, string][] = [];
  if (range === "7d") {
    for (let d = firstDayOffset; d <= 0; d++) {
      const t = d * 24 * 60 - startAbsFromToday + 12 * 60;
      if (t >= 0 && t <= windowMin) {
        ticks.push([t, formatShortDay(dayKey(addDays(today, d))).split(" ")[0]]);
      }
    }
  } else {
    const stepH = range === "24h" ? 4 : 1;
    for (let m = 0; m <= windowMin; m += stepH * 60) {
      const abs = ((startAbsFromToday + m) % (24 * 60) + 24 * 60) % (24 * 60);
      ticks.push([m, formatTime(Math.round(abs / 60) * 60 % (24 * 60))]);
    }
  }

  const metrics: MetricSeries[] = METRIC_DEFS.map((def) => {
    const points = seriesById.get(def.id)!;
    // Re-zero cumulative series to the window start.
    if (cumulativeBase.has(def.id) && points.length) {
      const zero = points[0].bpm;
      for (const p of points) p.bpm = Math.round((p.bpm - zero) * 10) / 10;
    }
    return {
      ...def,
      points,
      current: points.length ? points[points.length - 1].bpm : 0,
    };
  });

  return { range, windowMin, events, metrics, ticks };
}

/* ------------------------------------------------------------------ */
/* Daily metrics                                                       */
/* ------------------------------------------------------------------ */

export function metricsForDay(date: Date): DayMetrics {
  const key = dayKey(date);
  const r = rng("metrics:" + key);

  const prevEvents = eventsForDay(addDays(date, -1));
  const prevMeetingMin = prevEvents
    .filter((e) => ["sync", "oneOnOne", "review", "external"].includes(e.kind))
    .reduce((acc, e) => acc + (e.endMin - e.startMin), 0);
  const prevMeetingHours = prevMeetingMin / 60;

  const todayEvents = eventsForDay(date);
  const meetingMin = todayEvents
    .filter((e) => ["sync", "oneOnOne", "review", "external"].includes(e.kind))
    .reduce((acc, e) => acc + (e.endMin - e.startMin), 0);

  const workoutMin = todayEvents
    .filter((e) => e.kind === "workout")
    .reduce((acc, e) => acc + (e.endMin - e.startMin), 0);

  const hrv = Math.round(64 - prevMeetingHours * 2.6 + (r() - 0.5) * 6);
  const sleepHours =
    Math.round((7.9 - prevMeetingHours * 0.28 + (r() - 0.5) * 0.7) * 10) / 10;
  const restingHr = Math.round(58 + prevMeetingHours * 0.9 + (r() - 0.5) * 2);
  const sleepScore = Math.max(
    40,
    Math.min(98, Math.round(sleepHours * 11.5 + (r() - 0.5) * 6)),
  );
  const energy = Math.max(
    25,
    Math.min(96, Math.round(hrv * 1.15 + sleepScore * 0.25 - prevMeetingHours * 2)),
  );
  const strain = Math.max(
    10,
    Math.min(
      95,
      Math.round(30 + (meetingMin / 60) * 9 + workoutMin * 0.45 + (r() - 0.5) * 8),
    ),
  );
  const recovery = Math.max(
    20,
    Math.min(99, Math.round(hrv * 0.9 + sleepScore * 0.35 - prevMeetingHours * 1.5)),
  );
  const sleepEfficiency = Math.max(
    72,
    Math.min(97, Math.round(88 - prevMeetingHours * 1.1 + (r() - 0.5) * 5)),
  );
  const respRate =
    Math.round((14.2 + prevMeetingHours * 0.12 + (r() - 0.5) * 0.6) * 10) / 10;
  const deepH =
    Math.round(sleepHours * (0.22 - prevMeetingHours * 0.006) * 10) / 10;
  const remH = Math.round(sleepHours * (0.24 + (r() - 0.5) * 0.03) * 10) / 10;
  const lightH = Math.round((sleepHours - deepH - remH) * 10) / 10;
  const calories = Math.round(
    1750 + workoutMin * 8.5 + (meetingMin / 60) * 25 + (r() - 0.5) * 120,
  );

  return {
    day: key,
    hrv,
    restingHr,
    recovery,
    sleepHours,
    sleepScore,
    sleepEfficiency,
    respRate,
    deepH,
    remH,
    lightH,
    energy,
    strain,
    calories,
    meetingHours: Math.round((meetingMin / 60) * 10) / 10,
  };
}

export function metricsForLastDays(days: number): DayMetrics[] {
  const today = todayUtc();
  const out: DayMetrics[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(metricsForDay(addDays(today, -i)));
  return out;
}

/* ------------------------------------------------------------------ */
/* Workouts                                                            */
/* ------------------------------------------------------------------ */

const ACTIVITY_FOR: Record<string, string> = {
  "Morning run": "Run",
  "Long run": "Run",
};

export function getWorkouts(days: number): Workout[] {
  const today = todayUtc();
  const out: Workout[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const key = dayKey(date);
    const r = rng("workout:" + key);
    for (const e of eventsForDay(date)) {
      if (e.kind !== "workout") continue;
      if (i === 0 && e.startMin > nowMinutes()) continue;
      const durationMin = e.endMin - e.startMin;
      const avgHr = Math.round(148 + (r() - 0.5) * 10);
      out.push({
        id: e.id + "-w",
        day: key,
        title: e.title,
        activity: ACTIVITY_FOR[e.title] ?? "Workout",
        startMin: e.startMin,
        durationMin,
        avgHr,
        maxHr: avgHr + Math.round(18 + r() * 10),
        calories: Math.round(durationMin * (9 + r() * 2.5)),
        strain: Math.round(Math.min(21, durationMin * 0.16 + 6 + r() * 2) * 10) / 10,
        hasGps: true,
      });
    }
  }
  return out.reverse();
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

export function getInsights(): Insight[] {
  return [
    // General medical trends
    {
      id: "trend-rhr",
      category: "trends",
      title: "Resting heart rate is creeping up",
      body: "Up 3 bpm over the last two weeks. This usually precedes a run of bad sleep in your data. Worth a lighter week.",
      stat: "+3 bpm",
      statLabel: "14-day drift",
      action: "Suggest a lighter week",
    },
    {
      id: "trend-hrv",
      category: "trends",
      title: "HRV recovers fully on weekends",
      body: "Your HRV averages 12% higher on Saturday and Sunday. Whatever the week takes out of you, weekends give back. The variable is meetings.",
      stat: "+12%",
      statLabel: "weekend HRV lift",
    },
    {
      id: "trend-sleep",
      category: "trends",
      title: "Sleep debt is building",
      body: "You averaged 6.4 hours this week against a 7.5 hour need. Two of the short nights followed 5+ meeting-hour days.",
      stat: "-4.9 h",
      statLabel: "weekly deficit",
      action: "Protect tonight",
    },
    // Schedule related
    {
      id: "sched-4pm",
      category: "schedule",
      title: "Your energy dips at every 4pm sync",
      body: "Energy fell every day this week around your 4pm sync. It sits exactly on your circadian low. Moving it to 11am would cost nothing and save a lot.",
      stat: "5/5",
      statLabel: "days with a dip",
      action: "Draft a move to 11am",
    },
    {
      id: "sched-backtoback",
      category: "schedule",
      title: "Bad sleep follows back-to-back days",
      body: "Your last three worst nights all followed days with 5+ hours of back-to-back meetings. Not exercise, not caffeine. Meetings.",
      stat: "3/3",
      statLabel: "worst nights explained",
    },
    {
      id: "sched-marcus",
      category: "schedule",
      title: "Marcus calls are your most expensive meeting",
      body: "Calls with Marcus average +12 bpm and take ~40 minutes to recover from. You have one tomorrow with nothing blocked after it.",
      stat: "40 min",
      statLabel: "recovery cost",
      action: "Add a buffer after",
    },
    // Changes to the future
    {
      id: "future-mom",
      category: "future",
      title: "Call your mom",
      body: "Your heart rate drops an average of 6 bpm after calls with your mom. It's been two weeks since the last one. Sunday 5pm is free.",
      stat: "-6 bpm",
      statLabel: "average effect",
      action: "Find a slot",
      schedule: {
        title: "Call Mom",
        day: dayKey(addDays(todayUtc(), ((7 - todayUtc().getUTCDay()) % 7) || 7)),
        startMin: 17 * 60,
        durationMin: 40,
      },
    },
    {
      id: "future-deepwork",
      category: "future",
      title: "Move hard work to 9–11am",
      body: "Your calmest, sharpest window is 9 to 11am. Next week has it buried under status meetings on three days. Tempo can hold the block.",
      stat: "9–11am",
      statLabel: "peak window",
      action: "Hold the block",
    },
    {
      id: "future-thursday",
      category: "future",
      title: "Thursday looks like your worst day",
      body: "Product review, a Marcus call, and the 4pm sync stack up. Based on your history that's a bad-sleep setup. One of the three can move.",
      stat: "3",
      statLabel: "costly events stacked",
      action: "Suggest a reshuffle",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Pending invite (invite triage)                                      */
/* ------------------------------------------------------------------ */

export function getPendingInvite(): PendingInvite {
  const tomorrow = addDays(todayUtc(), 1);
  const key = dayKey(tomorrow);
  return {
    id: "invite-q3",
    title: "Q3 planning review",
    from: "Priya",
    day: key,
    dayLabel: formatDayLabel(key),
    startMin: 14 * 60,
    endMin: 15 * 60 + 30,
    attendeeIds: ["priya", "marcus", "jake"],
    predictedHrDelta: 11,
    predictedRecoveryMin: 40,
    verdict:
      "Meetings like this one cost you ~40 minutes of elevated heart rate. Accept, but let Tempo block a 20-minute buffer after.",
  };
}

/* ------------------------------------------------------------------ */
/* Today's story (dashboard narrative + chat grounding)                */
/* ------------------------------------------------------------------ */

export function getTodayStory(): string {
  const m = metricsForDay(todayUtc());
  if (m.sleepHours < 7) {
    return `You slept ${m.sleepHours} hours. Not because of exercise. Yesterday had ${metricsForDay(addDays(todayUtc(), -1)).meetingHours} hours of back-to-back meetings. Today is lighter. Protect the evening.`;
  }
  return `You slept ${m.sleepHours} hours and HRV is at ${m.hrv} ms. A steady day. The 4pm sync is the only thing likely to move your numbers.`;
}
