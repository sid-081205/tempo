"use client";

import { useMemo } from "react";
import type { MetricSeries, PulseWindow } from "@/lib/mock";

const W = 1000;
const H = 170;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

export function effectColor(effect: string): string {
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

function niceStep(span: number): number {
  const raw = span / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1e-6, raw))));
  for (const mult of [1, 2, 5, 10]) {
    if (raw <= mag * mult) return mag * mult;
  }
  return mag * 10;
}

/**
 * One metric, full width, with the shared event bands overlaid.
 * All instances in a stack share the same x scale, so a selected event
 * lines up vertically across every graph.
 */
export function MetricChart({
  metric,
  window: win,
  selectedId,
  onSelectAction,
}: {
  metric: MetricSeries;
  window: PulseWindow;
  selectedId: string | null;
  onSelectAction: (id: string | null) => void;
}) {
  const { linePath, areaPath, xOf, yOf, yTicks, lastPoint } = useMemo(() => {
    const values = metric.points.map((p) => p.bpm);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = (rawMax - rawMin || 1) * 0.12;
    const min = rawMin - pad;
    const max = rawMax + pad;

    const xOf = (t: number) => PAD_X + (t / win.windowMin) * (W - PAD_X * 2);
    const yOf = (v: number) =>
      PAD_TOP + (1 - (v - min) / (max - min)) * (H - PAD_TOP - PAD_BOTTOM);

    const pts: [number, number][] = metric.points.map((p) => [
      xOf(p.t),
      yOf(p.bpm),
    ]);
    const linePath = smoothPath(pts);
    const last = pts[pts.length - 1];
    const areaPath = last
      ? linePath +
        ` L ${last[0].toFixed(1)},${H - PAD_BOTTOM} L ${pts[0][0].toFixed(1)},${H - PAD_BOTTOM} Z`
      : "";

    const step = niceStep(max - min);
    const yTicks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v < max; v += step) yTicks.push(v);

    return { linePath, areaPath, xOf, yOf, yTicks, lastPoint: last };
  }, [metric.points, win.windowMin]);

  const gradId = `fill-${metric.id}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${metric.label} over time with calendar events overlaid`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={metric.color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
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
            strokeOpacity="0.06"
            strokeWidth="1"
          />
          <text
            x={W - PAD_X}
            y={yOf(v) - 4}
            textAnchor="end"
            fontSize="10"
            fill="hsl(55 24% 15%)"
            fillOpacity="0.32"
          >
            {Math.round(v)}
          </text>
        </g>
      ))}

      {/* Shared event bands */}
      {win.events.map((e) => {
        const x = xOf(e.startT);
        const w = Math.max(6, xOf(e.endT) - x);
        const active = selectedId === e.id;
        return (
          <rect
            key={e.id}
            x={x}
            y={PAD_TOP - 5}
            width={w}
            height={H - PAD_TOP - PAD_BOTTOM + 10}
            rx="7"
            fill={effectColor(e.impact.effect)}
            opacity={active ? 0.26 : 0.08}
            className="cursor-pointer transition-opacity duration-200 hover:opacity-20"
            onClick={() => onSelectAction(active ? null : e.id)}
          />
        );
      })}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={metric.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {lastPoint && (
        <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3.5" fill={metric.color} />
      )}

      {win.ticks.map(([t, label]) => (
        <text
          key={t}
          x={xOf(t)}
          y={H - 7}
          textAnchor="middle"
          fontSize="10"
          fill="hsl(55 24% 15%)"
          fillOpacity="0.38"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
