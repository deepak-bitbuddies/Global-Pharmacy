"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TremorCardProps = {
  children: ReactNode;
  className?: string;
};

export const TremorCard = ({ children, className }: TremorCardProps) => {
  return <div className={cn("rounded-app border border-border/60 bg-card p-4 shadow-sm", className)}>{children}</div>;
};
