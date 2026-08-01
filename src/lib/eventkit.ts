/**
 * Apple Calendar (EventKit) bridge for the iOS shell.
 * Mirrors the HealthKit pattern: native plugin when present, local opt-in otherwise.
 */

export type EventKitStatus = "disconnected" | "connected";

const STORAGE_KEY = "tempo:applecalendar";

type NativePlugin = {
  requestAuthorization: () => Promise<{ granted: boolean }>;
  disconnect?: () => Promise<void>;
};

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
  return cap.Plugins?.TempoCalendar ?? null;
}

export function getAppleCalendarStatus(): EventKitStatus {
  if (typeof window === "undefined") return "disconnected";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "disconnected";
    const parsed = JSON.parse(raw) as { status?: EventKitStatus };
    return parsed.status === "connected" ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
}

export async function connectAppleCalendar(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const native = getNativePlugin();
  if (native) {
    try {
      const { granted } = await native.requestAuthorization();
      if (!granted) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ status: "disconnected" }),
        );
        return { ok: false, error: "Calendar permission was denied." };
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: "connected" }),
      );
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Couldn't reach Apple Calendar.",
      };
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "connected" }));
  return { ok: true };
}

export async function disconnectAppleCalendar(): Promise<void> {
  const native = getNativePlugin();
  try {
    await native?.disconnect?.();
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "disconnected" }));
}
