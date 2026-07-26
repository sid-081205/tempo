"use client";

import { useEffect, useState } from "react";
import TempoLogo from "./TempoLogo";

const NOTIFS = [
  {
    body: "Calls with your mom drop your heart rate 6 bpm. It's been two weeks. Find a slot?",
  },
  {
    body: "This invite will cost you 40 minutes of elevated heart rate. Add a break after?",
  },
  {
    body: "Bad sleep last night? You had 6 hours of meetings yesterday.",
  },
  {
    body: "Your energy dips around your 4pm sync. Move it?",
  },
];

function TempoIcon({ dark }: { dark?: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
        dark ? "bg-white/90 text-[#131210]" : "bg-ink text-[#faf7f0]"
      }`}
    >
      <TempoLogo className="h-5 w-5" />
    </div>
  );
}

function Notification({
  body,
  entering,
  dark,
}: {
  body: string;
  entering: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={`${entering ? "notif-enter" : ""} flex items-start gap-3 rounded-3xl border p-3.5 shadow-lg backdrop-blur-xl ${
        dark
          ? "border-white/15 bg-white/12 shadow-black/40 text-white"
          : "border-white/60 bg-white/45 shadow-black/10 text-[#1c1a17]"
      }`}
    >
      <TempoIcon dark={dark} />
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold">Tempo</p>
          <p
            className={`text-[11px] ${dark ? "text-white/55" : "text-black/40"}`}
          >
            now
          </p>
        </div>
        <p
          className={`mt-0.5 text-[13px] leading-snug ${
            dark ? "text-white/85" : "text-black/75"
          }`}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

export default function PhoneMock({
  dark = false,
  tilt = 0,
  className = "",
}: {
  dark?: boolean;
  tilt?: number;
  className?: string;
}) {
  const [shown, setShown] = useState<{ id: number; idx: number }[]>([
    { id: 0, idx: 0 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setShown((prev) => {
        const next = {
          id: prev[0].id + 1,
          idx: (prev[0].idx + 1) % NOTIFS.length,
        };
        return [next, ...prev].slice(0, 2);
      });
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`float relative w-[272px] max-w-full sm:w-[320px] ${className}`}
      style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
    >
      <div
        className={`relative overflow-hidden rounded-[3.2rem] border-[10px] shadow-2xl ${
          dark
            ? "border-[#2a2731] shadow-black/60"
            : "border-[#2b2823] shadow-black/25"
        }`}
        style={{
          background: `linear-gradient(160deg, var(--phone-a) 0%, var(--phone-b) 100%)`,
        }}
      >
        {/* dynamic island */}
        <div className="absolute left-1/2 top-3 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black/90" />

        <div className="flex h-[560px] flex-col px-4 pt-14 sm:h-[600px] sm:pt-16">
          {/* lock screen clock */}
          <div
            className={`text-center ${dark ? "text-white/90" : "text-black/75"}`}
          >
            <p className="text-sm font-medium">Friday, July 25</p>
            <p className="mt-0.5 text-6xl font-semibold tracking-tight">
              9:41
            </p>
          </div>

          {/* notifications */}
          <div className="mt-8 flex flex-col gap-2.5">
            {shown.map((n, i) => (
              <Notification
                key={n.id}
                body={NOTIFS[n.idx].body}
                entering={i === 0}
                dark={dark}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
