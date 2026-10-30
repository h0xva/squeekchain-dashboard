"use client";

import clsx from "clsx";
import { Coins, ShieldAlert, Timer, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { PROTOCOL } from "@/lib/contracts";
import { useDashboard } from "@/lib/dashboard-context";
import { formatDuration, formatNumber, timeAgo } from "@/lib/format";
import type { DashboardSnapshot, Telemetry } from "@/lib/squeek-api";
import { useNow } from "@/lib/use-now";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Meter } from "@/components/ui/meter";
import { Panel } from "@/components/ui/panel";
import { StatusDot, type Tone } from "@/components/ui/status-dot";
import { WheelRing } from "./wheel-ring";

const TELEMETRY: Record<Telemetry, { tone: Tone; label: string; pulse?: boolean }> = {
  live: { tone: "good", label: "Live", pulse: true },
  idle: { tone: "idle", label: "Idle" },
  stale: { tone: "warn", label: "Stale" },
  fault: { tone: "crit", label: "Counter fault" },
  unknown: { tone: "idle", label: "Unknown" },
  unavailable: { tone: "crit", label: "No signal" },
};

function topSpeed(data: DashboardSnapshot | null): number | null {
  const record = data?.records.find((item) => item.label === "Top speed");
  const parsed = record ? Number.parseFloat(record.value.replace(/,/g, "")) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function LiveHero() {
  const { data, connecting, mode } = useDashboard();
  const now = useNow(1000);
  const loading = !data && connecting;
  const telemetry: Telemetry = data?.telemetry ?? "unavailable";
  const status = TELEMETRY[telemetry];
  const progress = data?.progress ?? null;
  const withheld = data?.deployment.status === "mismatch";
  const running = data?.running === true;
  const speedCap = topSpeed(data) ?? 8;
  const updated = data?.measuredAt ?? data?.updatedAt ?? null;

  const headline: Record<Telemetry, { title: ReactNode; body: string }> = {
    live: {
      title: (
        <>
          Squeektoshi is <span className="text-gradient-cyan">running</span>
        </>
      ),
      body: "Every magnet pass on the WHEELY9000 is one unit of work — measured, verified and settled on Ethereum.",
    },
    idle: {
      title: (
        <>
          Squeektoshi is <span className="text-ink-2">resting</span>
        </>
      ),
      body: "The wheel is idle. Progress toward the next Squeek block resumes with the next run.",
    },
    stale: {
      title: "Wheel telemetry is stale",
      body: `The last wheel reading arrived ${timeAgo(updated, now)}. Confirmed chain data stays visible.`,
    },
    fault: {
      title: "Wheel counter fault",
      body: "The wheel reports a counter fault, so live readings are paused until it recovers.",
    },
    unknown: {
      title: "Wheel status unknown",
      body: "Telemetry is online but reports a state this dashboard doesn’t recognise yet.",
    },
    unavailable: {
      title: "No signal from the wheel",
      body: "The telemetry feed can’t be reached right now. Retrying automatically.",
    },
  };

  return (
    <Panel spotlight={false} className="overflow-hidden" aria-labelledby="hero-title">
      <div className="spoke-field pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(43_212_240/0.10),transparent_65%)]" />
      <div className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14 lg:p-12">
        <div className="mx-auto w-full max-w-[400px] lg:max-w-none">
          <WheelRing
            progress={withheld ? null : progress}
            blockKey={withheld ? null : (data?.nextBlockHeight ?? null)}
            turning={running}
            speedKmh={data?.speedKmh ?? null}
            dim={!loading && telemetry !== "live" && telemetry !== "idle"}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-14 w-36" />
                <div className="skeleton h-3 w-24" />
              </div>
            ) : progress !== null && !withheld ? (
              <>
                <span className="eyebrow">Next block</span>
                <span className="mt-1 font-mono text-sm text-ink-2">#{formatNumber(data?.nextBlockHeight ?? null)}</span>
                <span className="mt-2 flex items-baseline text-[52px] font-semibold leading-none tracking-[-0.045em] text-ink-1 sm:text-[64px]">
                  <AnimatedNumber value={progress * 100} format={(v) => v.toFixed(1)} />
                  <span className="ml-1 text-2xl font-medium tracking-normal text-ink-3 sm:text-3xl">%</span>
                </span>
                <span className="mt-3 flex items-center gap-1.5 rounded-full border border-line bg-surface-2/80 px-2.5 py-1 text-xs text-ink-2">
                  <Timer size={12} className="text-cyan" />
                  {running && data?.remainingSeconds !== null && data?.remainingSeconds !== undefined
                    ? `≈ ${formatDuration(data.remainingSeconds)} to go`
                    : running
                      ? "Measuring pace…"
                      : telemetry === "idle"
                        ? "Paused while the wheel rests"
                        : "Waiting for wheel activity"}
                </span>
              </>
            ) : withheld ? (
              <>
                <ShieldAlert size={26} className="text-warn" />
                <span className="mt-3 text-base font-medium text-ink-1">Chain data withheld</span>
                <span className="mt-1.5 max-w-[190px] text-xs leading-5 text-ink-3">
                  The API reports a different deployment than the pinned contracts.
                </span>
              </>
            ) : (
              <>
                <WifiOff size={24} className="text-ink-3" />
                <span className="mt-3 text-base font-medium text-ink-1">
                  {data?.sourceStatus === "unavailable" || !data ? "No signal" : "Frontier unavailable"}
                </span>
                <span className="mt-1.5 max-w-[190px] text-xs leading-5 text-ink-3">
                  {data?.sourceStatus === "unavailable" || !data
                    ? "Retrying automatically."
                    : "Block progress will appear as soon as the builder reports it."}
                </span>
              </>
            )}
          </WheelRing>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
              <StatusDot tone={loading ? "idle" : mode === "preview" ? "gold" : status.tone} pulse={!loading && status.pulse} />
              WHEELY9000 · {loading ? "Connecting" : status.label}
            </span>
            {!loading && updated ? (
              <span className="font-mono text-[11px] text-ink-3" suppressHydrationWarning>
                updated {timeAgo(updated, now)}
              </span>
            ) : null}
          </div>
          <h1 id="hero-title" className="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink-1 sm:text-[42px]">
            {loading ? "Listening to the wheel…" : headline[telemetry].title}
          </h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-ink-2">
            {loading ? "Fetching live telemetry from the public Squeekchain API." : headline[telemetry].body}
          </p>

          <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-line [gap:1px]">
            <HeroStat label="Wheel speed" loading={loading}>
              <Value value={data?.speedKmh ?? null} digits={2} unit="km/h" />
              <Meter
                className="mt-3"
                value={data?.speedKmh === null || data?.speedKmh === undefined ? null : data.speedKmh / speedCap}
                label="Wheel speed relative to the top speed record"
              />
              <Caption>{topSpeed(data) ? `Record ${formatNumber(topSpeed(data), 2)} km/h` : "Live reading"}</Caption>
            </HeroStat>
            <HeroStat label="Distance today" loading={loading}>
              <Value value={data?.distanceTodayKm ?? null} digits={2} unit="km" />
              <Caption>Since 12:00 UTC</Caption>
            </HeroStat>
            <HeroStat label="Settled height" loading={loading}>
              <Value value={data?.blockHeight ?? null} prefix="#" />
              <Caption>{withheld ? "Withheld · deployment mismatch" : "On SqueekCore"}</Caption>
            </HeroStat>
            <HeroStat label="SQK minted · 24h" loading={loading}>
              <Value value={data?.issuedToday ?? null} unit="SQK" gold />
              <Caption>{withheld ? "Withheld · deployment mismatch" : "To Squeek holders"}</Caption>
            </HeroStat>
          </dl>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gold/15 bg-[linear-gradient(100deg,rgb(245_184_61/0.08),transparent_70%)] px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
              <Coins size={17} />
            </span>
            <p className="text-[13px] leading-5 text-ink-2">
              <span className="font-semibold text-ink-1">{formatNumber(PROTOCOL.blockRewardSepolia)} SQK</span> per Squeek block on
              Sepolia, shared by Squeek holders by active power.{" "}
              <span className="text-ink-3">{formatNumber(PROTOCOL.blockRewardMainnet)} planned on mainnet.</span>
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function HeroStat({ label, loading, children }: { label: string; loading: boolean; children: ReactNode }) {
  return (
    <div className="bg-surface-1/95 p-4 sm:p-5">
      <dt className="text-xs font-medium text-ink-3">{label}</dt>
      <dd className="mt-2">{loading ? <div className="skeleton h-8 w-24" /> : children}</dd>
    </div>
  );
}

function Value({
  value,
  digits = 0,
  unit,
  prefix,
  gold = false,
}: {
  value: number | null;
  digits?: number;
  unit?: string;
  prefix?: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={clsx("text-[26px] font-semibold leading-none tracking-[-0.03em] sm:text-[30px]", gold ? "text-gradient-gold" : "text-ink-1")}>
        {value !== null && prefix ? prefix : null}
        <AnimatedNumber value={value} format={(v) => formatNumber(v, digits)} />
      </span>
      {unit && value !== null ? <span className="text-xs font-medium text-ink-3">{unit}</span> : null}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[11.5px] leading-4 text-ink-3">{children}</p>;
}
