"use client";
import type { IconProps } from "@phosphor-icons/react";
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { CustomCard } from "../customCard/customCard";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";
import { CustomText, TextVariant, TextWeight } from "../customText/customText";

export type StatsTrend = {
  value: string;
  direction: "up" | "down";
};

export enum StatTone {
  default = "default",
  primary = "primary",
  accent = "accent",
  success = "success",
  warning = "warning",
  danger = "danger",
}

const TONE_STYLES: Record<StatTone, { icon: string; accent: string }> = {
  [StatTone.default]: { icon: "text-muted-foreground", accent: "border-l-border" },
  [StatTone.primary]: { icon: "text-primary", accent: "border-l-primary" },
  [StatTone.accent]: { icon: "text-accent", accent: "border-l-accent" },
  [StatTone.success]: { icon: "text-success", accent: "border-l-success" },
  [StatTone.warning]: { icon: "text-warning", accent: "border-l-warning" },
  [StatTone.danger]: { icon: "text-danger", accent: "border-l-danger" },
};

type CustomStatsCardProps = {
  label: string;
  value: string | number;
  icon?: React.ComponentType<IconProps>;
  tone?: StatTone;
  trend?: StatsTrend;
  loading?: boolean;
  className?: string;
};

export const CustomStatsCard = ({
  label,
  value,
  icon: Icon,
  tone = StatTone.default,
  trend,
  loading,
  className,
}: CustomStatsCardProps) => {
  const styles = TONE_STYLES[tone];

  return (
    <CustomCard className={`space-y-1 border-l-2 p-3 ${styles.accent} ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <CustomText variant={TextVariant.bodyXs} className="text-muted-foreground">
          {label}
        </CustomText>
        {Icon && <CustomAppIcon Icon={Icon} size={15} className={styles.icon} />}
      </div>

      {loading ? (
        <CustomSkeleton className="h-7 w-24" />
      ) : (
        <CustomText variant={TextVariant.h4} weight={TextWeight.semibold} className="tracking-tight tabular-nums">
          {value}
        </CustomText>
      )}

      {trend && !loading && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium ${trend.direction === "up" ? "text-success" : "text-danger"}`}>
          <CustomAppIcon Icon={trend.direction === "up" ? ArrowUpIcon : ArrowDownIcon} size={11} />
          {trend.value}
        </div>
      )}
    </CustomCard>
  );
};
