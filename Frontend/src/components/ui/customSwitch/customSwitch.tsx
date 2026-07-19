"use client";
import { CustomSize } from "@/lib/types";
import { Label, Switch } from "@heroui/react";
import { ReactNode } from "react";

type CustomSwitchProps = {
  children?: ReactNode;
  isSelected?: boolean;
  setIsSelected?: (value: boolean) => void;
  size?: CustomSize;
  isDisabled?: boolean;
  labelStyle?: string;
  className?: string;
  ariaLabel?: string;
};

export const CustomSwitch = ({
  children,
  isSelected = false,
  setIsSelected,
  className,
  ariaLabel = "customSwitch",
  ...props
}: CustomSwitchProps) => {
  return (
    <Switch
      size={props.size}
      isSelected={isSelected}
      onChange={setIsSelected}
      isDisabled={props.isDisabled}
      aria-label={ariaLabel}
      className={className}
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
      {children && <Label className={`text-sm ${props.labelStyle ?? ""}`}>{children}</Label>}
    </Switch>
  );
};
