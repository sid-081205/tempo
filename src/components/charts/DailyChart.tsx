"use client";

const W = 460;
const H = 150;
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;

export interface DailyPoint {
  label: string;
  value: number;
  /** Optional stacked segments drawn bottom-up (used for sleep stages). */
  segments?: { value: number; color: string }[];
  highlight?: boolean;
}

/** Small 14-day line chart with dots. */
export function DailyLine({
  points,
  color = "hsl(228 54% 36%)",
  unit = "",
}: {
  points: DailyPoint[];
  color?: string;
  unit?: string;
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const xOf = (i: number) =>
    PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);
  const yOf = (v: number) =>
    PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xOf(i)}
          cy={yOf(p.value)}
          r={i === points.length - 1 ? 4 : 2.2}
          fill={color}
          opacity={i === points.length - 1 ? 1 : 0.45}
        />
      ))}
      <text
        x={xOf(points.length - 1)}
        y={yOf(last.value) - 9}
        textAnchor="end"
        fontSize="11"
        fontWeight="600"
        fill={color}
      >
        {last.value}
        {unit}
      </text>
      {points.map(
        (p, i) =>
          i % 2 === 0 && (
            <text
              key={"l" + i}
              x={xOf(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="hsl(55 24% 15%)"
              fillOpacity="0.35"
            >
              {p.label}
            </text>
          ),
      )}
    </svg>
  );
}

/** Small 14-day bar chart, optionally stacked. */
export function DailyBars({
  points,
  color = "hsl(228 52% 46%)",
  unit = "",
}: {
  points: DailyPoint[];
  color?: string;
  unit?: string;
}) {
  if (points.length === 0) return null;
  const totals = points.map((p) =>
    p.segments ? p.segments.reduce((a, s) => a + s.value, 0) : p.value,
  );
  const max = Math.max(...totals) || 1;
  const slot = (W - PAD_X * 2) / points.length;
  const barW = Math.min(20, slot * 0.62);
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {points.map((p, i) => {
        const x = PAD_X + slot * i + (slot - barW) / 2;
        if (p.segments) {
          let y = H - PAD_BOTTOM;
          return (
            <g key={i}>
              {p.segments.map((s, j) => {
                const h = (s.value / max) * chartH;
                y -= h;
                return (
                  <rect
                    key={j}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, h - 1)}
                    rx={2.5}
                    fill={s.color}
                  />
                );
              })}
            </g>
          );
        }
        const h = (p.value / max) * chartH;
        return (
          <rect
            key={i}
            x={x}
            y={H - PAD_BOTTOM - h}
            width={barW}
            height={h}
            rx={3}
            fill={color}
            opacity={p.highlight ? 0.95 : i === points.length - 1 ? 0.85 : 0.4}
          />
        );
      })}
      <text
        x={W - PAD_X}
        y={PAD_TOP - 2}
        textAnchor="end"
        fontSize="11"
        fontWeight="600"
        fill={color}
      >
        {totals[totals.length - 1] % 1 === 0
          ? totals[totals.length - 1]
          : totals[totals.length - 1].toFixed(1)}
        {unit}
      </text>
      {points.map(
        (p, i) =>
          i % 2 === 0 && (
            <text
              key={"l" + i}
              x={PAD_X + slot * i + slot / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="hsl(55 24% 15%)"
              fillOpacity="0.35"
            >
              {p.label}
            </text>
          ),
      )}
      <text x={PAD_X} y={PAD_TOP - 2} fontSize="10" fill="hsl(55 24% 15%)" fillOpacity="0">
        {last.label}
      </text>
    </svg>
  );
}
