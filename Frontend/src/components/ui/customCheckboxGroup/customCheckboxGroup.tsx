"use client";

import { CustomSize } from "@/lib/types";
import { CheckboxGroup, Description, Label } from "@heroui/react";
import { CustomCheckbox } from "./customCheckbox";

export enum CheckboxOrientation {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

type CustomCheckboxGroupProps<T extends Record<string, unknown>> = {
  data: T[];
  valueKey?: keyof T;
  labelKey?: keyof T;

  value?: string[];
  onChange?: (values: string[]) => void;

  // backward compatibility
  selectedValue?: string[];
  setSelectedValue?: (values: string[]) => void;

  groupLabel?: string;
  description?: string;
  orientation?: CheckboxOrientation;
  labelSize?: CustomSize;
  className?: string;
  isRequired?: boolean;
};

export const CustomCheckboxGroup = <T extends Record<string, unknown>>({
  data,
  valueKey = "id" as keyof T,
  labelKey = "name" as keyof T,

  value,
  onChange,
  selectedValue,
  setSelectedValue,

  groupLabel,
  description,
  orientation = CheckboxOrientation.Vertical,
  labelSize = CustomSize.sm,
  className,
  isRequired,
}: CustomCheckboxGroupProps<T>) => {
  // ✅ final controlled value
  const finalValue = value ?? selectedValue ?? [];

  // ✅ unified change handler
  const handleChange = (values: string[]) => {
    onChange?.(values);
    setSelectedValue?.(values);
  };

  const directionClass =
    orientation === CheckboxOrientation.Horizontal
      ? "flex flex-row gap-4 flex-wrap"
      : "flex flex-col gap-2";

  const sizeClass = labelSize === "sm" ? "text-sm" : "text-base";

  return (
    <div className={className}>
      {groupLabel && <Label>{groupLabel}</Label>}
      {description && <Description>{description}</Description>}

      <CheckboxGroup
        value={finalValue}
        onChange={handleChange}
        isRequired={isRequired}
        variant="secondary"
      >
        <div className={directionClass}>
          {data.map((item, index) => {
            const itemValue = String(item[valueKey]);
            const itemLabel = String(item[labelKey]);

            return (
              <CustomCheckbox
                key={itemValue ?? index}
                value={itemValue}
                className={sizeClass}
                label={itemLabel}
              />
            );
          })}
        </div>
      </CheckboxGroup>
    </div>
  );
};
