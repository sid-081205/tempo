"use client";

import { useEffect, useRef, useState } from "react";
import type { Insight } from "@/lib/types";

/** How long a handled insight lingers before it slips away. */
const DISMISS_AFTER_MS = 3200;

export function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  function markDone(message: string | null) {
    setResult(message);
    setDone(true);
    dismissTimer.current = setTimeout(() => setGone(true), DISMISS_AFTER_MS);
  }

  async function act() {
    if (!insight.schedule) {
      markDone(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: insight.schedule }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (data.message) {
        markDone(data.message);
      } else {
        setError(data.error ?? "That didn't work. Try again.");
      }
    } catch {
      setError("Couldn't reach the calendar. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (gone) return null;

  return (
    <article
      className={`glass-strong overflow-hidden rounded-3xl ${
        insight.priority && !done ? "ring-1 ring-accent/20" : ""
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
        aria-expanded={open}
      >
        <h3 className="text-[15px] font-bold leading-snug tracking-tight">
          {insight.title}
        </h3>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50 text-ink/55 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
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
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {insight.stat && (
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-accent-deep">
                {insight.stat}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-ink/40">
                {insight.statLabel}
              </span>
            </div>
          )}
          <p className="text-[13px] leading-relaxed text-ink/70">
            {insight.body}
            {insight.sourceUrl && (
              <>
                {" "}
                <a
                  href={insight.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-deep underline decoration-accent/40 underline-offset-2 hover:opacity-75"
                >
                  View the email ↗
                </a>
              </>
            )}
          </p>

          {insight.action && (
            <div className="mt-4">
              {done ? (
                <p className="text-[13px] font-medium text-sage-deep">
                  {result ?? "Done. Tempo will handle it."}
                </p>
              ) : (
                <button
                  onClick={act}
                  disabled={busy}
                  className="btn-ink px-4 py-2 text-xs disabled:opacity-60"
                >
                  {busy ? "Booking…" : insight.action}
                </button>
              )}
              {error && <p className="mt-2 text-xs text-berry">{error}</p>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
