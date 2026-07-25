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
  /** Additional classes for the trigger's wrapping element, e.g. "w-full" so a full-width trigger (like a sidebar button) isn't shrunk by the wrapper. */
  triggerClassName?: string;
  /**
   * Disables the tooltip while keeping the same trigger/content tree
   * mounted. Prefer this over conditionally rendering `CustomTooltip` vs.
   * its bare `trigger` — swapping between the two forces React to
   * unmount/remount the whole subtree (and everything inside `trigger`)
   * whenever the condition flips, e.g. once per element in a list that
   * toggles tooltip-only mode.
   */
  isDisabled?: boolean;
};

export const CustomTooltip = ({
  trigger,
  children,
  placement,
  className,
  triggerClassName,
  isDisabled,
}: CustomTooltipProps) => {
  return (
    <Tooltip isDisabled={isDisabled}>
      <Tooltip.Trigger className={triggerClassName}>{trigger}</Tooltip.Trigger>
      <Tooltip.Content placement={placement} className={className}>
        {children}
      </Tooltip.Content>
    </Tooltip>
  );
};
