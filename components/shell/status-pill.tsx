"use client";

import clsx from "clsx";
import { CircleAlert, CircleCheck, FlaskConical, RefreshCw, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { healthOf } from "@/lib/health";
import { shortAddress, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { StatusDot } from "@/components/ui/status-dot";
import { Segmented } from "@/components/ui/segmented";

export function StatusPill() {
  const { mode, setMode, connecting, live, refreshing, refresh, lastFetchAt } = useDashboard();
  const health = healthOf(mode, connecting, live);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const now = useNow(1000);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const deployment = live?.deployment;
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          "flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
          health.key === "preview"
            ? "border-gold/25 bg-gold/[0.07] text-gold hover:bg-gold/[0.12]"
            : "border-line bg-surface-2/70 text-ink-2 hover:border-line-strong hover:text-ink-1",
        )}
      >
        <StatusDot tone={health.tone} pulse={health.pulse} />
        <span>{health.label}</span>
        <span className="sr-only">data status. Open details.</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Data sources"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-11 z-50 w-[340px] max-w-[calc(100vw-24px)] origin-top-right rounded-2xl border border-line-strong bg-surface-2/95 p-4 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.9)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Data source</div>
                <div className="mt-1 text-sm font-medium text-ink-1">
                  {mode === "preview" ? "Sample preview" : "Public Squeekchain API"}
                </div>
              </div>
              <Segmented
                id="mode"
                label="Data mode"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "live", label: "Live" },
                  { value: "preview", label: "Preview" },
                ]}
              />
            </div>

            {mode === "preview" ? (
              <p className="mt-3 flex gap-2 rounded-xl border border-gold/15 bg-gold/[0.05] p-3 text-xs leading-5 text-ink-2">
                <FlaskConical size={14} className="mt-0.5 shrink-0 text-gold" />
                Illustrative numbers that move on their own, so you can explore every state. Nothing here is on-chain.
              </p>
            ) : null}

            <div className="mt-4 rounded-xl border border-line bg-surface-1/80 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-ink-2">
                {deployment?.status === "verified" ? (
                  <ShieldCheck size={14} className="text-good" />
                ) : deployment?.status === "mismatch" ? (
                  <ShieldAlert size={14} className="text-warn" />
                ) : (
                  <ShieldQuestion size={14} className="text-ink-3" />
                )}
                Deployment check
                <span className="ml-auto font-normal text-ink-3">
                  {deployment?.status === "verified" ? "Verified" : deployment?.status === "mismatch" ? "Mismatch" : "Unknown"}
                </span>
              </div>
              {deployment?.status === "mismatch"
                ? deployment.mismatches.map((item) => (
                    <p key={`${item.name}-${item.received}`} className="mt-2 font-mono text-[11px] leading-5 text-ink-3">
                      {item.name}: pinned {shortAddress(item.expected)} · API {shortAddress(item.received)}
                    </p>
                  ))
                : null}
            </div>

            <ul className="mt-3 space-y-1">
              {(live?.sources ?? []).map((source) => (
                <li key={source.id} className="flex items-start gap-2 rounded-lg px-1 py-1 text-xs">
                  {source.ok ? (
                    <CircleCheck size={14} className="mt-px shrink-0 text-good" aria-label="available" />
                  ) : (
                    <CircleAlert size={14} className="mt-px shrink-0 text-warn" aria-label="unavailable" />
                  )}
                  <span className="text-ink-2">{source.label}</span>
                  <span className="ml-auto max-w-[55%] truncate text-right text-ink-3" title={source.detail ?? undefined}>
                    {source.ok ? "OK" : source.detail}
                  </span>
                </li>
              ))}
              {!live ? <li className="px-1 py-1 text-xs text-ink-3">Waiting for the first response…</li> : null}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-3">
              <span>Checked {lastFetchAt ? timeAgo(new Date(lastFetchAt).toISOString(), now) : "—"} · every 15s</span>
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink-1"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : undefined} />
                Refresh
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
