import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";

/** Canonical durable keys carried across WebView memory reclamation. */
const DURABLE_KEYS = [
  "kdci-command-analytics",
  "kdci-command-history",
  "kdci-pinned-commands",
  "kdci-ecosystem-links-seed",
];

export function isNativeRuntime(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/** Hydrate durable keys from Capacitor Preferences into localStorage (cold boot). */
export async function hydrateNativeStorage(): Promise<void> {
  if (!isNativeRuntime()) return;
  try {
    for (const key of DURABLE_KEYS) {
      const item = await Preferences.get({ key });
      if (item.value) {
        window.localStorage.setItem(key, item.value);
      }
    }
  } catch {
    // Ignore on platforms where preferences is unavailable
  }
}

/** Mirror durable keys from localStorage into Capacitor Preferences (backgrounding). */
export async function flushNativeStorage(): Promise<void> {
  if (!isNativeRuntime()) return;
  try {
    for (const key of DURABLE_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value) {
        await Preferences.set({ key, value });
      }
    }
  } catch {
    // Ignore on platforms where preferences is unavailable
  }
}

export async function initNativeShell(): Promise<void> {
  if (!isNativeRuntime()) return;

  await hydrateNativeStorage();
  window.dispatchEvent(new Event("kdci-storage-hydrated"));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushNativeStorage();
    }
  });

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Ignore on platforms where StatusBar overlay is unsupported
  }
}

export async function triggerTactilePulse(
  intensity: "light" | "medium" | "heavy" = "light"
): Promise<void> {
  if (!isNativeRuntime()) return;
  try {
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[intensity] });
  } catch {
    // Ignore if haptics unavailable
  }
}
