"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MetricSeries, PulseWindow, Range } from "@/lib/mock";
import type { DayMetrics, PendingInvite, Workout } from "@/lib/types";
import { formatShortDay, formatTime, formatTimeRange } from "@/lib/format";
import { MetricChart, effectColor } from "@/components/charts/MetricChart";
import { DailyBars, DailyLine } from "@/components/charts/DailyChart";
import { EventDetail } from "@/components/EventDetail";
import { PersonChip } from "@/components/PersonChip";
import { LogoTile } from "@/components/Logo";
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
  invite,
  authEnabled,
}: {
  greeting: string;
  dateLabel: string;
  story: string;
  windows: Record<Range, PulseWindow>;
  metrics: DayMetrics[];
  workouts: Workout[];
  invite: PendingInvite;
  authEnabled: boolean;
}) {
  const [range, setRange] = useState<Range>("24h");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteHandled, setInviteHandled] = useState<string | null>(null);

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
      <div className="rise rise-1 mb-8">
        <p className="eyebrow mb-3 text-accent-deep">{dateLabel}</p>
        <h1 className="mb-3 text-4xl font-medium tracking-tight sm:text-5xl">
          {greeting}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-ink/70">
          {story}
        </p>
      </div>

      {/* Invite triage */}
      <section className="rise rise-2 drop-spring glass-strong mb-8 rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <LogoTile size={36} />
            <div>
              <p className="text-sm font-semibold">
                New invite: {invite.title}
                <span className="font-normal text-ink/50"> · from {invite.from}</span>
              </p>
              <p className="mb-1.5 text-xs text-ink/50">
                {invite.dayLabel}, {formatTimeRange(invite.startMin, invite.endMin)}
              </p>
              <p className="mb-2 max-w-lg text-[13px] leading-snug text-ink/75">
                {invite.verdict}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {invite.attendeeIds.map((id) => (
                  <PersonChip key={id} personId={id} />
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {inviteHandled ? (
              <motion.p
                key="handled"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-sage-deep"
              >
                {inviteHandled}
              </motion.p>
            ) : (
              <motion.div key="actions" exit={{ opacity: 0, y: -6 }} className="flex gap-2">
                <button
                  onClick={() => setInviteHandled("Accepted, with a 20 min buffer after.")}
                  className="btn-ink px-4 py-2.5 text-xs"
                >
                  Accept + buffer
                </button>
                <button
                  onClick={() => setInviteHandled("Declined. Good call.")}
                  className="rounded-full border border-white/60 bg-white/40 px-4 py-2.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-white/70"
                >
                  Decline
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Controls: range + events */}
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
        <p className="text-xs text-ink/45">
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
    <section className={`glass-strong rounded-3xl ${className}`}>
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
