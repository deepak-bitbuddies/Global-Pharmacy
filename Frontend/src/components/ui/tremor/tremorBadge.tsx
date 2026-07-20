"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export enum TremorTone {
  default = "default",
  primary = "primary",
  accent = "accent",
  success = "success",
  warning = "warning",
  danger = "danger",
}

export const TREMOR_TONE_CLASSES: Record<TremorTone, string> = {
  [TremorTone.default]: "bg-muted-surface text-muted-foreground",
  [TremorTone.primary]: "bg-primary/10 text-primary",
  [TremorTone.accent]: "bg-accent/10 text-accent",
  [TremorTone.success]: "bg-success/10 text-success",
  [TremorTone.warning]: "bg-warning/10 text-warning",
  [TremorTone.danger]: "bg-danger/10 text-danger",
};

type TremorBadgeProps = {
  children: ReactNode;
  tone?: TremorTone;
  className?: string;
};

export const TremorBadge = ({ children, tone = TremorTone.default, className }: TremorBadgeProps) => {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", TREMOR_TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
};
