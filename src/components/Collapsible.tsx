"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function Collapsible({
  eyebrow,
  headline,
  headlineSub,
  defaultOpen = true,
  children,
  className = "",
}: {
  eyebrow: string;
  headline: string;
  headlineSub?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`glass-strong rounded-[28px] ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="eyebrow mb-1 text-ink/45">{eyebrow}</p>
          <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {headline}
            {headlineSub && (
              <span className="ml-2 text-sm font-normal text-ink/50">
                {headlineSub}
              </span>
            )}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/50 text-ink/60"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
