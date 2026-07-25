"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Insight } from "@/lib/types";

export function InsightCard({ insight }: { insight: Insight }) {
  const [done, setDone] = useState(false);

  return (
    <article className="glass-strong rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
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
      <h3 className="mb-1.5 text-[15px] font-semibold leading-snug">
        {insight.title}
      </h3>
      <p className="text-[13px] leading-relaxed text-ink/70">{insight.body}</p>

      {insight.action && (
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.p
                key="done"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] font-medium text-sage-deep"
              >
                Done. Tempo will handle it.
              </motion.p>
            ) : (
              <motion.button
                key="action"
                exit={{ opacity: 0, y: -6 }}
                onClick={() => setDone(true)}
                className="btn-ink px-4 py-2 text-xs"
              >
                {insight.action}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </article>
  );
}
