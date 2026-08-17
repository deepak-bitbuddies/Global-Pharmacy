"use client";
import { useState } from "react";
import { InfoIcon } from "@phosphor-icons/react";
import { CustomPopover, PopoverPlacementEnum } from "../customPopover/customPopover";
import { CustomTooltip } from "./customTooltip";

type CustomInfoTooltipProps = {
  /** Full explanatory text shown on hover/click — free to be as long as it needs, since the icon trigger means there's nothing to truncate on the card itself. */
  content: string;
  placement?: PopoverPlacementEnum;
  className?: string;
};

/**
 * A small "i" icon that reveals `content` two ways, both handled by react-aria overlays (so
 * positioning is always viewport-aware — never clipped by a card's edges — and transitions are
 * smooth by default, unlike a hand-rolled `position: absolute` box):
 * - Hovering opens `CustomTooltip` (its own internal hover/focus state) for an instant preview.
 * - Clicking opens `CustomPopover` (controlled, same pattern as the export-history icon button),
 *   which — unlike a tooltip — does NOT close on mouseleave, only on a second click, clicking
 *   elsewhere, or Escape. That's what makes it "stay" after a click.
 * `Popover.Trigger`/`Tooltip.Trigger` both render as a plain wrapping `<div>` that listens for
 * events via bubbling, so nesting one inside the other's trigger is safe — clicks on the button
 * still reach the outer Popover regardless of the Tooltip wrapper in between.
 */
export const CustomInfoTooltip = ({ content, placement = PopoverPlacementEnum.top, className }: CustomInfoTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CustomPopover
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      placement={placement}
      ariaLabel="More info"
      trigger={
        <CustomTooltip
          trigger={
            <button
              type="button"
              aria-label="More info"
              className={`flex size-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground ${className ?? ""}`}
            >
              <InfoIcon className="size-3.5" />
            </button>
          }
        >
          <p className="max-w-72 text-xs">{content}</p>
        </CustomTooltip>
      }
    >
      <p className="max-w-72 text-xs">{content}</p>
    </CustomPopover>
  );
};
