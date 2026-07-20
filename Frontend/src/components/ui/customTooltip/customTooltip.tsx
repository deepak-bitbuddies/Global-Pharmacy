"use client";
import { Tooltip } from "@heroui/react";
import { ReactNode } from "react";

export enum TooltipPlacement {
  top = "top",
  bottom = "bottom",
  left = "left",
  right = "right",
}

type CustomTooltipProps = {
  trigger: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
};

export const CustomTooltip = ({
  trigger,
  children,
  placement,
  className,
}: CustomTooltipProps) => {
  return (
    <Tooltip>
      <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
      <Tooltip.Content placement={placement} className={className}>
        {children}
      </Tooltip.Content>
    </Tooltip>
  );
};
