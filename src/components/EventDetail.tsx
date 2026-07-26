"use client";

import type { CalEvent } from "@/lib/types";
import { formatTimeRange } from "@/lib/format";
import { crossImpacts } from "@/lib/impact";
import { effectColor } from "@/components/charts/MetricChart";
import { PersonChip } from "@/components/PersonChip";

export function SourceLink({ event }: { event: CalEvent }) {
  if (!event.source) return null;
  const label =
    event.source === "google" ? "Google Calendar" : "found in Gmail";
  const chip = (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/8 px-2.5 py-1 text-[11px] font-semibold text-accent-deep">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-deep" />
      {label}
      {event.sourceUrl && <span aria-hidden>↗</span>}
    </span>
  );
  return event.sourceUrl ? (
    <a
      href={event.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-opacity hover:opacity-75"
      title={event.source === "google" ? "Open in Google Calendar" : "Open the email in Gmail"}
    >
      {chip}
    </a>
  ) : (
    chip
  );
}

export function EventDetail({ event }: { event: CalEvent }) {
  return (
    <div className="glass-strong rounded-3xl p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">{event.title}</h3>
        <span className="flex items-center gap-2 text-xs text-ink/50">
          {formatTimeRange(event.startMin, event.endMin)}
          <SourceLink event={event} />
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-ink/70">
        {event.impact.summary}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink/40">
            Heart rate
          </p>
          <p
            className="text-lg font-semibold"
            style={{ color: effectColor(event.impact.effect) }}
          >
            {event.impact.hrDelta > 0 ? "+" : ""}
            {event.impact.hrDelta} bpm
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink/40">
            Recovery
          </p>
          <p className="text-lg font-semibold text-ink/80">
            {event.impact.recoveryMin > 0
              ? `${event.impact.recoveryMin} min`
              : "none needed"}
          </p>
        </div>
        {event.attendeeIds.length > 0 && (
          <div className="flex items-center gap-1.5">
            {event.attendeeIds.map((id) => (
              <PersonChip key={id} personId={id} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-ink/8 pt-4">
        <p className="mb-2 text-[11px] uppercase tracking-wider text-ink/40">
          Across your other metrics
        </p>
        <div className="flex flex-wrap gap-1.5">
          {crossImpacts(event).map((c) => (
            <span
              key={c.metric}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                c.tone === "good"
                  ? "border-sage/30 bg-sage/10 text-sage-deep"
                  : c.tone === "bad"
                    ? "border-accent/25 bg-accent/8 text-accent-deep"
                    : "border-white/60 bg-white/40 text-ink/60"
              }`}
            >
              {c.metric} <span className="font-semibold">{c.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
