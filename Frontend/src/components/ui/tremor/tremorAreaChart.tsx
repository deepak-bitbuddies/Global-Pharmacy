"use client";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";

type TremorAreaChartProps = {
  data: Record<string, unknown>[];
  index: string;
  category: string;
  valueFormatter?: (value: number) => string;
  color?: string;
  height?: number;
  isLoading?: boolean;
  className?: string;
};

export const TremorAreaChart = ({
  data,
  index,
  category,
  valueFormatter = (value) => value.toLocaleString(),
  color = "var(--color-chart-1)",
  height = 260,
  isLoading,
  className,
}: TremorAreaChartProps) => {
  const gradientId = useId();

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
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={index} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} tickFormatter={valueFormatter} />
          <Tooltip
            formatter={(value) => valueFormatter(Number(value))}
            contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 12 }}
            labelStyle={{ color: "var(--popover-foreground)" }}
          />
          <Area type="monotone" dataKey={category} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
