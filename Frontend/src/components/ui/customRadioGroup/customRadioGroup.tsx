"use client";

import { CustomSize } from "@/lib/types";
import {
  Description,
  FieldError,
  Label,
  Radio,
  RadioGroup,
} from "@heroui/react";

export enum RadioOrientation {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

type CustomRadioGroupProps<T extends Record<string, unknown>> = {
  data: T[];
  valueKey?: keyof T;
  labelKey?: keyof T;
  descriptionKey?: keyof T; // optional description field

  value?: string;
  onChange?: (value: string) => void;

  // backward compatibility
  selectedValue?: string;
  setSelectedValue?: (value: string) => void;

  groupLabel?: string;
  description?: string;
  errorMessage?: string;

  orientation?: RadioOrientation;
  labelSize?: CustomSize;
  className?: string;
  isRequired?: boolean;
};

export const CustomRadioGroup = <T extends Record<string, unknown>>({
  data,
  valueKey = "id" as keyof T,
  labelKey = "name" as keyof T,

  value,
  onChange,
  selectedValue,
  setSelectedValue,

  groupLabel,
  description,
  errorMessage,

  orientation = RadioOrientation.Vertical,
  labelSize = CustomSize.sm,
  className,
  isRequired,
  ...props
}: CustomRadioGroupProps<T>) => {
  // ✅ final controlled value
  const finalValue = value ?? selectedValue ?? "";

  // ✅ unified handler
  const handleChange = (val: string) => {
    onChange?.(val);
    setSelectedValue?.(val);
  };

  const directionClass =
    orientation === RadioOrientation.Horizontal
      ? "flex flex-row gap-4 flex-wrap"
      : "flex flex-col gap-2";

  const sizeClass = labelSize === "sm" ? "text-sm" : "text-base";

  return (
    <div className={className}>
      {groupLabel && <Label>{groupLabel}</Label>}
      {description && <Description>{description}</Description>}

      <RadioGroup
        value={finalValue}
        onChange={handleChange}
        isRequired={isRequired}
        variant="secondary"
      >
        <div className={directionClass}>
          {data.map((item, index) => {
            const itemValue = String(item[valueKey]);
            const itemLabel = String(item[labelKey]);
            const itemDesc = props.descriptionKey
              ? String(item[props.descriptionKey])
              : undefined; // optional description field

            return (
              <Radio
                key={itemValue ?? index}
                value={itemValue} // ✅ REQUIRED
                className={sizeClass}
              >
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>{itemLabel}</Label>
                  {itemDesc && <Description>{itemDesc}</Description>}{" "}
                  {/* render description if available */}
                </Radio.Content>
              </Radio>
            );
          })}
        </div>
      </RadioGroup>

      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </div>
  );
};
