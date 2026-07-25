"use client";
import { Popover } from "@heroui/react";
import { ReactNode } from "react";

export enum PopoverPlacementEnum {
  top = "top",
  bottom = "bottom",
  right = "right",
  left = "left",
}
type CustomPopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
  placement?: PopoverPlacementEnum;
  offset?: number;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  /** Accessible name for the popover content. Required since it has no visible title. */
  ariaLabel?: string;
};

export const CustomPopover = (props: CustomPopoverProps) => {
  return (
    <Popover
      isOpen={props.isOpen}
      onOpenChange={(open) => props.setIsOpen?.(open)}
    >
      <Popover.Trigger>{props.trigger}</Popover.Trigger>
      <Popover.Content
        placement={props.placement}
        offset={props.offset}
        className="p-2"
      >
        <Popover.Dialog
          className="border-none p-0 outline-none"
          aria-label={props.ariaLabel ?? "Popover"}
        >
          {props.children}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
};
