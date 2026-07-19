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
        <Popover.Dialog className="border-none p-0 outline-none">
          {props.children}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
};
