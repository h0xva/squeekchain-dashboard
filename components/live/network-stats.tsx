"use client";

import { Blocks, Coins, Gauge, Layers } from "lucide-react";
import type { ReactNode } from "react";
import { PROTOCOL } from "@/lib/contracts";
import { useDashboard } from "@/lib/dashboard-context";
import { formatCompact } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Meter } from "@/components/ui/meter";
import { Panel } from "@/components/ui/panel";

export function NetworkStats() {
  const { data, connecting } = useDashboard();
  const loading = !data && connecting;
  const supply = data?.totalSupply ?? null;
  const staked = data?.totalStaked ?? null;
  const supplyShare = supply === null ? null : supply / PROTOCOL.maxSupply;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Tile icon={<Coins size={15} />} label="Circulating SQK" loading={loading} value={supply} gold>
        <Meter className="mt-4" value={supplyShare} tone="gold" label="Circulating supply as a share of the 2.1B cap" />
        <p className="mt-2 text-[11.5px] text-ink-3">
          {supplyShare === null ? "of the 2.1B cap" : `${(supplyShare * 100).toFixed(supplyShare < 0.01 ? 3 : 2)}% of the 2.1B cap`}
        </p>
      </Tile>
      <Tile icon={<Layers size={15} />} label="SQK staked" loading={loading} value={staked}>
        <p className="mt-4 text-[11.5px] text-ink-3">
          {staked !== null && supply ? `${((staked / supply) * 100).toFixed(1)}% of circulating supply` : "Boosts active power"}
        </p>
      </Tile>
      <Tile icon={<Gauge size={15} />} label="Difficulty" loading={loading} value={data?.difficulty ?? null} unit="work / 1k blocks">
        <p className="mt-4 text-[11.5px] text-ink-3">Latest settled value</p>
      </Tile>
      <Tile icon={<Blocks size={15} />} label="Lifetime work" loading={loading} value={data?.settledWork ?? null} unit="units">
        <p className="mt-4 text-[11.5px] text-ink-3">Settled on SqueekCore</p>
      </Tile>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  unit,
  gold = false,
  loading,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: number | null;
  unit?: string;
  gold?: boolean;
  loading: boolean;
  children?: ReactNode;
}) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
        <span className={gold ? "text-gold" : "text-cyan"}>{icon}</span>
        {label}
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24" />
      ) : (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
          <span className={`text-[26px] font-semibold leading-none tracking-[-0.03em] ${gold ? "text-gradient-gold" : "text-ink-1"}`}>
            <AnimatedNumber value={value} format={formatCompact} />
          </span>
          {unit && value !== null ? <span className="text-[11px] font-medium text-ink-3">{unit}</span> : null}
        </div>
      )}
      {children}
    </Panel>
  );
}
