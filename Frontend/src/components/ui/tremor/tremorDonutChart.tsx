"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";

export type TremorDonutDatum = { name: string; value: number };

const DEFAULT_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

type TremorDonutChartProps = {
  data: TremorDonutDatum[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  className?: string;
};

export const TremorDonutChart = ({
  data,
  colors = DEFAULT_COLORS,
  valueFormatter = (value) => value.toLocaleString(),
  height = 220,
  isLoading,
  className,
}: TremorDonutChartProps) => {
  if (isLoading) {
    return (
      <div style={{ height }} className={className}>
        <CustomSkeleton className="h-full w-full" />
      </div>
    );
  }

  if (data.length === 0 || data.every((entry) => entry.value === 0)) {
    return (
      <div style={{ height }} className={cn("flex items-center justify-center", className)}>
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => valueFormatter(Number(value))}
            contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 12 }}
            labelStyle={{ color: "var(--popover-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
