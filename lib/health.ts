import type { Tone } from "@/components/ui/status-dot";
import type { DashboardSnapshot } from "./squeek-api";
import type { Mode } from "./dashboard-context";

export type HealthKey = "preview" | "connecting" | "live" | "partial" | "mismatch" | "offline";
export type Health = { key: HealthKey; label: string; tone: Tone; pulse: boolean };

/** One summary of where the numbers on screen come from, shared by the pill and the banner. */
export function healthOf(mode: Mode, connecting: boolean, live: DashboardSnapshot | null): Health {
  if (mode === "preview") return { key: "preview", label: "Preview", tone: "gold", pulse: false };
  if (connecting && !live) return { key: "connecting", label: "Connecting", tone: "idle", pulse: true };
  if (!live || live.sourceStatus === "unavailable") return { key: "offline", label: "Offline", tone: "crit", pulse: false };
  if (live.deployment.status === "mismatch") return { key: "mismatch", label: "Mismatch", tone: "warn", pulse: false };
  if (live.sourceStatus === "partial") return { key: "partial", label: "Partial", tone: "warn", pulse: false };
  return { key: "live", label: "Synced", tone: "good", pulse: true };
}
