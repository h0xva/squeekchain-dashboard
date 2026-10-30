"use client";

import { motion } from "motion/react";

/** A ratio against a limit: same-hue track, fill animates on change. */
export function Meter({
  value,
  tone = "cyan",
  label,
  className,
}: {
  /** 0..1, or null when unknown (renders an empty track). */
  value: number | null;
  tone?: "cyan" | "gold";
  label: string;
  className?: string;
}) {
  const color = tone === "gold" ? "var(--color-gold)" : "var(--color-cyan)";
  const track = tone === "gold" ? "rgb(245 184 61 / 0.12)" : "rgb(43 212 240 / 0.1)";
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value === null ? undefined : Math.round(pct * 1000) / 10}
      className={className}
    >
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: track }}>
        <motion.div
          className="h-full rounded-full"
          // A tiny share of a large cap stays visible as a nub rather than vanishing.
          style={{ background: color, boxShadow: `0 0 12px ${color}`, minWidth: value !== null && pct > 0 ? 3 : 0 }}
          initial={false}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      </div>
    </div>
  );
}
