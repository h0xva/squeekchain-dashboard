"use client";

import clsx from "clsx";
import { ArrowUpRight, Blocks } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { txUrl } from "@/lib/contracts";
import { useDashboard } from "@/lib/dashboard-context";
import { formatNumber, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";

export function SettlementFeed() {
  const { data, connecting, mode } = useDashboard();
  const now = useNow(5000);
  const events = (data?.events ?? []).slice(0, 6);
  const withheld = data?.deployment.status === "mismatch";

  // Highlight rows that arrive after the first render; the first list never flashes.
  const signature = events.map((event) => event.id).join("|");
  const [tracked, setTracked] = useState<{ signature: string; seen: Set<string>; fresh: Set<string> } | null>(null);
  if (tracked === null && events.length) {
    setTracked({ signature, seen: new Set(events.map((event) => event.id)), fresh: new Set() });
  } else if (tracked !== null && tracked.signature !== signature) {
    const fresh = new Set(events.filter((event) => !tracked.seen.has(event.id)).map((event) => event.id));
    setTracked({ signature, seen: new Set([...tracked.seen, ...events.map((event) => event.id)]), fresh });
  }
  const fresh = tracked?.fresh ?? new Set<string>();

  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
            <Blocks size={15} className="text-cyan" /> Latest settlements
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">Wheel work, written to Ethereum</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
          <StatusDot
            tone={withheld ? "warn" : !events.length ? "idle" : mode === "preview" ? "gold" : "good"}
            pulse={!withheld && events.length > 0}
            className="scale-75"
          />
          Feed
        </span>
      </div>

      <ul className="mt-4 flex-1 divide-y divide-line">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.li
              key={event.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              className={clsx("-mx-2 flex items-center gap-3 rounded-xl px-2 py-3", fresh.has(event.id) && "animate-flash")}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-cyan">
                <Blocks size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-ink-1">
                  Block <span className="font-mono">#{formatNumber(event.block)}</span>
                </div>
                <div className="mt-0.5 text-xs text-ink-3" suppressHydrationWarning>
                  {event.work === null ? "—" : `${formatNumber(event.work)} work units`} · {timeAgo(event.timestamp, now)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-gold">
                  {event.reward === null ? <span className="text-ink-3">—</span> : `+${formatNumber(event.reward)}`}
                  <span className="ml-1 text-[11px] font-medium text-ink-3">SQK</span>
                </div>
                {event.txHash ? (
                  <a
                    href={txUrl(event.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-ink-3 transition-colors hover:text-cyan"
                    aria-label={`View settlement of block ${event.block ?? ""} on Etherscan`}
                  >
                    Etherscan <ArrowUpRight size={11} />
                  </a>
                ) : (
                  <span className="mt-0.5 block text-[11px] text-ink-3">{mode === "preview" ? "sample" : "pending link"}</span>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {!events.length ? (
        <div className="grid flex-1 place-items-center py-10 text-center">
          <div>
            <p className="text-sm text-ink-2">
              {connecting && !data ? "Loading settlements…" : withheld ? "Settlements withheld" : "No settlements to show"}
            </p>
            <p className="mx-auto mt-1 max-w-[240px] text-xs leading-5 text-ink-3">
              {withheld
                ? "The API reports a different deployment, so its transactions aren’t linked here."
                : "New settlements appear here as soon as they are confirmed."}
            </p>
          </div>
        </div>
      ) : null}

      <p className="mt-3 border-t border-line pt-4 text-xs text-ink-3">
        {mode === "preview" ? "Sample settlements · no real transactions." : "SQK shown only when the issuance is confirmed on-chain."}
      </p>
    </Panel>
  );
}
