/**
 * Apple Health / HealthKit bridge for the iOS shell.
 *
 * On device (Capacitor), this talks to the native TempoHealth plugin.
 * In the browser it persists an opt-in connection and serves as the
 * product surface until the native plugin is present.
 */

export type HealthKitStatus = "disconnected" | "connected" | "unavailable";

export interface HealthSnapshot {
  restingHr?: number;
  hrv?: number;
  sleepHours?: number;
  recovery?: number;
  steps?: number;
  activeCalories?: number;
  updatedAt: string;
}

const STORAGE_KEY = "tempo:applehealth";

interface StoredHealth {
  status: HealthKitStatus;
  snapshot?: HealthSnapshot;
}

type NativePlugin = {
  requestAuthorization: () => Promise<{ granted: boolean }>;
  getSnapshot: () => Promise<HealthSnapshot>;
  disconnect?: () => Promise<void>;
};

function readStore(): StoredHealth {
  if (typeof window === "undefined") return { status: "disconnected" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: "disconnected" };
    return JSON.parse(raw) as StoredHealth;
  } catch {
    return { status: "disconnected" };
  }
}

function writeStore(value: StoredHealth) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function getNativePlugin(): NativePlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (
    window as Window & {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        Plugins?: Record<string, NativePlugin>;
      };
    }
  ).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.TempoHealth ?? null;
}

export function getAppleHealthStatus(): HealthKitStatus {
  return readStore().status;
}

export function getCachedHealthSnapshot(): HealthSnapshot | null {
  return readStore().snapshot ?? null;
}

/** Request HealthKit access (native) or mark connected in the web shell. */
export async function connectAppleHealth(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const native = getNativePlugin();
  if (native) {
    try {
      const { granted } = await native.requestAuthorization();
      if (!granted) {
        writeStore({ status: "disconnected" });
        return { ok: false, error: "Apple Health permission was denied." };
      }
      const snapshot = await native.getSnapshot();
      writeStore({ status: "connected", snapshot });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Couldn't reach Apple Health.",
      };
    }
  }

  // Browser / simulator without the plugin: enable the product path locally.
  writeStore({
    status: "connected",
    snapshot: {
      updatedAt: new Date().toISOString(),
    },
  });
  return { ok: true };
}

export async function disconnectAppleHealth(): Promise<void> {
  const native = getNativePlugin();
  try {
    await native?.disconnect?.();
  } catch {
    // ignore
  }
  writeStore({ status: "disconnected" });
}

/** Pull the latest HealthKit snapshot when connected. */
export async function refreshAppleHealth(): Promise<HealthSnapshot | null> {
  const stored = readStore();
  if (stored.status !== "connected") return null;

  const native = getNativePlugin();
  if (!native) return stored.snapshot ?? null;

  try {
    const snapshot = await native.getSnapshot();
    writeStore({ status: "connected", snapshot });
    return snapshot;
  } catch {
    return stored.snapshot ?? null;
  }
}
