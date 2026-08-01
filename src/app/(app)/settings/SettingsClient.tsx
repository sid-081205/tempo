"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONNECTORS, type Connector } from "@/lib/connectors";
import type { ConnectionStatus } from "@/lib/composio";
import {
  connectAppleHealth,
  disconnectAppleHealth,
  getAppleHealthStatus,
} from "@/lib/healthkit";
import {
  connectAppleCalendar,
  disconnectAppleCalendar,
  getAppleCalendarStatus,
} from "@/lib/eventkit";

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
    blurb:
      "Proactive. Tempo proposes changes: buffers, moves, check-ins. You approve each one.",
  },
  {
    label: "Act",
    blurb:
      "Tempo reshapes your schedule within rules you set, and tells you what it did.",
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

type LocalStatus = ConnectionStatus | "unavailable";

export function SettingsClient({
  name,
  email,
  authEnabled,
}: {
  name: string;
  email: string;
  authEnabled: boolean;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  const [connectorsEnabled, setConnectorsEnabled] = useState<boolean | null>(
    null,
  );
  const [statuses, setStatuses] = useState<Record<string, LocalStatus>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [fallbackLink, setFallbackLink] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const pollUntil = useRef(0);

  const refreshNative = useCallback(() => {
    setStatuses((s) => ({
      ...s,
      applehealth: getAppleHealthStatus(),
      applecalendar: getAppleCalendarStatus(),
    }));
  }, []);

  const refreshConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      const data = (await res.json()) as {
        enabled: boolean;
        statuses: Record<string, ConnectionStatus>;
      };
      setConnectorsEnabled(data.enabled);
      setStatuses((s) => ({
        ...s,
        ...data.statuses,
        applehealth: getAppleHealthStatus(),
        applecalendar: getAppleCalendarStatus(),
      }));
    } catch {
      setConnectorsEnabled(false);
      refreshNative();
    }
  }, [refreshNative]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tempo:prefs");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // Corrupt prefs: fall back to defaults.
    }
    setLoaded(true);
    refreshNative();
    void refreshConnections();
  }, [refreshConnections, refreshNative]);

  useEffect(() => {
    if (loaded) localStorage.setItem("tempo:prefs", JSON.stringify(prefs));
  }, [prefs, loaded]);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pollUntil.current) void refreshConnections();
    }, 4000);
    return () => clearInterval(id);
  }, [refreshConnections]);

  async function connectNative(connector: Connector) {
    setBusy(connector.id);
    setConnectError(null);
    try {
      if (connector.provider === "healthkit") {
        const res = await connectAppleHealth();
        if (!res.ok) setConnectError(res.error ?? "Couldn't connect Apple Health.");
      } else if (connector.provider === "eventkit") {
        const res = await connectAppleCalendar();
        if (!res.ok)
          setConnectError(res.error ?? "Couldn't connect Apple Calendar.");
      }
      refreshNative();
    } finally {
      setBusy(null);
    }
  }

  async function disconnectNative(connector: Connector) {
    setBusy(connector.id);
    setConnectError(null);
    try {
      if (connector.provider === "healthkit") await disconnectAppleHealth();
      else if (connector.provider === "eventkit") await disconnectAppleCalendar();
      refreshNative();
    } finally {
      setBusy(null);
    }
  }

  async function connect(connector: Connector) {
    if (busy) return;
    if (
      connector.provider === "healthkit" ||
      connector.provider === "eventkit"
    ) {
      await connectNative(connector);
      return;
    }
    if (connector.provider !== "composio" || !connector.toolkit) return;

    setBusy(connector.id);
    setConnectError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id }),
      });
      const data = (await res.json()) as {
        redirectUrl?: string;
        error?: string;
      };
      if (data.redirectUrl) {
        const win = window.open(data.redirectUrl, "_blank", "noopener");
        if (!win) {
          setFallbackLink({ name: connector.name, url: data.redirectUrl });
        } else {
          setFallbackLink(null);
        }
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
    if (busy) return;
    if (
      connector.provider === "healthkit" ||
      connector.provider === "eventkit"
    ) {
      await disconnectNative(connector);
      return;
    }
    if (connector.provider !== "composio" || !connector.toolkit) return;

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
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <p className="eyebrow mb-2 text-accent-deep">Settings</p>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Your rules.
        </h1>
      </div>

      <Section title="Account">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-base font-semibold text-paper">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-ink/50">{email || "Signed in locally"}</p>
            </div>
          </div>
          {authEnabled ? (
            <button
              onClick={signOut}
              className="rounded-full border border-white/60 bg-white/40 px-4 py-2 text-xs font-semibold text-ink/70"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </Section>

      <Section title="Agent autonomy">
        <p className="mb-5 text-[13px] leading-relaxed text-ink/60">
          The dial between reactive and proactive. Tempo never does more than
          the level you&apos;ve granted.
        </p>
        <div className="mb-4 flex rounded-full bg-white/35 p-1 text-xs font-semibold">
          {AUTONOMY_LEVELS.map((l, i) => (
            <button
              key={l.label}
              onClick={() => setPrefs((p) => ({ ...p, autonomy: i }))}
              className={`flex-1 rounded-full px-2 py-2.5 ${
                prefs.autonomy === i
                  ? "bg-white text-accent shadow-sm"
                  : "text-ink/50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-ink/70">{level.blurb}</p>
      </Section>

      <Section title="What you're optimizing for">
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
                className={`rounded-full border px-4 py-2 text-[13px] font-medium ${
                  on
                    ? "border-transparent bg-ink text-paper"
                    : "border-white/60 bg-white/40 text-ink/60"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="On this iPhone"
        sub="Apple Health and Calendar — native, no OAuth tabs."
      >
        <ConnectorList
          items={CONNECTORS.filter((c) => c.iosNative)}
          enabled={true}
          statuses={statuses}
          busy={busy}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={refreshNative}
        />
      </Section>

      <Section
        title="Accounts"
        sub="Google, email, and work tools via Composio."
      >
        <ConnectorList
          items={contextConnectors.filter((c) => !c.iosNative)}
          enabled={connectorsEnabled}
          statuses={statuses}
          busy={busy}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={() => void refreshConnections()}
        />
      </Section>

      <Section
        title="Wearables & health"
        sub="Body state from Apple Health and other wearables."
      >
        <ConnectorList
          items={healthConnectors.filter((c) => !c.iosNative)}
          enabled={connectorsEnabled}
          statuses={statuses}
          busy={busy}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={() => void refreshConnections()}
        />
      </Section>

      {fallbackLink && (
        <div className="glass-strong mb-6 rounded-3xl p-5 text-sm">
          <p className="mb-2 text-ink/70">
            Your browser blocked the sign-in window for {fallbackLink.name}.
          </p>
          <a
            href={fallbackLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ink inline-block px-4 py-2 text-xs"
            onClick={() => setFallbackLink(null)}
          >
            Open the connect page →
          </a>
        </div>
      )}

      {connectError && (
        <p className="mb-6 px-2 text-sm text-berry">{connectError}</p>
      )}
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-strong mb-4 rounded-[28px] p-5">
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      {sub && <p className="mb-4 text-xs text-ink/50">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </section>
  );
}

function statusFor(item: Connector, statuses: Record<string, LocalStatus>) {
  if (item.provider === "healthkit") return statuses.applehealth;
  if (item.provider === "eventkit") return statuses.applecalendar;
  if (item.toolkit) return statuses[item.toolkit];
  return undefined;
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
  statuses: Record<string, LocalStatus>;
  busy: string | null;
  onConnect: (c: Connector) => void;
  onDisconnect: (c: Connector) => void;
  onRefresh: () => void;
}) {
  return (
    <ul className="divide-y divide-ink/5">
      {items.map((item) => {
        const status = statusFor(item, statuses);
        const isNative =
          item.provider === "healthkit" || item.provider === "eventkit";
        const canConnect =
          item.provider === "composio" ||
          item.provider === "healthkit" ||
          item.provider === "eventkit";

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

            {!canConnect || item.provider === "soon" ? (
              <span className="shrink-0 rounded-full bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/40">
                Soon
              </span>
            ) : !isNative && enabled === false ? (
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
                  className="rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/55 disabled:opacity-50"
                >
                  {busy === item.id ? "…" : "Disconnect"}
                </button>
              </span>
            ) : status === "pending" ? (
              <span className="flex shrink-0 items-center gap-2">
                <button
                  onClick={onRefresh}
                  className="rounded-full border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-semibold text-accent-deep"
                >
                  Finishing…
                </button>
                <button
                  onClick={() => onDisconnect(item)}
                  disabled={busy !== null}
                  className="rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-[11px] font-semibold text-ink/55 disabled:opacity-50"
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
