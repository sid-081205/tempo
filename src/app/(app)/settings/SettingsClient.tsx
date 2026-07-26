"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONNECTORS, type Connector } from "@/lib/connectors";
import type { ConnectionStatus } from "@/lib/composio";

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

interface Prefs {
  autonomy: number;
  goals: string[];
}

const DEFAULT_PREFS: Prefs = {
  autonomy: 1,
  goals: ["Better sleep", "Less stress"],
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

  const [connectorsEnabled, setConnectorsEnabled] = useState<boolean | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const pollUntil = useRef(0);

  const refreshConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      const data = (await res.json()) as {
        enabled: boolean;
        statuses: Record<string, ConnectionStatus>;
      };
      setConnectorsEnabled(data.enabled);
      setStatuses(data.statuses ?? {});
    } catch {
      setConnectorsEnabled(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tempo:prefs");
      // localStorage doesn't exist during SSR; hydrate after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // Corrupt prefs: fall back to defaults.
    }
    setLoaded(true);
    void refreshConnections();
  }, [refreshConnections]);

  useEffect(() => {
    if (loaded) localStorage.setItem("tempo:prefs", JSON.stringify(prefs));
  }, [prefs, loaded]);

  // While an OAuth window is open, poll for completion.
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pollUntil.current) void refreshConnections();
    }, 4000);
    return () => clearInterval(id);
  }, [refreshConnections]);

  async function connect(connector: Connector) {
    if (!connector.toolkit || busy) return;
    setBusy(connector.id);
    setConnectError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id }),
      });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener");
        setStatuses((s) => ({ ...s, [connector.toolkit!]: "pending" }));
        pollUntil.current = Date.now() + 3 * 60 * 1000;
      } else {
        setConnectError(data.error ?? "Something went sideways. Try again.");
      }
    } catch {
      setConnectError("Couldn't reach the connector service. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(connector: Connector) {
    if (!connector.toolkit || busy) return;
    setBusy(connector.id);
    setConnectError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setStatuses((s) => ({ ...s, [connector.toolkit!]: "disconnected" }));
      } else {
        setConnectError(data.error ?? "Couldn't disconnect. Try again.");
      }
    } catch {
      setConnectError("Couldn't reach the connector service. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function signOut() {
    if (!authEnabled) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const level = AUTONOMY_LEVELS[prefs.autonomy];
  const contextConnectors = CONNECTORS.filter((c) => c.kind === "context");
  const healthConnectors = CONNECTORS.filter((c) => c.kind === "health");

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
                onClick={() =>
                  setPrefs((p) => ({
                    ...p,
                    goals: on
                      ? p.goals.filter((x) => x !== g)
                      : [...p.goals, g],
                  }))
                }
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
        <ConnectorList
          items={contextConnectors}
          enabled={connectorsEnabled}
          statuses={statuses}
          busy={busy}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={refreshConnections}
        />
      </Section>

      {/* Wearables */}
      <Section
        className="rise rise-6"
        title="Wearables & health"
        sub="Body state. What your body is doing."
      >
        <ConnectorList
          items={healthConnectors}
          enabled={connectorsEnabled}
          statuses={statuses}
          busy={busy}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={refreshConnections}
        />
      </Section>

      {connectError && (
        <p className="rise mb-6 px-2 text-sm text-berry">{connectError}</p>
      )}
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

function ConnectorList({
  items,
  enabled,
  statuses,
  busy,
  onConnect,
  onDisconnect,
  onRefresh,
}: {
  items: Connector[];
  enabled: boolean | null;
  statuses: Record<string, ConnectionStatus>;
  busy: string | null;
  onConnect: (c: Connector) => void;
  onDisconnect: (c: Connector) => void;
  onRefresh: () => void;
}) {
  return (
    <ul className="divide-y divide-ink/5">
      {items.map((item) => {
        const status = item.toolkit ? statuses[item.toolkit] : undefined;
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

            {!item.toolkit ? (
              <span className="shrink-0 rounded-full bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/40">
                Soon
              </span>
            ) : enabled === false ? (
              <span
                className="shrink-0 rounded-full bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/40"
                title="Set COMPOSIO_API_KEY to enable"
              >
                Needs setup
              </span>
            ) : status === "connected" ? (
              <span className="flex shrink-0 items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-[11px] font-semibold text-sage-deep">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
                  Connected
                </span>
                <button
                  onClick={() => onDisconnect(item)}
                  disabled={busy !== null}
                  className="rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/55 transition-colors hover:bg-white/70 hover:text-berry disabled:opacity-50"
                >
                  {busy === item.id ? "…" : "Disconnect"}
                </button>
              </span>
            ) : status === "pending" ? (
              <span className="flex shrink-0 items-center gap-2">
                <button
                  onClick={onRefresh}
                  className="rounded-full border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-semibold text-accent-deep"
                  title="Finish signing in, then press to refresh"
                >
                  Finishing…
                </button>
                <button
                  onClick={() => onDisconnect(item)}
                  disabled={busy !== null}
                  className="rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/55 transition-colors hover:bg-white/70 hover:text-berry disabled:opacity-50"
                >
                  {busy === item.id ? "…" : "Cancel"}
                </button>
              </span>
            ) : (
              <button
                onClick={() => onConnect(item)}
                disabled={busy !== null}
                className="btn-ink shrink-0 px-4 py-2 text-xs disabled:opacity-50"
              >
                {busy === item.id ? "Opening…" : "Connect"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
