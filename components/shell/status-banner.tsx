"use client";

import clsx from "clsx";
import { ChevronDown, FlaskConical, RefreshCw, ShieldAlert, TriangleAlert, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { shortAddress } from "@/lib/format";
import { healthOf } from "@/lib/health";

/** Explains, in one line, why some numbers are missing or illustrative. */
export function StatusBanner() {
  const { mode, setMode, connecting, live, refresh, refreshing } = useDashboard();
  const health = healthOf(mode, connecting, live);
  const [open, setOpen] = useState(false);
  if (health.key === "live" || health.key === "connecting") return null;

  const failing = live?.sources.filter((source) => !source.ok) ?? [];
  const content = {
    preview: {
      icon: FlaskConical,
      tone: "gold",
      text: "Preview mode — illustrative sample data, nothing here is on-chain.",
      action: { label: "Back to live", run: () => setMode("live") },
    },
    mismatch: {
      icon: ShieldAlert,
      tone: "warn",
      text: "The API reports a different deployment than the pinned contracts. Chain data is withheld; wheel telemetry stays live.",
      action: { label: "Retry", run: refresh },
    },
    partial: {
      icon: TriangleAlert,
      tone: "warn",
      text: `${failing.length} of ${live?.sources.length ?? 7} data sources are unavailable. Missing values show as —.`,
      action: { label: "Retry", run: refresh },
    },
    offline: {
      icon: WifiOff,
      tone: "crit",
      text: "The Squeekchain API can’t be reached right now. Retrying automatically.",
      action: { label: "Explore a preview", run: () => setMode("preview") },
    },
  }[health.key];
  const Icon = content.icon;
  const showDetails = health.key !== "preview" && (failing.length > 0 || live?.deployment.status === "mismatch");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "mb-6 rounded-2xl border px-4 py-3 text-[13px]",
        content.tone === "gold" && "border-gold/20 bg-gold/[0.05]",
        content.tone === "warn" && "border-warn/20 bg-warn/[0.05]",
        content.tone === "crit" && "border-crit/25 bg-crit/[0.06]",
      )}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Icon
          size={16}
          className={clsx(
            "shrink-0",
            content.tone === "gold" && "text-gold",
            content.tone === "warn" && "text-warn",
            content.tone === "crit" && "text-crit",
          )}
        />
        <p className="min-w-0 flex-1 leading-5 text-ink-2">{content.text}</p>
        <div className="flex items-center gap-1">
          {showDetails ? (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-3 transition-colors hover:bg-white/5 hover:text-ink-1"
            >
              Details
              <ChevronDown size={13} className={clsx("transition-transform", open && "rotate-180")} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={content.action.run}
            className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-1 transition-colors hover:bg-surface-3"
          >
            {content.action.label === "Retry" ? <RefreshCw size={12} className={refreshing ? "animate-spin" : undefined} /> : null}
            {content.action.label}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && showDetails ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-3 grid gap-1.5 border-t border-line pt-3 font-mono text-[11px] text-ink-3 sm:grid-cols-2">
              {live?.deployment.mismatches.map((item) => (
                <li key={`${item.name}-${item.received}`} className="sm:col-span-2">
                  {item.name}: pinned {shortAddress(item.expected)} → API reports {item.received}
                </li>
              ))}
              {failing.map((source) => (
                <li key={source.id}>
                  <span className="text-ink-2">{source.label}</span> · {source.detail}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
