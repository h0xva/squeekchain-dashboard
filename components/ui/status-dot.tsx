import clsx from "clsx";

export type Tone = "good" | "warn" | "crit" | "gold" | "cyan" | "idle";

export const TONE_COLOR: Record<Tone, string> = {
  good: "var(--color-good)",
  warn: "var(--color-warn)",
  crit: "var(--color-crit)",
  gold: "var(--color-gold)",
  cyan: "var(--color-cyan)",
  idle: "var(--color-ink-3)",
};

export function StatusDot({ tone, pulse = false, className }: { tone: Tone; pulse?: boolean; className?: string }) {
  const color = TONE_COLOR[tone];
  return (
    <span className={clsx("relative inline-flex size-2 shrink-0", className)} aria-hidden="true">
      {pulse ? <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: color }} /> : null}
      <span
        className="relative size-2 rounded-full"
        style={{ background: color, boxShadow: tone === "idle" ? undefined : `0 0 10px ${color}` }}
      />
    </span>
  );
}
