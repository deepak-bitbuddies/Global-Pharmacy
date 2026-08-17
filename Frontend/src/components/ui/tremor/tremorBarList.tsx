"use client";
import { cn } from "@/lib/utils";

export type TremorBarListItem = {
  name: string;
  value: number;
};

type TremorBarListProps = {
  data: TremorBarListItem[];
  valueFormatter?: (value: number) => string;
  className?: string;
  /** Fires when a row is clicked. Rows get a pointer cursor + hover highlight whenever this is passed. */
  onItemClick?: (item: TremorBarListItem) => void;
};

export const TremorBarList = ({ data, valueFormatter = (value) => value.toLocaleString(), className, onItemClick }: TremorBarListProps) => {
  if (data.length === 0) {
    return <p className={cn("py-6 text-center text-xs text-muted-foreground", className)}>No data available</p>;
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className={cn("flex items-center gap-3 rounded-app", onItemClick && "cursor-pointer hover:bg-muted-surface")}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
        >
          <span className="w-28 shrink-0 truncate text-xs font-medium text-foreground sm:w-40" title={item.name}>
            {item.name}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted-surface">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: `var(--color-chart-${(index % 8) + 1})` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">{valueFormatter(item.value)}</span>
        </div>
      ))}
    </div>
  );
};
