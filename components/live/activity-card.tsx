"use client";

import { ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { formatCompact, formatNumber } from "@/lib/format";
import { DailyBars } from "@/components/charts/daily-bars";
import { Panel } from "@/components/ui/panel";
import { MetricTabs } from "@/components/ui/segmented";

type Metric = "distance" | "work";

export function ActivityCard() {
  const { data, connecting, range, refreshing } = useDashboard();
  const [metric, setMetric] = useState<Metric>("distance");
  const series = data?.series ?? [];
  const values = series.map((point) => point[metric]).filter((value): value is number => value !== null);
  const total = values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  const average = values.length ? (total ?? 0) / values.length : null;
  const unit = metric === "distance" ? "km" : "work units";

  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
            <Activity size={15} className="text-cyan" /> Wheel activity
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            Last {range === "7d" ? "7" : "30"} days · daily windows 12:00 → 12:00 UTC
          </p>
        </div>
        <MetricTabs
          id="live-activity"
          label="Activity metric"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "distance", label: "Distance" },
            { value: "work", label: "Work" },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <div className="text-xs text-ink-3">Total</div>
          <div className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink-1">
            {metric === "distance" ? formatNumber(total, 2) : formatCompact(total)}
            <span className="ml-1.5 text-xs font-medium tracking-normal text-ink-3">{total === null ? "" : unit}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-3">Per observed day</div>
          <div className="mt-1 text-lg font-medium leading-none text-ink-2">
            {metric === "distance" ? formatNumber(average, 2) : formatCompact(average)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-[230px] flex-1 flex-col transition-opacity" style={{ opacity: refreshing && !connecting ? 0.85 : 1 }}>
        {values.length ? (
          <DailyBars
            ariaLabel={`Daily ${metric === "distance" ? "distance in km" : "verified work units"}, last ${series.length} days`}
            data={series.map((point) => ({
              key: point.date,
              label: point.label,
              value: point[metric],
              note: point.label,
            }))}
            unit={unit}
            digits={metric === "distance" ? 2 : 0}
            height="100%"
          />
        ) : (
          <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-line text-center">
            <div>
              <p className="text-sm text-ink-2">{connecting && !data ? "Loading activity…" : "No measured activity yet"}</p>
              <p className="mt-1 text-xs text-ink-3">Days without observations stay empty — never filled in.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-3">
        <span>Days without observations are left blank.</span>
        <Link href="/analytics" className="group flex items-center gap-1 font-medium text-ink-2 transition-colors hover:text-cyan">
          Open analytics <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
        </Link>
      </div>
    </Panel>
  );
}
