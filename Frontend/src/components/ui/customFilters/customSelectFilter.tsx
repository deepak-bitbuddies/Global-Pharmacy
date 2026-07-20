"use client";
import { useMemo } from "react";
import { CustomAutoComplete } from "../customAutoComplete/customAutoComplete";
import { SelectionModeEnum } from "../customDropdown/customDropdown";

const ALL_OPTION_ID = "__all__";

type CustomSelectFilterProps<T> = {
  label?: string;
  /** Accessible name to use when `label` isn't rendered visibly. Falls back to `label` then `placeholder` when omitted. */
  ariaLabel?: string;
  data: T[];
  value?: T[] | T;
  onChange: (value: T[] | T) => void;
  displayKey: keyof T | string;
  idKey: keyof T | string;
  /** Also doubles as the label for the "All" option prepended to the list, e.g. "All branches". */
  placeholder?: string;
  className?: string;
};

/** A single-select filter dropdown with a built-in "All" option and in-list search (via `CustomAutoComplete`) — the shared component behind every Branch/Company filter across the app. */
export const CustomSelectFilter = <T,>(props: CustomSelectFilterProps<T>) => {
  const idKey = props.idKey as keyof T;
  const displayKey = props.displayKey as keyof T;
  const allLabel = props.placeholder ?? "All";

  const allOption = useMemo(() => ({ [idKey]: ALL_OPTION_ID, [displayKey]: allLabel }) as unknown as T, [idKey, displayKey, allLabel]);

  const items = useMemo(() => [allOption, ...props.data], [allOption, props.data]);

  const currentValue = Array.isArray(props.value) ? props.value[0] : props.value;
  const selected = currentValue ? [currentValue] : [allOption];

  return (
    <CustomAutoComplete<T>
      itemsData={items}
      value={selected}
      onChange={(value) => {
        const picked = value[0];
        if (!picked || String(picked[idKey]) === ALL_OPTION_ID) {
          props.onChange([]);
          return;
        }
        props.onChange(picked);
      }}
      displayKey={displayKey}
      idKey={idKey}
      label={props.label}
      ariaLabel={props.ariaLabel ?? props.label}
      placeholder={props.placeholder}
      selectionMode={SelectionModeEnum.single}
      showClearButton={false}
      fullWidth
      className={props.className}
    />
  );
};
