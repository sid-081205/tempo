export type Relation =
  | "family"
  | "friend"
  | "manager"
  | "colleague"
  | "partner"
  | "client";

export type Effect = "restores" | "neutral" | "elevates";

export interface Person {
  id: string;
  name: string;
  relation: Relation;
  /** Learned average heart-rate delta when spending time with this person. */
  hrDelta: number;
  effect: Effect;
  note: string;
  /** Hue used for the avatar swatch. */
  hue: number;
  /** Days since Tempo last saw quality time with this person. */
  daysSinceSeen: number;
}

export type EventKind =
  | "sync"
  | "oneOnOne"
  | "review"
  | "deepWork"
  | "social"
  | "workout"
  | "call"
  | "external"
  | "focus"
  | "break";

export interface EventImpact {
  effect: Effect;
  /** Average bpm above/below baseline during the event. */
  hrDelta: number;
  /** Minutes of elevated heart rate after the event ends. */
  recoveryMin: number;
  /** One-line explanation in Tempo's voice. */
  summary: string;
}

export interface CalEvent {
  id: string;
  title: string;
  kind: EventKind;
  /** ISO date, e.g. "2026-07-25" */
  day: string;
  /** Minutes from midnight. */
  startMin: number;
  endMin: number;
  attendeeIds: string[];
  impact: EventImpact;
}

export interface HeartPoint {
  /** Minutes from midnight of the first day in the window. */
  t: number;
  bpm: number;
}

export interface DayMetrics {
  day: string;
  // Recovery
  hrv: number;
  restingHr: number;
  recovery: number; // 0-100
  // Sleep
  sleepHours: number;
  sleepScore: number;
  sleepEfficiency: number; // %
  respRate: number; // breaths/min
  deepH: number;
  remH: number;
  lightH: number;
  // Physiology
  energy: number; // 0-100
  strain: number; // 0-100
  calories: number; // kcal
  meetingHours: number;
}

export interface Workout {
  id: string;
  day: string;
  title: string;
  activity: string;
  startMin: number;
  durationMin: number;
  avgHr: number;
  maxHr: number;
  calories: number;
  strain: number;
  hasGps: boolean;
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  feeling: string;
  note: string;
}

export interface CrossImpact {
  metric: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}

export type InsightCategory = "trends" | "schedule" | "future";

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  body: string;
  stat?: string;
  statLabel?: string;
  action?: string;
}

export interface PendingInvite {
  id: string;
  title: string;
  from: string;
  day: string;
  dayLabel: string;
  startMin: number;
  endMin: number;
  attendeeIds: string[];
  predictedHrDelta: number;
  predictedRecoveryMin: number;
  verdict: string;
}
