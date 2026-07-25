"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { HeartWindow, Range } from "@/lib/mock";
import type { DayMetrics, PendingInvite, Workout } from "@/lib/types";
import { formatShortDay, formatTime, formatTimeRange } from "@/lib/format";
import { HeartChart } from "@/components/charts/HeartChart";
import { DailyBars, DailyLine } from "@/components/charts/DailyChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { PersonChip } from "@/components/PersonChip";
import { LogoTile } from "@/components/Logo";
import { Collapsible } from "@/components/Collapsible";
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
  windows: Record<Range, HeartWindow>;
  metrics: DayMetrics[];
  workouts: Workout[];
  invite: PendingInvite;
  authEnabled: boolean;
}) {
  const [range, setRange] = useState<Range>("24h");
  const [inviteHandled, setInviteHandled] = useState<string | null>(null);

  const today = metrics[metrics.length - 1];
  const win = windows[range];
  const dayLabels = metrics.map((m) => String(Number(m.day.slice(8))));
  const point = (i: number, value: number) => ({ label: dayLabels[i], value });

  const hrvDelta = today.hrv - metrics[metrics.length - 8].hrv;

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

      {/* Top row: stats + invite */}
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <div className="rise rise-2 grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            label="HRV"
            value={`${today.hrv} ms`}
            sub={`${hrvDelta >= 0 ? "+" : ""}${hrvDelta} vs last wk`}
            series={metrics.map((m) => m.hrv)}
          />
          <StatCard
            label="Sleep"
            value={`${today.sleepHours} h`}
            sub={`score ${today.sleepScore}`}
            series={metrics.map((m) => m.sleepHours)}
          />
          <StatCard
            label="Recovery"
            value={`${today.recovery}`}
            sub="of 100"
            series={metrics.map((m) => m.recovery)}
          />
          <StatCard
            label="Meeting load"
            value={`${today.meetingHours} h`}
            sub="today"
            series={metrics.map((m) => m.meetingHours)}
          />
        </div>

        {/* Invite triage */}
        <section className="rise rise-3 drop-spring glass-strong rounded-[28px] p-5">
          <div className="mb-3 flex items-center gap-3">
            <LogoTile size={34} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight">
                New invite
              </p>
              <p className="text-[11px] text-ink/40">now</p>
            </div>
          </div>

          <p className="mb-1 text-sm font-semibold">
            {invite.title}
            <span className="font-normal text-ink/50"> · from {invite.from}</span>
          </p>
          <p className="mb-2 text-xs text-ink/50">
            {invite.dayLabel}, {formatTimeRange(invite.startMin, invite.endMin)}
          </p>
          <p className="mb-3 text-[13px] leading-snug text-ink/75">
            {invite.verdict}
          </p>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {invite.attendeeIds.map((id) => (
              <PersonChip key={id} personId={id} />
            ))}
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
              <motion.div
                key="actions"
                exit={{ opacity: 0, y: -6 }}
                className="flex gap-2"
              >
                <button
                  onClick={() =>
                    setInviteHandled("Accepted, with a 20 min buffer after.")
                  }
                  className="btn-ink flex-1 px-4 py-2.5 text-xs"
                >
                  Accept + buffer
                </button>
                <button
                  onClick={() => setInviteHandled("Declined. Good call.")}
                  className="flex-1 rounded-full border border-white/60 bg-white/40 px-4 py-2.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-white/70"
                >
                  Decline
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Metric sections */}
      <div className="flex flex-col gap-5">
        {/* Physiology */}
        <Collapsible
          className="rise rise-4"
          eyebrow="Physiology"
          headline={`${Math.round(win.currentBpm)} bpm`}
          headlineSub="now"
          defaultOpen
        >
          <div className="mb-4 flex justify-end">
            <div className="glass flex rounded-full p-1 text-xs font-semibold">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`rounded-full px-3.5 py-1.5 transition-all duration-300 ${
                    range === r.id
                      ? "bg-white text-accent shadow-sm"
                      : "text-ink/55 hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={range}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeartChart window={win} />
            </motion.div>
          </AnimatePresence>
          <p className="mt-3 text-xs text-ink/45">
            Shaded bands are calendar events. Press one to see what it did to
            your body, across every metric.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MiniChart label="Strain" sub="last 14 days">
              <DailyBars
                points={metrics.map((m, i) => point(i, m.strain))}
                color="hsl(228 52% 46%)"
              />
            </MiniChart>
            <MiniChart label="Energy burned" sub="kcal, last 14 days">
              <DailyBars
                points={metrics.map((m, i) => point(i, m.calories))}
                color="hsl(55 24% 15%)"
                unit=" kcal"
              />
            </MiniChart>
          </div>
        </Collapsible>

        {/* Recovery */}
        <Collapsible
          className="rise rise-5"
          eyebrow="Recovery"
          headline={`${today.recovery}`}
          headlineSub="of 100 today"
          defaultOpen
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniChart label="HRV" sub="ms">
              <DailyLine
                points={metrics.map((m, i) => point(i, m.hrv))}
                unit=" ms"
              />
            </MiniChart>
            <MiniChart label="Resting heart rate" sub="bpm">
              <DailyLine
                points={metrics.map((m, i) => point(i, m.restingHr))}
                color="hsl(0 45% 50%)"
                unit=" bpm"
              />
            </MiniChart>
            <MiniChart label="Recovery score" sub="of 100">
              <DailyBars
                points={metrics.map((m, i) => ({
                  ...point(i, m.recovery),
                  highlight: m.recovery >= 70,
                }))}
                color="hsl(140 32% 40%)"
              />
            </MiniChart>
          </div>
          <p className="mt-3 text-xs text-ink/45">
            Dips follow your heaviest meeting days. Weekends give it back.
          </p>
        </Collapsible>

        {/* Sleep */}
        <Collapsible
          className="rise rise-5"
          eyebrow="Sleep"
          headline={`${today.sleepHours} h`}
          headlineSub={`score ${today.sleepScore}`}
          defaultOpen
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniChart label="Duration & stages" sub="deep · REM · light">
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
            </MiniChart>
            <div className="grid gap-4">
              <MiniChart label="Efficiency" sub="%" compact>
                <DailyLine
                  points={metrics.map((m, i) => point(i, m.sleepEfficiency))}
                  color="hsl(140 32% 40%)"
                  unit="%"
                />
              </MiniChart>
              <MiniChart label="Respiratory rate" sub="breaths/min" compact>
                <DailyLine
                  points={metrics.map((m, i) => point(i, m.respRate))}
                  color="hsl(55 12% 45%)"
                />
              </MiniChart>
            </div>
          </div>
        </Collapsible>

        {/* Workouts */}
        <Collapsible
          className="rise rise-6"
          eyebrow="Workouts"
          headline={`${workouts.filter((w) => metrics.slice(-7).some((m) => m.day === w.day)).length}`}
          headlineSub="in the last 7 days"
          defaultOpen={false}
        >
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <MiniChart label="Daily strain" sub="last 14 days">
              <DailyBars
                points={metrics.map((m, i) => point(i, m.strain))}
                color="hsl(228 52% 46%)"
              />
            </MiniChart>
            <MiniChart label="Calories burned" sub="kcal">
              <DailyLine
                points={metrics.map((m, i) => point(i, m.calories))}
                color="hsl(55 24% 15%)"
              />
            </MiniChart>
          </div>
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
                    {formatShortDay(w.day)} · {formatTime(w.startMin)} ·{" "}
                    {w.durationMin} min
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
        </Collapsible>

        {/* Journal */}
        <Collapsible
          className="rise rise-6"
          eyebrow="Journal"
          headline="Check in"
          defaultOpen={false}
        >
          <Journal authEnabled={authEnabled} />
        </Collapsible>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  series,
}: {
  label: string;
  value: string;
  sub: string;
  series: number[];
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="eyebrow mb-2 text-ink/45">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">
        {value}
        <span className="ml-1.5 text-xs font-normal text-ink/50">{sub}</span>
      </p>
      <div className="mt-2">
        <Sparkline values={series} stroke="hsl(55 24% 15% / 0.45)" />
      </div>
    </div>
  );
}

function MiniChart({
  label,
  sub,
  compact = false,
  children,
}: {
  label: string;
  sub?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass rounded-3xl ${compact ? "p-4" : "p-5"}`}>
      <p className="mb-2 text-xs font-semibold text-ink/65">
        {label}
        {sub && <span className="ml-1.5 font-normal text-ink/40">{sub}</span>}
      </p>
      {children}
    </div>
  );
}
