import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";

export function isNativeRuntime(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export async function initNativeShell(): Promise<void> {
  if (!isNativeRuntime()) return;
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
