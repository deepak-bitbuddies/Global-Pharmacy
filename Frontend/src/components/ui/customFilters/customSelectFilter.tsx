"use client";
import { CustomSelect } from "../customSelect/customSelect";
import { SelectionModeEnum } from "../customDropdown/customDropdown";

type CustomSelectFilterProps<T> = {
  label?: string;
  data: T[];
  value?: T[] | T;
  onChange: (value: T[] | T) => void;
  displayKey: keyof T | string;
  idKey: keyof T | string;
  placeholder?: string;
  className?: string;
};

export const CustomSelectFilter = <T,>(props: CustomSelectFilterProps<T>) => {
  return (
    <CustomSelect
      data={props.data}
      value={props.value}
      onChange={props.onChange}
      displayKey={props.displayKey}
      idKey={props.idKey}
      label={props.label}
      placeholder={props.placeholder}
      selectionMode={SelectionModeEnum.single}
      showClear
      fullWidth
      className={props.className}
    />
  );
};
