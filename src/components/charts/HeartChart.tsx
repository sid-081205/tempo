"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { HeartWindow } from "@/lib/mock";
import { formatTimeRange } from "@/lib/format";
import { PersonChip } from "@/components/PersonChip";

const W = 1000;
const H = 300;
const PAD_X = 8;
const PAD_TOP = 18;
const PAD_BOTTOM = 34;

function effectColor(effect: string): string {
  if (effect === "restores") return "hsl(140 32% 40%)";
  if (effect === "elevates") return "hsl(228 52% 46%)";
  return "hsl(55 12% 52%)";
}

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function HeartChart({ window: win }: { window: HeartWindow }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { linePath, areaPath, xOf, yOf, yTicks, lastPoint } = useMemo(() => {
    const bpms = win.points.map((p) => p.bpm);
    const min = Math.min(...bpms) - 8;
    const max = Math.max(...bpms) + 8;

    const xOf = (t: number) =>
      PAD_X + (t / win.windowMin) * (W - PAD_X * 2);
    const yOf = (bpm: number) =>
      PAD_TOP + (1 - (bpm - min) / (max - min)) * (H - PAD_TOP - PAD_BOTTOM);

    const pts: [number, number][] = win.points.map((p) => [xOf(p.t), yOf(p.bpm)]);
    const linePath = smoothPath(pts);
    const last = pts[pts.length - 1];
    const areaPath =
      linePath +
      ` L ${last[0].toFixed(1)},${H - PAD_BOTTOM} L ${pts[0][0].toFixed(1)},${H - PAD_BOTTOM} Z`;

    const yTicks: number[] = [];
    const span = max - min;
    const step = span > 60 ? 30 : span > 30 ? 20 : 10;
    for (let v = Math.ceil(min / step) * step; v < max; v += step) yTicks.push(v);

    return { linePath, areaPath, xOf, yOf, yTicks, lastPoint: last };
  }, [win]);

  const selected = win.events.find((e) => e.id === selectedId) ?? null;

  const chipEvents = useMemo(
    () => [...win.events].sort((a, b) => a.startT - b.startT),
    [win.events],
  );

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Heart rate over time with calendar events overlaid"
        >
          <defs>
            <linearGradient id="hr-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(228 52% 46%)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(228 52% 46%)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={yOf(v)}
                y2={yOf(v)}
                stroke="hsl(55 24% 15%)"
                strokeOpacity="0.07"
                strokeWidth="1"
              />
              <text
                x={W - PAD_X}
                y={yOf(v) - 5}
                textAnchor="end"
                fontSize="11"
                fill="hsl(55 24% 15%)"
                fillOpacity="0.35"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Event bands */}
          {win.events.map((e) => {
            const x = xOf(e.startT);
            const w = Math.max(6, xOf(e.endT) - x);
            const active = selectedId === e.id;
            return (
              <rect
                key={e.id}
                x={x}
                y={PAD_TOP - 6}
                width={w}
                height={H - PAD_TOP - PAD_BOTTOM + 12}
                rx="8"
                fill={effectColor(e.impact.effect)}
                opacity={active ? 0.22 : 0.09}
                className="cursor-pointer transition-opacity duration-200 hover:opacity-20"
                onClick={() => setSelectedId(active ? null : e.id)}
              />
            );
          })}

          <path d={areaPath} fill="url(#hr-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="hsl(228 54% 36%)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Now dot */}
          {lastPoint && (
            <g>
              <circle cx={lastPoint[0]} cy={lastPoint[1]} r="10" fill="hsl(228 52% 46%)" opacity="0.15">
                <animate attributeName="r" values="6;12;6" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={lastPoint[0]} cy={lastPoint[1]} r="4" fill="hsl(228 54% 36%)" />
            </g>
          )}

          {win.ticks.map(([t, label]) => (
            <text
              key={t}
              x={xOf(t)}
              y={H - 10}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(55 24% 15%)"
              fillOpacity="0.4"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      {/* Stacked event chips */}
      {chipEvents.length > 0 && (
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {chipEvents.map((e) => {
            const active = selectedId === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedId(active ? null : e.id)}
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
              </button>
            );
          })}
        </div>
      )}

      {/* Event detail */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 6, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="glass mt-4 rounded-3xl p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold">{selected.title}</h3>
                <span className="text-xs text-ink/50">
                  {formatTimeRange(selected.startMin, selected.endMin)}
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-ink/70">
                {selected.impact.summary}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/40">
                    Heart rate
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: effectColor(selected.impact.effect) }}
                  >
                    {selected.impact.hrDelta > 0 ? "+" : ""}
                    {selected.impact.hrDelta} bpm
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/40">
                    Recovery
                  </p>
                  <p className="text-lg font-semibold text-ink/80">
                    {selected.impact.recoveryMin > 0
                      ? `${selected.impact.recoveryMin} min`
                      : "none needed"}
                  </p>
                </div>
                {selected.attendeeIds.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {selected.attendeeIds.map((id) => (
                      <PersonChip key={id} personId={id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
