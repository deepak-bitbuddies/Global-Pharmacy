"use client";
import { ReactNode } from "react";

type CustomStatsGridProps = {
  children: ReactNode;
  className?: string;
};

export const CustomStatsGrid = ({ children, className }: CustomStatsGridProps) => {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
      {children}
    </div>
  );
};
