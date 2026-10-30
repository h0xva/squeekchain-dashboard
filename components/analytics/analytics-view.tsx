"use client";

import clsx from "clsx";
import { Activity, Blocks, CalendarCheck, ChartColumn, Clock3, Flame, Gauge, Route, Table2, Timer, Trophy } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { formatCompact, formatNumber, utcHourLabel } from "@/lib/format";
import type { SeriesPoint } from "@/lib/squeek-api";
import { DailyBars } from "@/components/charts/daily-bars";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { MetricTabs, Segmented } from "@/components/ui/segmented";

type Metric = "distance" | "work" | "blocks";
const METRICS: Record<Metric, { label: string; unit: string; digits: number; title: string }> = {
  distance: { label: "Distance", unit: "km", digits: 2, title: "Distance per day" },
  work: { label: "Work", unit: "work units", digits: 0, title: "Verified work per day" },
  blocks: { label: "Blocks", unit: "blocks", digits: 0, title: "Squeek blocks settled per day" },
};

const sum = (series: SeriesPoint[], key: Metric) => {
  const values = series.map((point) => point[key]).filter((value): value is number => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
};

export function AnalyticsView() {
  const { data, connecting, range, setRange, refreshing } = useDashboard();
  const [metric, setMetric] = useState<Metric>("distance");
  const [view, setView] = useState<"chart" | "table">("chart");
  const series = useMemo(() => data?.series ?? [], [data?.series]);
  const loading = !data && connecting;
  const observedDays = series.filter((point) => point.distance !== null || point.work !== null).length;
  const totals = { distance: sum(series, "distance"), work: sum(series, "work"), blocks: sum(series, "blocks") };
  const values = series.map((point) => point[metric]).filter((value): value is number => value !== null);
  const peak = values.length ? Math.max(...values) : null;
  const peakDay = peak === null ? null : series.find((point) => point[metric] === peak);
  const info = METRICS[metric];

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title={
          <>
            Every revolution <span className="text-gradient-cyan">adds up.</span>
          </>
        }
        subtitle="Measured wheel activity, settled blocks and records — straight from the public Squeekchain API."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented
          id="range"
          label="Date range"
          value={range}
          onChange={setRange}
          options={[
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
          ]}
        />
        <span className="flex items-center gap-1.5 text-xs text-ink-3">
          <Clock3 size={13} /> Daily windows run 12:00 → 12:00 UTC
        </span>
      </div>

      <div className={clsx("space-y-4 transition-opacity sm:space-y-5", refreshing && !connecting && "opacity-90")}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SummaryTile icon={<Route size={15} />} label="Distance" loading={loading} value={formatNumber(totals.distance, 2)} unit="km" />
          <SummaryTile icon={<Activity size={15} />} label="Verified work" loading={loading} value={formatCompact(totals.work)} unit="units" />
          <SummaryTile icon={<Blocks size={15} />} label="Blocks settled" loading={loading} value={formatNumber(totals.blocks)} unit="blocks" />
          <SummaryTile
            icon={<CalendarCheck size={15} />}
            label="Coverage"
            loading={loading}
            value={series.length ? `${observedDays}/${series.length}` : "—"}
            unit="days observed"
          />
        </div>

        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-medium text-ink-1">{info.title}</h2>
              <p className="mt-1 text-[13px] text-ink-3">
                {peakDay ? (
                  <>
                    Peak {formatNumber(peak, info.digits)} {info.unit} on {peakDay.label}
                  </>
                ) : (
                  "No measured values in this window yet"
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <MetricTabs
                id="analytics-metric"
                label="Metric"
                value={metric}
                onChange={setMetric}
                options={(Object.keys(METRICS) as Metric[]).map((key) => ({ value: key, label: METRICS[key].label }))}
              />
              <div className="flex rounded-lg border border-line bg-surface-2 p-0.5" role="radiogroup" aria-label="View as">
                {(
                  [
                    ["chart", ChartColumn, "Chart"],
                    ["table", Table2, "Table"],
                  ] as const
                ).map(([key, Icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={view === key}
                    aria-label={`View as ${label.toLowerCase()}`}
                    title={label}
                    onClick={() => setView(key)}
                    className={clsx(
                      "grid size-7 place-items-center rounded-md transition-colors",
                      view === key ? "bg-surface-3 text-ink-1" : "text-ink-3 hover:text-ink-2",
                    )}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="skeleton h-[300px] w-full" />
            ) : view === "table" ? (
              <SeriesTable series={series} />
            ) : values.length ? (
              <DailyBars
                ariaLabel={`${info.title}, ${series.length} days. Switch to table view for every value.`}
                data={series.map((point) => ({ key: point.date, label: point.label, value: point[metric], note: point.label }))}
                unit={info.unit}
                digits={info.digits}
                height={300}
              />
            ) : (
              <EmptyChart
                text={metric === "blocks" && data?.deployment.status === "mismatch" ? "Blocks withheld — deployment mismatch" : "No measurements in this window"}
              />
            )}
          </div>
          <p className="mt-4 border-t border-line pt-4 text-xs text-ink-3">
            Blank days had no observations — they are never filled in. Block counts appear only for complete days.
          </p>
        </Panel>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <RhythmCard />
          <DifficultyCard />
        </div>

        <RecordsCard />
      </div>
    </div>
  );
}

function SummaryTile({ icon, label, value, unit, loading }: { icon: ReactNode; label: string; value: string; unit: string; loading: boolean }) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
        <span className="text-cyan">{icon}</span>
        {label}
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24" />
      ) : (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink-1">{value}</span>
          {value !== "—" ? <span className="text-[11px] font-medium text-ink-3">{unit}</span> : null}
        </div>
      )}
    </Panel>
  );
}

function SeriesTable({ series }: { series: SeriesPoint[] }) {
  if (!series.length) return <EmptyChart text="No rows to show" />;
  return (
    <div className="max-h-[340px] overflow-auto rounded-xl border border-line">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead className="sticky top-0 bg-surface-2 text-xs text-ink-3">
          <tr>
            <th className="px-4 py-2.5 font-medium">Day (from 12:00 UTC)</th>
            <th className="px-4 py-2.5 text-right font-medium">Distance (km)</th>
            <th className="px-4 py-2.5 text-right font-medium">Work (units)</th>
            <th className="px-4 py-2.5 text-right font-medium">Blocks</th>
          </tr>
        </thead>
        <tbody className="tabular divide-y divide-line">
          {[...series].reverse().map((point) => (
            <tr key={point.date} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-4 py-2.5 text-ink-2">{point.label}</td>
              <td className="px-4 py-2.5 text-right text-ink-1">{formatNumber(point.distance, 2)}</td>
              <td className="px-4 py-2.5 text-right text-ink-1">{formatNumber(point.work)}</td>
              <td className="px-4 py-2.5 text-right text-ink-1">{formatNumber(point.blocks)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-2xl border border-dashed border-line text-center">
      <div>
        <p className="text-sm text-ink-2">{text}</p>
        <p className="mt-1 text-xs text-ink-3">Values appear as soon as the API reports them.</p>
      </div>
    </div>
  );
}

function RhythmCard() {
  const { data, connecting } = useDashboard();
  const typical = data?.typicalDay ?? [];
  const [clock, setClock] = useState<{ minute: number; offset: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({ minute: now.getUTCHours() * 60 + now.getUTCMinutes(), offset: -now.getTimezoneOffset() });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const buckets = typical.map((bucket) => {
    const [h, m] = bucket.hour.split(":").map(Number);
    return { minute: h * 60 + m, label: bucket.hour, value: bucket.work };
  });
  const step = buckets.length > 1 ? buckets[1].minute - buckets[0].minute : 60;
  const current = clock ? buckets.find((bucket) => clock.minute >= bucket.minute && clock.minute < bucket.minute + step) : undefined;
  const known = buckets.filter((bucket) => bucket.value !== null);
  const busiest = known.length ? known.reduce((best, bucket) => ((bucket.value ?? 0) > (best.value ?? 0) ? bucket : best)) : null;
  // Local time is only worth showing when it differs from UTC.
  const local = (minute: number) =>
    clock && clock.offset !== 0 ? utcHourLabel((((minute + clock.offset) % 1440) + 1440) % 1440) : null;

  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
            <Clock3 size={15} className="text-cyan" /> A typical day on the wheel
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            Mean work per {step === 30 ? "half hour" : "hour"} · UTC
            {busiest ? (
              <>
                {" "}
                · busiest around <span className="text-ink-2">{busiest.label} UTC</span>
                {local(busiest.minute) ? ` (${local(busiest.minute)} your time)` : ""}
              </>
            ) : null}
          </p>
        </div>
        {current ? (
          <span className="flex items-center gap-1.5 rounded-full border border-cyan/25 bg-cyan/[0.06] px-2.5 py-1 text-[11px] font-medium text-cyan">
            <span className="size-1.5 rounded-full bg-cyan" /> Now · {current.label} UTC
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex min-h-[220px] flex-1 flex-col">
        {!data && connecting ? (
          <div className="skeleton h-[220px] w-full" />
        ) : known.length ? (
          <DailyBars
            ariaLabel="Typical activity across the day in UTC; the current time slot is highlighted."
            data={buckets.map((bucket) => ({
              key: bucket.label,
              label: bucket.label,
              value: bucket.value,
              note: `${bucket.label}–${utcHourLabel((bucket.minute + step) % 1440)} UTC${local(bucket.minute) ? ` · ${local(bucket.minute)} local` : ""}`,
            }))}
            unit="work units"
            digits={1}
            height="100%"
            highlightKey={current?.label}
          />
        ) : (
          <EmptyChart text="Typical-day profile unavailable" />
        )}
      </div>
    </Panel>
  );
}

function DifficultyCard() {
  const { data, connecting } = useDashboard();
  const loading = !data && connecting;
  const difficulty = data?.difficulty ?? null;
  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
        <Gauge size={15} className="text-cyan" /> Network difficulty
      </h2>
      <p className="mt-1 text-[13px] text-ink-3">Latest settled value on SqueekCore</p>
      {loading ? (
        <div className="skeleton mt-6 h-12 w-32" />
      ) : (
        <div className="mt-6 text-[44px] font-semibold leading-none tracking-[-0.04em] text-ink-1">{formatCompact(difficulty)}</div>
      )}
      <div className="mt-2 text-xs text-ink-3">work units per 1,000 blocks</div>
      <dl className="mt-6 flex-1 divide-y divide-line border-t border-line text-[13px]">
        {[
          ["Work per block", difficulty === null ? "—" : `≈ ${formatNumber(difficulty / 1000, 1)} units`],
          ["Lifetime settled work", formatCompact(data?.settledWork ?? null)],
          ["Settled height", data?.blockHeight === null || data?.blockHeight === undefined ? "—" : `#${formatNumber(data.blockHeight)}`],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-3">
            <dt className="text-ink-3">{label}</dt>
            <dd className="font-medium text-ink-1 tabular">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-5 text-ink-3">The API exposes the current difficulty only, so no historical curve is drawn.</p>
    </Panel>
  );
}

const RECORD_ICONS: Record<string, ReactNode> = {
  "Longest day": <Route size={16} />,
  "Top speed": <Gauge size={16} />,
  "Longest run": <Timer size={16} />,
  "Active streak": <Flame size={16} />,
};

function RecordsCard() {
  const { data, connecting } = useDashboard();
  const records = data?.records ?? [];
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
            <Trophy size={15} className="text-gold" /> Hall of fame
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">Squeektoshi’s all-time records, from measured activity</p>
        </div>
      </div>
      {!data && connecting ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-24" />
          ))}
        </div>
      ) : records.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {records.map((record) => (
            <div
              key={record.label}
              className="group rounded-2xl border border-line bg-[linear-gradient(160deg,rgb(245_184_61/0.06),transparent_55%)] p-4 transition-colors hover:border-gold/25"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-gold/10 text-gold transition-transform group-hover:-rotate-6">
                {RECORD_ICONS[record.label] ?? <Trophy size={16} />}
              </span>
              <div className="mt-4 text-xs text-ink-3">{record.label}</div>
              <div className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink-1">{record.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-3">No verified records available yet.</p>
      )}
    </Panel>
  );
}
