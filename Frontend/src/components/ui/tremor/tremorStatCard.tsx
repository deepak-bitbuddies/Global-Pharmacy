"use client";
import type { IconProps } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { CustomInfoTooltip } from "../customTooltip/customInfoTooltip";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";
import { TREMOR_TONE_CLASSES, TremorTone } from "./tremorBadge";
import { TremorCard } from "./tremorCard";

type TremorStatCardProps = {
  label: string;
  value: string | number;
  /** Note on what this figure is and how it's calculated, shown via an "i" icon next to the label — not truncated, so it's free to be as long as it needs to be. */
  description?: string;
  icon?: React.ComponentType<IconProps>;
  tone?: TremorTone;
  loading?: boolean;
  className?: string;
};

export const TremorStatCard = ({ label, value, description, icon: Icon, tone = TremorTone.primary, loading, className }: TremorStatCardProps) => {
  return (
    <TremorCard className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          {description && <CustomInfoTooltip content={description} />}
        </div>
        {loading ? (
          <CustomSkeleton className="h-7 w-24" />
        ) : (
          <p className="text-xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
        )}
      </div>
      {Icon && (
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TREMOR_TONE_CLASSES[tone])}>
          <CustomAppIcon Icon={Icon} size={17} />
        </div>
      )}
    </TremorCard>
  );
};
