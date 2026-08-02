/** True when the page is running inside a Capacitor iOS shell. */
export function isNativeIOS(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    }
  ).Capacitor;
  if (!cap) return false;
  try {
    if (typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
      return (cap.getPlatform?.() ?? "ios") === "ios";
    }
  } catch {
    // ignore
  }
  return false;
}

/** True for iPhone / iPad Safari or the native shell (client-only). */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isNativeIOS()) return true;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
