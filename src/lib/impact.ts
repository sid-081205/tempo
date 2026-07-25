import type { CalEvent, CrossImpact } from "./types";

/**
 * How one calendar event shows up across the other metrics.
 * Derived deterministically from the event's learned heart-rate impact.
 */
export function crossImpacts(e: CalEvent): CrossImpact[] {
  const { hrDelta, recoveryMin, effect } = e.impact;

  if (e.kind === "workout") {
    return [
      { metric: "Strain", value: `+${Math.round(hrDelta * 0.28)}`, tone: "neutral" },
      { metric: "Calories", value: `+${Math.round((e.endMin - e.startMin) * 9)}`, tone: "neutral" },
      { metric: "HRV tomorrow", value: `+${Math.max(2, Math.round(hrDelta * 0.12))} ms`, tone: "good" },
      { metric: "Deep sleep", value: "up tonight", tone: "good" },
    ];
  }

  if (effect === "restores") {
    return [
      { metric: "HRV", value: `+${Math.max(2, Math.round(-hrDelta * 0.7))} ms`, tone: "good" },
      { metric: "Recovery", value: `+${Math.max(2, Math.round(-hrDelta * 0.9))}`, tone: "good" },
      { metric: "Next-day strain", value: "lower", tone: "good" },
    ];
  }

  if (effect === "elevates") {
    const out: CrossImpact[] = [
      { metric: "HRV", value: `-${Math.round(hrDelta * 0.6)} ms`, tone: "bad" },
      { metric: "Strain", value: `+${Math.round(hrDelta * 0.4)}`, tone: "bad" },
      { metric: "Recovery", value: `-${Math.round(hrDelta * 0.5)}`, tone: "bad" },
    ];
    if (recoveryMin >= 30) {
      out.push({ metric: "Sleep tonight", value: "at risk", tone: "bad" });
    }
    return out;
  }

  return [
    { metric: "HRV", value: "unchanged", tone: "neutral" },
    { metric: "Strain", value: "unchanged", tone: "neutral" },
  ];
}
