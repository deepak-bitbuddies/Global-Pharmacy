"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";

const DEFAULT_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

type TremorBarChartProps = {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: string[];
  /**
   * Per-bar (per data point) colors instead of per-category — only makes
   * sense with a single category, e.g. coloring each bar by its own
   * severity rather than by which series it belongs to.
   */
  barColors?: string[];
  valueFormatter?: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  className?: string;
  /** Fires when a bar is clicked — the full data point it was drawn from, plus which category (series) it belongs to. Bars get a pointer cursor whenever this is passed. */
  onBarClick?: (dataPoint: Record<string, unknown>, category: string) => void;
};

export const TremorBarChart = ({
  data,
  index,
  categories,
  colors = DEFAULT_COLORS,
  barColors,
  valueFormatter = (value) => value.toLocaleString(),
  height = 260,
  isLoading,
  className,
  onBarClick,
}: TremorBarChartProps) => {
  if (isLoading) {
    return (
      <div style={{ height }} className={className}>
        <CustomSkeleton className="h-full w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ height }} className={cn("flex items-center justify-center", className)}>
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={index} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} tickFormatter={valueFormatter} />
          <Tooltip
            formatter={(value) => valueFormatter(Number(value))}
            contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 12 }}
            labelStyle={{ color: "var(--popover-foreground)" }}
            cursor={{ fill: "var(--muted-surface)" }}
          />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              className={onBarClick ? "cursor-pointer" : undefined}
              onClick={onBarClick ? (point) => onBarClick(point as unknown as Record<string, unknown>, category) : undefined}
            >
              {barColors && data.map((_, di) => <Cell key={di} fill={barColors[di % barColors.length]} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
