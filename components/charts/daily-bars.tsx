"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { formatCompact, formatNumber } from "@/lib/format";

export const CHART = {
  grid: "#161d29",
  axis: "#232b39",
  tick: "#7c889e",
  cyan: { mark: "#00a4cc", hover: "#2bd4f0" },
  gold: { mark: "#c38616", hover: "#f5b83d" },
} as const;

export type BarDatum = { key: string; label: string; value: number | null; note?: string };

/**
 * Daily totals as columns: one series, one hue, gaps for unobserved days,
 * a single direct label on the peak and a per-column tooltip.
 */
export function DailyBars({
  data,
  height = 240,
  tone = "cyan",
  unit,
  digits = 0,
  ariaLabel,
  highlightKey,
}: {
  data: BarDatum[];
  /** Pixels, or "100%" to fill a flex parent that has its own minimum height. */
  height?: number | string;
  tone?: "cyan" | "gold";
  unit: string;
  digits?: number;
  ariaLabel: string;
  /** Emphasise one column (e.g. the current half-hour) with the bright step. */
  highlightKey?: string;
}) {
  const colors = CHART[tone];
  const values = data.map((point) => point.value).filter((value): value is number => value !== null);
  const peak = values.length ? Math.max(...values) : null;
  const peakIndex = peak === null || peak <= 0 ? -1 : data.findIndex((point) => point.value === peak);
  const format = (value: number) => (Math.abs(value) >= 10_000 ? formatCompact(value) : formatNumber(value, digits));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={typeof height === "number" ? { height } : undefined}
      className={typeof height === "number" ? undefined : "min-h-[200px] flex-1"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 4, bottom: 0, left: -6 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART.axis }}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            minTickGap={14}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            width={46}
            tickFormatter={(value: number) => formatCompact(value)}
          />
          <Tooltip
            cursor={{ fill: "rgb(255 255 255 / 0.03)" }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const datum = payload?.[0]?.payload as BarDatum | undefined;
              return (
                <ChartTooltip
                  active={active}
                  label={datum?.note ?? datum?.label}
                  value={datum?.value === null || datum?.value === undefined ? null : formatNumber(datum.value, digits)}
                  unit={unit}
                  color={colors.hover}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            fill={colors.mark}
            activeBar={{ fill: colors.hover }}
            animationDuration={700}
            animationEasing="ease-out"
            shape={(props: unknown) => {
              const { x, y, width, height: h, payload } = props as {
                x: number;
                y: number;
                width: number;
                height: number;
                payload: BarDatum;
              };
              if (!h || h <= 0 || !width) return <g />;
              const r = Math.min(4, width / 2, h);
              const fill = payload.key === highlightKey ? colors.hover : (props as { fill?: string }).fill ?? colors.mark;
              return (
                <path
                  d={`M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + h} Z`}
                  fill={fill}
                />
              );
            }}
          >
            <LabelList
              dataKey="value"
              content={(props) => {
                const { x, y, width, value, index } = props as {
                  x?: number | string;
                  y?: number | string;
                  width?: number | string;
                  value?: number | string | null;
                  index?: number;
                };
                if (index !== peakIndex || value === null || value === undefined) return null;
                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 8}
                    textAnchor="middle"
                    fill="#a3b0c4"
                    fontSize={11}
                    fontWeight={500}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {format(Number(value))}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
