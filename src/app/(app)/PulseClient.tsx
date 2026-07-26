"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MetricSeries, PulseWindow, Range } from "@/lib/mock";
import type { DayMetrics, Workout } from "@/lib/types";
import { formatShortDay, formatTime } from "@/lib/format";
import { MetricChart, effectColor } from "@/components/charts/MetricChart";
import { DailyBars, DailyLine } from "@/components/charts/DailyChart";
import { EventDetail } from "@/components/EventDetail";
import { Journal } from "@/components/Journal";

const RANGES: { id: Range; label: string }[] = [
  { id: "6h", label: "6 hr" },
  { id: "24h", label: "24 hr" },
  { id: "7d", label: "7 d" },
];

const STAGE_COLORS = {
  deep: "hsl(228 54% 36%)",
  rem: "hsl(228 52% 60%)",
  light: "hsl(228 45% 80%)",
};

export function PulseClient({
  greeting,
  dateLabel,
  story,
  windows,
  metrics,
  workouts,
  authEnabled,
}: {
  greeting: string;
  dateLabel: string;
  story: string;
  windows: Record<Range, PulseWindow>;
  metrics: DayMetrics[];
  workouts: Workout[];
  authEnabled: boolean;
}) {
  const [range, setRange] = useState<Range>("24h");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = metrics[metrics.length - 1];
  const win = windows[range];
  const dayLabels = metrics.map((m) => String(Number(m.day.slice(8))));
  const point = (i: number, value: number) => ({ label: dayLabels[i], value });

  const selected = win.events.find((e) => e.id === selectedId) ?? null;
  const chipEvents = [...win.events].sort((a, b) => a.startT - b.startT);

  function selectEvent(id: string | null) {
    setSelectedId(id);
  }

  function changeRange(r: Range) {
    setRange(r);
    setSelectedId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="rise rise-1 mb-6">
        <p className="eyebrow mb-3 text-accent-deep">{dateLabel}</p>
        <h1 className="mb-3 text-4xl font-medium tracking-tight sm:text-5xl">
          {greeting}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-ink/70">
          {story}
        </p>
      </div>

      {/* At a glance */}
      <div className="rise rise-2 no-scrollbar -mx-1 mb-8 flex items-stretch gap-2.5 overflow-x-auto px-1 pb-1">
        <div className="glass flex shrink-0 items-center gap-3 rounded-full py-2 pl-2.5 pr-5">
          <RecoveryRing value={today.recovery} />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
              Recovery
            </p>
            <p className="text-sm font-semibold leading-tight">
              {today.recovery >= 70 ? "Ready" : today.recovery >= 45 ? "Steady" : "Take it easy"}
            </p>
          </div>
        </div>
        <GlanceChip label="HRV" value={`${today.hrv} ms`} />
        <GlanceChip label="Sleep" value={`${today.sleepHours} h`} />
        <GlanceChip label="Resting HR" value={`${today.restingHr} bpm`} />
        <GlanceChip label="Meetings" value={`${today.meetingHours} h`} />
      </div>

      {/* Controls: range + events */}
      <SectionLabel className="rise rise-3">Right now</SectionLabel>
      <div className="rise rise-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="glass flex rounded-full p-1 text-xs font-semibold">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => changeRange(r.id)}
              className={`rounded-full px-4 py-2 transition-all duration-300 ${
                range === r.id
                  ? "bg-white text-accent shadow-sm"
                  : "text-ink/55 hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-ink/45">
          <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
          Press an event to see its impact on every graph below.
        </p>
      </div>

      {chipEvents.length > 0 && (
        <div className="rise rise-3 no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {chipEvents.map((e) => {
            const active = selectedId === e.id;
            return (
              <button
                key={e.id}
                onClick={() => selectEvent(active ? null : e.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                  active
                    ? "border-transparent bg-ink text-paper"
                    : "border-white/60 bg-white/40 text-ink/70 hover:bg-white/70"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: effectColor(e.impact.effect) }}
                />
                {e.title}
                <span className={active ? "text-paper/60" : "text-ink/40"}>
                  {formatTime(e.startMin)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected event, across every metric */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 6, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 overflow-hidden"
          >
            <EventDetail event={selected} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stacked metric graphs */}
      <div className="flex flex-col gap-3">
        {win.metrics.map((metric, i) => (
          <MetricPanel
            key={metric.id}
            metric={metric}
            window={win}
            range={range}
            selectedId={selectedId}
            onSelectAction={selectEvent}
            className={`rise rise-${Math.min(6, i + 3)}`}
          />
        ))}

        {/* Daily metrics, same stacked pattern */}
        <SectionLabel className="rise rise-6 mt-4">Day by day</SectionLabel>
        <SimplePanel
          label="Sleep"
          value={`${today.sleepHours} h`}
          sub={`score ${today.sleepScore} · efficiency ${today.sleepEfficiency}%`}
          dot={STAGE_COLORS.deep}
          className="rise rise-6"
        >
          <DailyBars
            points={metrics.map((m, i) => ({
              label: dayLabels[i],
              value: m.sleepHours,
              segments: [
                { value: m.deepH, color: STAGE_COLORS.deep },
                { value: m.remH, color: STAGE_COLORS.rem },
                { value: m.lightH, color: STAGE_COLORS.light },
              ],
            }))}
            unit=" h"
          />
          <div className="mt-2 flex gap-3 text-[10px] text-ink/50">
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-sm" style={{ background: STAGE_COLORS.deep }} />
              deep
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-sm" style={{ background: STAGE_COLORS.rem }} />
              REM
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-sm" style={{ background: STAGE_COLORS.light }} />
              light
            </span>
          </div>
        </SimplePanel>

        <SimplePanel
          label="Recovery"
          value={`${today.recovery}`}
          sub="of 100 · last 14 days"
          dot="hsl(140 32% 40%)"
          className="rise rise-6"
        >
          <DailyBars
            points={metrics.map((m, i) => ({
              ...point(i, m.recovery),
              highlight: m.recovery >= 70,
            }))}
            color="hsl(140 32% 40%)"
          />
        </SimplePanel>

        <SimplePanel
          label="Resting heart rate"
          value={`${today.restingHr} bpm`}
          sub="last 14 days"
          dot="hsl(0 45% 50%)"
          className="rise rise-6"
        >
          <DailyLine
            points={metrics.map((m, i) => point(i, m.restingHr))}
            color="hsl(0 45% 50%)"
            unit=" bpm"
          />
        </SimplePanel>

        <SimplePanel
          label="Workouts"
          value={`${workouts.filter((w) => metrics.slice(-7).some((m) => m.day === w.day)).length}`}
          sub="in the last 7 days"
          dot="hsl(140 32% 40%)"
          defaultOpen={false}
          className="rise rise-6"
        >
          <ul className="space-y-2.5">
            {workouts.slice(0, 5).map((w) => (
              <li
                key={w.id}
                className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {w.title}
                    <span className="ml-2 rounded-full bg-sage/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sage-deep">
                      {w.activity}
                    </span>
                    {w.hasGps && (
                      <span className="ml-1.5 rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink/45">
                        GPS
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    {formatShortDay(w.day)} · {formatTime(w.startMin)} · {w.durationMin} min
                  </p>
                </div>
                <div className="flex gap-4 text-right text-xs text-ink/60">
                  <span>
                    <b className="block text-sm text-ink/85">{w.avgHr}</b> avg bpm
                  </span>
                  <span>
                    <b className="block text-sm text-ink/85">{w.calories}</b> kcal
                  </span>
                  <span>
                    <b className="block text-sm text-ink/85">{w.strain}</b> strain
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </SimplePanel>

        <SectionLabel className="rise rise-6 mt-4">You</SectionLabel>
        <SimplePanel
          label="Journal"
          value="Check in"
          sub="what sensors miss"
          dot="hsl(55 24% 25%)"
          defaultOpen={false}
          className="rise rise-6"
        >
          <Journal authEnabled={authEnabled} />
        </SimplePanel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-1 ${className}`}>
      <span className="eyebrow text-ink/40">{children}</span>
      <span className="h-px flex-1 bg-ink/8" />
    </div>
  );
}

function GlanceChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass flex shrink-0 flex-col justify-center rounded-full px-5 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
        {label}
      </p>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}

function RecoveryRing({ value }: { value: number }) {
  const color =
    value >= 70
      ? "hsl(140 32% 40%)"
      : value >= 45
        ? "hsl(228 52% 46%)"
        : "hsl(340 40% 50%)";
  return (
    <div className="relative h-11 w-11">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="hsl(55 24% 15% / 0.08)"
          strokeWidth="3.4"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke={color}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeDasharray={`${value} 100`}
          pathLength={100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
        {value}
      </span>
    </div>
  );
}

function PanelShell({
  label,
  value,
  sub,
  dot,
  defaultOpen = true,
  children,
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  dot?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`glass-strong rounded-3xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.22)] ${className}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          {dot && (
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
          )}
          {label}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">
            {value}
            {sub && (
              <span className="ml-1.5 text-xs font-normal text-ink/45">{sub}</span>
            )}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50 text-ink/55"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MetricPanel({
  metric,
  window: win,
  range,
  selectedId,
  onSelectAction,
  className,
}: {
  metric: MetricSeries;
  window: PulseWindow;
  range: Range;
  selectedId: string | null;
  onSelectAction: (id: string | null) => void;
  className?: string;
}) {
  const current =
    metric.id === "calories" || metric.id === "strain"
      ? Math.round(metric.current)
      : metric.current % 1 === 0
        ? metric.current
        : metric.current.toFixed(1);
  const cumulative = metric.id === "strain" || metric.id === "calories";
  const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? range;

  return (
    <PanelShell
      label={metric.label}
      value={`${current}${metric.unit ? ` ${metric.unit}` : ""}`}
      sub={cumulative ? `in the last ${rangeLabel}` : "now"}
      dot={metric.color}
      className={className}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={range}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <MetricChart
            metric={metric}
            window={win}
            selectedId={selectedId}
            onSelectAction={onSelectAction}
          />
        </motion.div>
      </AnimatePresence>
    </PanelShell>
  );
}

function SimplePanel(props: {
  label: string;
  value: string;
  sub?: string;
  dot?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return <PanelShell {...props} />;
}
