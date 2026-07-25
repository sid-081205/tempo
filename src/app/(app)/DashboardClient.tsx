"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { HeartWindow, Range } from "@/lib/mock";
import type { DayMetrics, PendingInvite } from "@/lib/types";
import { formatTimeRange } from "@/lib/format";
import { HeartChart } from "@/components/charts/HeartChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { PersonChip } from "@/components/PersonChip";
import { LogoTile } from "@/components/Logo";

const RANGES: { id: Range; label: string }[] = [
  { id: "6h", label: "6 hr" },
  { id: "24h", label: "24 hr" },
  { id: "7d", label: "7 d" },
];

export function DashboardClient({
  greeting,
  dateLabel,
  story,
  windows,
  metrics,
  invite,
}: {
  greeting: string;
  dateLabel: string;
  story: string;
  windows: Record<Range, HeartWindow>;
  metrics: DayMetrics[];
  invite: PendingInvite;
}) {
  const [range, setRange] = useState<Range>("24h");
  const [inviteHandled, setInviteHandled] = useState<string | null>(null);

  const today = metrics[metrics.length - 1];
  const win = windows[range];

  const hrvSeries = metrics.map((m) => m.hrv);
  const sleepSeries = metrics.map((m) => m.sleepHours);
  const rhrSeries = metrics.map((m) => m.restingHr);
  const energySeries = metrics.map((m) => m.energy);
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

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Heart rate card */}
        <section className="rise rise-2 glass-strong rounded-[28px] p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-1 text-ink/45">Heart rate</p>
              <p className="text-3xl font-semibold tracking-tight">
                {Math.round(win.currentBpm)}
                <span className="ml-1.5 text-sm font-normal text-ink/50">
                  bpm now
                </span>
              </p>
            </div>
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
            your body.
          </p>
        </section>

        {/* Side column */}
        <div className="flex flex-col gap-5">
          {/* HRV */}
          <section className="rise rise-3 glass-strong rounded-[28px] p-6">
            <p className="eyebrow mb-1 text-ink/45">HRV</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight">
                {today.hrv}
                <span className="ml-1.5 text-sm font-normal text-ink/50">
                  ms
                </span>
              </p>
              <span
                className={`text-sm font-medium ${
                  hrvDelta >= 0 ? "text-sage-deep" : "text-berry"
                }`}
              >
                {hrvDelta >= 0 ? "+" : ""}
                {hrvDelta} vs last week
              </span>
            </div>
            <div className="mt-3">
              <Sparkline values={hrvSeries} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/50">
              Last 14 days. Dips follow your heaviest meeting days.
            </p>
          </section>

          {/* Invite triage */}
          <section className="rise rise-4 drop-spring glass-strong rounded-[28px] p-5">
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
              <span className="font-normal text-ink/50">
                {" "}
                · from {invite.from}
              </span>
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
      </div>

      {/* Stat row */}
      <div className="rise rise-5 mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Sleep"
          value={`${today.sleepHours} h`}
          sub={`score ${today.sleepScore}`}
          series={sleepSeries}
        />
        <StatCard
          label="Resting HR"
          value={`${today.restingHr}`}
          sub="bpm"
          series={rhrSeries}
        />
        <StatCard
          label="Energy"
          value={`${today.energy}`}
          sub="of 100"
          series={energySeries}
        />
        <StatCard
          label="Meeting load"
          value={`${today.meetingHours} h`}
          sub="today"
          series={metrics.map((m) => m.meetingHours)}
        />
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
