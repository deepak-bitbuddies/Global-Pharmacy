"use client";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts-for-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { CustomEmptyState } from "../customEmptyState/customEmptyState";
import { CustomSpinner } from "../customSpinner/customSpinner";

type ChartTheme = {
  palette: string[];
  textColor: string;
};

/**
 * Reads the app's `--chart-1..5` / `--muted-foreground` CSS custom
 * properties so charts render in the same palette as the rest of the app
 * (and follow light/dark automatically) instead of ECharts' own defaults.
 */
function readChartTheme(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    palette: [1, 2, 3, 4, 5].map((n) => read(`--chart-${n}`)),
    textColor: read("--muted-foreground"),
  };
}

type CustomChartProps = {
  option: EChartsOption;
  height?: number | string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
};

export function CustomChart({
  option,
  height = 320,
  isLoading,
  isEmpty,
  emptyLabel = "No data to display",
  className,
}: CustomChartProps) {
  const { resolvedTheme } = useTheme();
  // `resolvedTheme` is `undefined` on the server and on the very first
  // client render (next-themes resolves it just after mount) — reusing that
  // as the "safe to touch the DOM" signal avoids a separate mount effect
  // and keeps server/first-client-render output identical (no hydration
  // mismatch), since `getComputedStyle` can't run during SSR.
  const chartTheme = useMemo<ChartTheme | null>(() => (resolvedTheme ? readChartTheme() : null), [resolvedTheme]);

  if (isEmpty) {
    return (
      <div style={{ height }} className={className}>
        <CustomEmptyState title={emptyLabel} />
      </div>
    );
  }

  if (!chartTheme) {
    return (
      <div style={{ height }} className={`flex items-center justify-center ${className ?? ""}`}>
        <CustomSpinner />
      </div>
    );
  }

  const themedOption: EChartsOption = {
    color: chartTheme.palette,
    textStyle: { color: chartTheme.textColor, fontFamily: "inherit" },
    grid: { left: 8, right: 8, top: 32, bottom: 8, containLabel: true },
    ...option,
  };

  return <ReactECharts option={themedOption} style={{ height }} className={className} showLoading={isLoading} notMerge />;
}
