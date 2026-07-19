"use client";
import {
  CustomDateRange,
  CustomDateRangePicker,
} from "../customDatePicker/customDateRangePicker";

type CustomDateRangeFilterProps = {
  value?: CustomDateRange;
  onChange: (value?: CustomDateRange) => void;
  label?: string;
  className?: string;
};

export const CustomDateRangeFilter = ({
  label = "Date range",
  ...props
}: CustomDateRangeFilterProps) => {
  return (
    <CustomDateRangePicker
      label={label}
      value={props.value}
      onChange={props.onChange}
      className={props.className}
    />
  );
};
