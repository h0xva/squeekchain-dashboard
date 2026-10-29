"use client";

import { useId, useMemo, useState } from "react";
import { Activity, BarChart3, Blocks, Clock3, Gauge, Route, Trophy, Waves } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardSnapshot } from "../lib/squeek-api";

type Metric = "distance" | "work" | "blocks";
type Props = {
  data: DashboardSnapshot;
  range: "7d" | "30d";
  onRangeChange: (range: "7d" | "30d") => void;
  isDemo: boolean;
};

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const metricInfo: Record<Metric, { title: string; unit: string; color: string }> = {
  distance: { title: "Distance", unit: "km", color: "#568dff" },
  work: { title: "Verified work", unit: "work units", color: "#eabf6b" },
  blocks: { title: "Blocks settled", unit: "blocks", color: "#73d6b1" },
};

function format(value: number | null | undefined, unit = "") {
  return value == null || !Number.isFinite(value) ? "—" : `${number.format(value)}${unit ? ` ${unit}` : ""}`;
}

function EmptyChart({ label }: { label: string }) {
  return <div className="analytics-empty"><Waves size={28} strokeWidth={1.4} /><strong>{label}</strong><span>Measured data will appear here when the API is available.</span></div>;
}

export function AnalyticsView({ data, range, onRangeChange, isDemo }: Props) {
  const [metric, setMetric] = useState<Metric>("distance");
  const gradientId = `analytics-${useId().replace(/:/g, "")}`;
  const info = metricInfo[metric];
  const totals = useMemo(() => {
    const sum = (key: Metric) => {
      const values = data.series.map((point) => point[key]).filter((value): value is number => value != null && Number.isFinite(value));
      return values.length ? values.reduce((total, value) => total + value, 0) : null;
    };
    return { distance: sum("distance"), work: sum("work"), blocks: sum("blocks") };
  }, [data.series]);
  const chartAvailable = data.series.some((point) => point[metric] != null);
  const hourlyAvailable = data.typicalDay.some((point) => point.work != null);
  const chartRecords = data.records.slice(0, 4);

  return <div className="analytics-view">
    <div className="analytics-summary">
      <div className="panel analytics-stat"><span><Route size={16} /> Distance covered</span><div>{format(totals.distance)} <small>km</small></div><p>Across the selected {range === "7d" ? "7" : "30"} days</p></div>
      <div className="panel analytics-stat"><span><Activity size={16} /> Verified work</span><div>{totals.work == null ? "—" : compact.format(totals.work)} <small>units</small></div><p>Every magnet pass counts</p></div>
      <div className="panel analytics-stat"><span><Blocks size={16} /> Blocks settled</span><div>{format(totals.blocks)} <small>blocks</small></div><p>Recorded on Sepolia</p></div>
    </div>

    <section className="panel analytics-main">
      <div className="panel-head analytics-chart-heading"><div><h2>Activity over time</h2><p className="muted">Small steps. Measurable progress.</p></div><div className="segmented analytics-range" aria-label="Activity date range">{(["7d", "30d"] as const).map((value) => <button type="button" key={value} aria-pressed={range === value} onClick={() => onRangeChange(value)} className={range === value ? "active" : ""}>{value === "7d" ? "7 days" : "30 days"}</button>)}</div></div>
      <div className="analytics-chart-toolbar"><div className="analytics-metric-tabs" aria-label="Chart metric">{(Object.keys(metricInfo) as Metric[]).map((value) => <button type="button" key={value} aria-pressed={metric === value} onClick={() => setMetric(value)} className={metric === value ? "active" : ""}>{metricInfo[value].title}</button>)}</div><span className="analytics-unit">{info.unit}</span></div>
      {chartAvailable ? <div className="analytics-large-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.series} margin={{ top: 15, right: 14, left: -16, bottom: 0 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={info.color} stopOpacity={0.24} /><stop offset="95%" stopColor={info.color} stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#282b34" strokeDasharray="3 5" /><XAxis dataKey="label" tick={{ fill: "#777e8f", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={35} dy={10} /><YAxis tick={{ fill: "#777e8f", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => compact.format(value)} width={64} /><Tooltip contentStyle={{ background: "#1b1e26", border: "1px solid #343947", borderRadius: 10, color: "#edf0f7", boxShadow: "0 10px 30px #0004" }} labelStyle={{ color: "#a3aabb", marginBottom: 5 }} formatter={(value) => [format(typeof value === "number" ? value : null, info.unit), info.title]} cursor={{ stroke: "#657085", strokeDasharray: "4 4" }} /><Area type="monotone" dataKey={metric} stroke={info.color} strokeWidth={2.5} fill={`url(#${gradientId})`} connectNulls={false} activeDot={{ r: 5, stroke: "#101218", strokeWidth: 3 }} animationDuration={500} /></AreaChart></ResponsiveContainer></div> : <EmptyChart label="No activity measurements available" />}
      <div className="analytics-chart-foot"><span><span className="analytics-legend-dot" style={{ background: info.color }} /> {isDemo ? "Illustrative sample data" : "Squeekchain measured activity"}</span><span>Daily windows · 12:00 UTC → 12:00 UTC</span></div>
    </section>

    <div className="analytics-bottom-grid">
      <section className="panel analytics-hourly"><div className="panel-head"><div><h2><Clock3 size={17} /> A day in the wheel</h2><p className="muted">Typical activity by time of day · UTC</p></div><BarChart3 size={18} className="muted" /></div>{hourlyAvailable ? <div className="analytics-hourly-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.typicalDay} margin={{ top: 15, left: -20, bottom: 0, right: 4 }}><CartesianGrid vertical={false} stroke="#282b34" strokeDasharray="3 5" /><XAxis dataKey="hour" axisLine={false} tickLine={false} minTickGap={30} tick={{ fill: "#777e8f", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#777e8f", fontSize: 10 }} tickFormatter={(value: number) => compact.format(value)} /><Tooltip contentStyle={{ background: "#1b1e26", border: "1px solid #343947", borderRadius: 10, color: "#edf0f7" }} cursor={{ fill: "#ffffff04" }} formatter={(value) => [format(typeof value === "number" ? value : null, "units"), "Mean work"]} labelFormatter={(label) => `${label} UTC`} /><Bar dataKey="work" fill="#568dff" radius={[3, 3, 0, 0]} maxBarSize={19} opacity={0.82} /></BarChart></ResponsiveContainer></div> : <EmptyChart label="Hourly activity is unavailable" />}<p className="analytics-footnote">Average work per observed half-hour window. Missing periods remain empty.</p></section>

      <section className="panel analytics-difficulty"><div className="panel-head"><div><h2><Gauge size={18} /> Network difficulty</h2><p className="muted">Latest settled core measurement</p></div></div><div className="analytics-difficulty-number">{data.difficulty == null ? "—" : compact.format(data.difficulty)}</div><span className="analytics-difficulty-unit">work units / 1,000 blocks</span><div className="analytics-difficulty-observation"><span /> {data.difficulty == null ? "AWAITING MEASUREMENT" : "LATEST SNAPSHOT"}</div><div className="analytics-difficulty-row"><span>Lifetime settled work</span><strong>{data.settledWork == null ? "—" : compact.format(data.settledWork)}</strong></div><p className="analytics-footnote">The API exposes the current difficulty. Historical difficulty is not available.</p></section>
    </div>

    <section className="panel analytics-records"><div className="panel-head"><div><h2><Trophy size={17} /> Little hamster. Big milestones.</h2><p className="muted">Records from measured activity</p></div><span className="analytics-record-badge">{isDemo ? "DEMO RECORDS" : "NETWORK RECORDS"}</span></div>{chartRecords.length ? <div className="analytics-record-grid">{chartRecords.map((record, index) => <div key={`${record.label}-${index}`}><span className="analytics-record-icon"><Trophy size={16} /></span><span>{record.label}</span><strong>{record.value}</strong></div>)}</div> : <div className="analytics-records-empty">No verified records available yet.</div>}</section>

    <style>{`
      .analytics-view{display:flex;flex-direction:column;gap:22px}.analytics-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.analytics-stat{padding:22px 24px}.analytics-stat>span{display:flex;align-items:center;gap:8px;font-size:12px;color:#9da4b4}.analytics-stat>span svg{color:#6d98ed}.analytics-stat>div{font-size:30px;line-height:1.35;letter-spacing:-1px;font-weight:600;color:#edf0f7;margin-top:16px;font-variant-numeric:tabular-nums}.analytics-stat small{font-size:13px;letter-spacing:0;color:#777e8f;font-weight:400;margin-left:3px}.analytics-stat p{font-size:11px;color:#777e8f;margin:8px 0 0}.analytics-main{padding:24px 24px 0}.analytics-view h2{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:550;letter-spacing:-.2px;margin:0;color:#e8ebf2}.analytics-view .panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:0}.analytics-view .panel-head p{font-size:12px;margin:7px 0 0;color:#7b8395}.analytics-range{display:flex;gap:3px;padding:3px;border:1px solid #2a2d37;background:#101217;border-radius:8px}.analytics-range button{font-size:11px;color:#8b93a5;padding:6px 11px;border:0;border-radius:5px;background:transparent;cursor:pointer}.analytics-range button.active{color:#eef1f8;background:#2a303d}.analytics-chart-toolbar{display:flex;justify-content:space-between;align-items:center;margin-top:26px;gap:10px}.analytics-metric-tabs{display:flex;gap:23px}.analytics-metric-tabs button{padding:0 0 10px;background:transparent;color:#858da0;border:0;border-bottom:2px solid transparent;font-size:12px;cursor:pointer;transition:color .2s,border-color .2s}.analytics-metric-tabs button.active{color:#75a4ff;border-bottom-color:#568dff}.analytics-unit{font-size:10px;color:#7b8395}.analytics-large-chart{height:280px;margin-top:15px}.analytics-chart-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #252933;margin:20px -24px 0;padding:14px 24px;font-size:10px;color:#7d8597}.analytics-chart-foot>span:first-child{display:flex;align-items:center;gap:6px}.analytics-legend-dot{height:6px;width:6px;border-radius:50%;display:inline-block}.analytics-bottom-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,1fr);gap:22px}.analytics-hourly,.analytics-difficulty{padding:24px}.analytics-hourly-chart{height:180px;margin-top:18px}.analytics-footnote{color:#757e91;font-size:10px;line-height:1.7;margin:17px 0 0}.analytics-difficulty-number{font-size:40px;font-weight:550;letter-spacing:-1px;color:#edf0f7;margin-top:26px}.analytics-difficulty-unit{display:block;font-size:11px;color:#8c95a8;margin-top:3px}.analytics-difficulty-observation{display:flex;align-items:center;gap:7px;font-size:9px;letter-spacing:.8px;color:#8596b6;margin:24px 0 20px;padding-bottom:17px;border-bottom:1px solid #292c35}.analytics-difficulty-observation span{height:5px;width:5px;border-radius:50%;background:#568dff}.analytics-difficulty-row{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#858ea1}.analytics-difficulty-row strong{font-weight:500;color:#c3cad7}.analytics-records{padding:24px}.analytics-record-badge{font-size:9px;color:#af945b;letter-spacing:.8px;background:#edbe6610;border:1px solid #edbe6620;border-radius:5px;padding:5px 8px;white-space:nowrap}.analytics-record-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:25px}.analytics-record-grid>div{padding:0 22px;border-left:1px solid #292c35;display:flex;flex-direction:column;gap:10px}.analytics-record-grid>div:first-child{padding-left:0;border-left:0}.analytics-record-grid>div:last-child{padding-right:0}.analytics-record-icon{color:#ddbb74}.analytics-record-grid>div>span:nth-child(2){color:#8992a5;font-size:11px;line-height:1.5}.analytics-record-grid strong{font-size:20px;font-weight:550;letter-spacing:-.5px;color:#e8edf7}.analytics-empty{min-height:235px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;color:#66758e}.analytics-empty strong{font-weight:500;color:#b0b8c8;font-size:13px}.analytics-empty span{color:#747e91;font-size:11px;max-width:280px;line-height:1.6}.analytics-hourly .analytics-empty{min-height:180px}.analytics-records-empty{color:#858da0;font-size:12px;padding:35px 0;text-align:center}.analytics-view button:focus-visible{outline:2px solid #86b0ff;outline-offset:4px}.analytics-view button:hover{color:#c5d9ff}.analytics-view .recharts-surface:focus-visible{outline:2px solid #86b0ff;outline-offset:3px}
      @media(max-width:1050px){.analytics-bottom-grid{grid-template-columns:minmax(0,1fr)}.analytics-record-grid{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:25px}.analytics-record-grid>div:nth-child(3){border-left:0;padding-left:0}.analytics-difficulty-track{max-width:500px}}
      @media(max-width:650px){.analytics-summary{grid-template-columns:1fr;gap:10px}.analytics-stat{padding:17px 20px}.analytics-stat>div{font-size:26px;margin-top:8px}.analytics-stat p{margin-top:4px}.analytics-main,.analytics-hourly,.analytics-difficulty,.analytics-records{padding:20px}.analytics-chart-heading{flex-wrap:wrap}.analytics-chart-toolbar{margin-top:23px}.analytics-metric-tabs{gap:17px}.analytics-metric-tabs button{font-size:11px}.analytics-unit{display:none}.analytics-large-chart{height:235px;margin-left:-8px}.analytics-chart-foot{margin:20px -20px -20px;padding:14px 20px;align-items:flex-start;flex-direction:column;gap:7px}.analytics-record-badge{display:none}.analytics-record-grid>div{padding-left:15px;padding-right:15px}.analytics-record-grid strong{font-size:18px}.analytics-view{gap:16px}}
      @media(prefers-reduced-motion:reduce){.analytics-view *{transition:none!important}}
    `}</style>
  </div>;
}
