"use client";
import { Checkbox, Description, Label } from "@heroui/react";

export enum CustomCheckboxVariant {
  Primary = "primary",
  Secondary = "secondary",
}

type CustomCheckboxProps = {
  value?: string;
  isSelected?: boolean;
  setIsSelected?: (value: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
  labelStyle?: string;
  isDisabled?: boolean;
  defaultSelected?: boolean;
  isIndeterminate?: boolean;
  isInvalid?: boolean;
  customIndicator?: React.ReactNode;
  variant?: CustomCheckboxVariant;
  labelClassName?: string;
};
export const CustomCheckbox = ({ ...props }: CustomCheckboxProps) => {
  return (
    <Checkbox
      value={props.value}
      className={props.className}
      isDisabled={props.isDisabled}
      defaultSelected={props.defaultSelected}
      id={props.label}
      isSelected={props.isSelected}
      onChange={props.setIsSelected}
      isIndeterminate={props.isIndeterminate}
      isInvalid={props.isInvalid}
      variant={props.variant}
    >
      <Checkbox.Control>
        {props.customIndicator ? (
          props.isSelected ? (
            props.customIndicator
          ) : null
        ) : (
          <Checkbox.Indicator />
        )}
      </Checkbox.Control>
      <Checkbox.Content>
        <Label htmlFor={props.label} className={props.labelClassName}>
          {props.label}
        </Label>
        <Description>{props.description}</Description>
      </Checkbox.Content>
    </Checkbox>
  );
};
