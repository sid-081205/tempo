"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTONOMY_LEVELS = [
  {
    label: "Observe",
    blurb: "Tempo watches quietly. No insights, no suggestions.",
  },
  {
    label: "Explain",
    blurb: "Reactive. Plain-language insights about what already happened.",
  },
  {
    label: "Suggest",
    blurb: "Proactive. Tempo proposes changes: buffers, moves, check-ins. You approve each one.",
  },
  {
    label: "Act",
    blurb: "Tempo reshapes your schedule within rules you set, and tells you what it did.",
  },
];

const GOALS = [
  "Less stress",
  "Better sleep",
  "More deep work",
  "More time with family",
  "More movement",
  "Fewer meetings",
];

const CONNECTORS = [
  { id: "gcal", name: "Google Calendar", detail: "Events, invites, attendees" },
  { id: "gmail", name: "Gmail", detail: "Communication load and tone" },
  { id: "slack", name: "Slack", detail: "Pings, after-hours activity" },
  { id: "teams", name: "Microsoft Teams", detail: "Meetings and calls" },
  { id: "notion", name: "Notion", detail: "Open loops and pending pressure" },
];

const WEARABLES = [
  { id: "apple", name: "Apple Health", detail: "Primary source", primary: true },
  { id: "whoop", name: "WHOOP", detail: "Strain, recovery, journals" },
  { id: "oura", name: "Oura", detail: "Sleep staging, readiness" },
  { id: "fitbit", name: "Fitbit", detail: "Steps, heart rate" },
  { id: "strava", name: "Strava", detail: "Workouts" },
  { id: "juno", name: "Juno", detail: "Symptoms, meds, pace" },
  { id: "flo", name: "Flo", detail: "Cycle tracking" },
];

const DEFAULT_CONNECTED = ["gcal", "apple", "whoop"];

interface Prefs {
  autonomy: number;
  goals: string[];
  connected: string[];
}

const DEFAULT_PREFS: Prefs = {
  autonomy: 1,
  goals: ["Better sleep", "Less stress"],
  connected: DEFAULT_CONNECTED,
};

export function SettingsClient({
  name,
  email,
  isDemo,
  authEnabled,
}: {
  name: string;
  email: string;
  isDemo: boolean;
  authEnabled: boolean;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tempo:prefs");
      // Hydrating persisted prefs after mount is the intended pattern here:
      // localStorage doesn't exist during SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // Corrupt prefs: fall back to defaults.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("tempo:prefs", JSON.stringify(prefs));
  }, [prefs, loaded]);

  function toggleGoal(goal: string) {
    setPrefs((p) => ({
      ...p,
      goals: p.goals.includes(goal)
        ? p.goals.filter((g) => g !== goal)
        : [...p.goals, goal],
    }));
  }

  function toggleConnection(id: string) {
    setPrefs((p) => ({
      ...p,
      connected: p.connected.includes(id)
        ? p.connected.filter((c) => c !== id)
        : [...p.connected, id],
    }));
  }

  async function signOut() {
    if (!authEnabled) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const level = AUTONOMY_LEVELS[prefs.autonomy];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rise rise-1 mb-10">
        <p className="eyebrow mb-3 text-accent-deep">Settings</p>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Your rules.
        </h1>
      </div>

      {/* Account */}
      <Section className="rise rise-2" title="Account">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-base font-semibold text-paper">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-ink/50">
                {email || "no email"}
                {isDemo && " · demo mode"}
              </p>
            </div>
          </div>
          {authEnabled && !isDemo ? (
            <button
              onClick={signOut}
              className="rounded-full border border-white/60 bg-white/40 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-white/70"
            >
              Sign out
            </button>
          ) : (
            <span className="text-[11px] text-ink/40">
              Supabase auth off in demo
            </span>
          )}
        </div>
      </Section>

      {/* Autonomy dial */}
      <Section className="rise rise-3" title="Agent autonomy">
        <p className="mb-5 text-[13px] leading-relaxed text-ink/60">
          The dial between reactive and proactive. Tempo never does more than
          the level you&apos;ve granted.
        </p>
        <div className="mb-4 flex rounded-full bg-white/35 p-1 text-xs font-semibold">
          {AUTONOMY_LEVELS.map((l, i) => (
            <button
              key={l.label}
              onClick={() => setPrefs((p) => ({ ...p, autonomy: i }))}
              className={`flex-1 rounded-full px-2 py-2.5 transition-all duration-300 ${
                prefs.autonomy === i
                  ? "bg-white text-accent shadow-sm"
                  : "text-ink/50 hover:text-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-ink/70">{level.blurb}</p>
      </Section>

      {/* Goals */}
      <Section className="rise rise-4" title="What you're optimizing for">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const on = prefs.goals.includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-300 ${
                  on
                    ? "border-transparent bg-ink text-paper"
                    : "border-white/60 bg-white/40 text-ink/60 hover:bg-white/70"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Connectors */}
      <Section
        className="rise rise-5"
        title="Connectors"
        sub="Life context, via MCP tools. Why your state is what it is."
      >
        <ConnectionList
          items={CONNECTORS}
          connected={prefs.connected}
          onToggle={toggleConnection}
        />
      </Section>

      {/* Wearables */}
      <Section
        className="rise rise-6"
        title="Wearables & health"
        sub="Body state. What your body is doing."
      >
        <ConnectionList
          items={WEARABLES}
          connected={prefs.connected}
          onToggle={toggleConnection}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  sub,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-strong mb-5 rounded-[28px] p-6 ${className}`}>
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      {sub && <p className="mb-4 text-xs text-ink/50">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </section>
  );
}

function ConnectionList({
  items,
  connected,
  onToggle,
}: {
  items: { id: string; name: string; detail: string; primary?: boolean }[];
  connected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-ink/5">
      {items.map((item) => {
        const on = connected.includes(item.id);
        return (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium">
                {item.name}
                {item.primary && (
                  <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
                    primary
                  </span>
                )}
              </p>
              <p className="text-xs text-ink/50">{item.detail}</p>
            </div>
            <button
              onClick={() => onToggle(item.id)}
              role="switch"
              aria-checked={on}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
                on ? "bg-ink" : "bg-ink/15"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  on ? "left-6" : "left-1"
                }`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
