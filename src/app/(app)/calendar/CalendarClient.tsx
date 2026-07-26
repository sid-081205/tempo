"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CalEvent } from "@/lib/types";
import { formatShortDay, formatTime, formatTimeRange } from "@/lib/format";
import { PersonChip } from "@/components/PersonChip";
import { SourceLink } from "@/components/EventDetail";

const DAY_START = 7 * 60;
const DAY_END = 22 * 60;
const GRID_H = 660; // px

function yOf(min: number): number {
  const clamped = Math.max(DAY_START, Math.min(DAY_END, min));
  return ((clamped - DAY_START) / (DAY_END - DAY_START)) * GRID_H;
}

function effectStyles(effect: string): string {
  if (effect === "restores")
    return "bg-sage/15 border-sage/40 text-sage-deep hover:bg-sage/25";
  if (effect === "elevates")
    return "bg-accent/10 border-accent/35 text-accent-deep hover:bg-accent/20";
  return "bg-white/45 border-white/70 text-ink/70 hover:bg-white/70";
}

/** Assign overlapping events to side-by-side columns. */
function layoutDay(
  events: CalEvent[],
): { event: CalEvent; col: number; cols: number }[] {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin);
  const placed: { event: CalEvent; col: number; cols: number }[] = [];

  for (const event of sorted) {
    const overlapping = placed.filter(
      (p) => p.event.endMin > event.startMin && p.event.startMin < event.endMin,
    );
    const used = new Set(overlapping.map((p) => p.col));
    let col = 0;
    while (used.has(col)) col++;
    const entry = { event, col, cols: 1 };
    placed.push(entry);
    const cluster = [...overlapping, entry];
    const cols = Math.max(...cluster.map((p) => p.col)) + 1;
    for (const p of cluster) p.cols = Math.max(p.cols, cols);
  }

  return placed;
}

export function CalendarClient({
  weeks,
  events,
  todayKey,
  live,
}: {
  weeks: string[][];
  events: CalEvent[];
  todayKey: string;
  live: ("google" | "gmail")[];
}) {
  const [weekIdx, setWeekIdx] = useState(1);
  const [selected, setSelected] = useState<CalEvent | null>(null);

  const days = weeks[weekIdx];
  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!map.has(e.day)) map.set(e.day, []);
      map.get(e.day)!.push(e);
    }
    return map;
  }, [events]);

  const hours: number[] = [];
  for (let m = DAY_START; m <= DAY_END; m += 120) hours.push(m);

  const weekLabel =
    weekIdx === 0 ? "Last week" : weekIdx === 1 ? "This week" : "Next week";

  return (
    <div>
      <div className="rise rise-1 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-accent-deep">Master calendar</p>
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            {weekLabel}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass flex rounded-full p-1 text-xs font-semibold">
            {["Last", "This", "Next"].map((label, i) => (
              <button
                key={label}
                onClick={() => setWeekIdx(i)}
                className={`rounded-full px-4 py-2 transition-all duration-300 ${
                  weekIdx === i
                    ? "bg-white text-accent shadow-sm"
                    : "text-ink/55 hover:text-ink"
                }`}
              >
                {label} week
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend + source */}
      <div className="rise rise-2 mb-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-ink/55">
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sage/70" /> restores you
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/90 ring-1 ring-line" />{" "}
            neutral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent/60" /> costs you
          </span>
        </div>
        {live.length > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 font-medium text-sage-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
            Live:{" "}
            {live
              .map((s) => (s === "google" ? "Google Calendar" : "Gmail"))
              .join(" + ")}
          </span>
        ) : (
          <a
            href="/settings"
            className="rounded-full border border-white/60 bg-white/40 px-3 py-1 font-medium text-ink/55 transition-colors hover:bg-white/70"
          >
            Connect Google Calendar →
          </a>
        )}
      </div>

      {/* Grid */}
      <div className="rise rise-3 glass-strong overflow-x-auto rounded-[28px] p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={weekIdx}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-[720px]"
          >
            {/* Day headers */}
            <div className="mb-2 grid grid-cols-[44px_repeat(7,1fr)] gap-1.5">
              <div />
              {days.map((day) => {
                const isToday = day === todayKey;
                return (
                  <div key={day} className="text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        isToday ? "bg-ink text-paper" : "text-ink/55"
                      }`}
                    >
                      {formatShortDay(day)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-1.5">
              {/* Hour rail */}
              <div className="relative" style={{ height: GRID_H }}>
                {hours.map((m) => (
                  <span
                    key={m}
                    className="absolute -translate-y-1/2 text-[10px] text-ink/40"
                    style={{ top: yOf(m) }}
                  >
                    {formatTime(m)}
                  </span>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => (
                <div
                  key={day}
                  className="relative rounded-2xl bg-white/25"
                  style={{ height: GRID_H }}
                >
                  {hours.map((m) => (
                    <div
                      key={m}
                      className="absolute inset-x-0 border-t border-ink/5"
                      style={{ top: yOf(m) }}
                    />
                  ))}
                  {layoutDay(byDay.get(day) ?? []).map(({ event: e, col, cols }) => {
                    const top = yOf(e.startMin);
                    const height = Math.max(22, yOf(e.endMin) - top);
                    const width = `calc((100% - 8px) / ${cols})`;
                    const left = `calc(4px + (100% - 8px) * ${col} / ${cols})`;
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelected(e)}
                        className={`absolute overflow-hidden rounded-xl border px-2 py-1 text-left text-[11px] font-medium leading-tight transition-colors duration-200 ${effectStyles(e.impact.effect)}`}
                        style={{ top, height, width, left }}
                      >
                        <span className="block truncate">{e.title}</span>
                        {height > 34 && cols === 1 && (
                          <span className="block truncate text-[10px] opacity-60">
                            {formatTime(e.startMin)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Event detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong w-full max-w-md rounded-[28px] bg-card/80 p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="eyebrow text-ink/45">
                  {formatShortDay(selected.day)} ·{" "}
                  {formatTimeRange(selected.startMin, selected.endMin)}
                </p>
                <SourceLink event={selected} />
              </div>
              <h2 className="mb-2 text-2xl font-medium tracking-tight">
                {selected.title}
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-ink/70">
                {selected.impact.summary}
              </p>

              <div className="mb-5 flex gap-8">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/40">
                    Heart rate
                  </p>
                  <p className="text-xl font-semibold">
                    {selected.impact.hrDelta > 0 ? "+" : ""}
                    {selected.impact.hrDelta} bpm
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/40">
                    Recovery
                  </p>
                  <p className="text-xl font-semibold">
                    {selected.impact.recoveryMin > 0
                      ? `${selected.impact.recoveryMin} min`
                      : "none"}
                  </p>
                </div>
              </div>

              {selected.attendeeIds.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-1.5">
                  {selected.attendeeIds.map((id) => (
                    <PersonChip key={id} personId={id} />
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="btn-ink w-full px-5 py-3 text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
