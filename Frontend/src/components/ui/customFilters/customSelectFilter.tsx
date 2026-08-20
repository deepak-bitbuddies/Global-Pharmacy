"use client";
import { useMemo } from "react";
import { CustomAutoComplete } from "../customAutoComplete/customAutoComplete";
import { SelectionModeEnum } from "../customDropdown/customDropdown";
import { FILTER_TRIGGER_CLASSNAME } from "./customFilterBar";

const ALL_OPTION_ID = "__all__";

type CustomSelectFilterProps<T> = {
  label?: string;
  /** Accessible name to use when `label` isn't rendered visibly. Falls back to `label` then `placeholder` when omitted. */
  ariaLabel?: string;
  data: T[];
  value?: T[] | T;
  /** Always receives an array — empty when cleared, one item in single mode, any number in `multiple` mode. Single-select callers typically just read `value[0]`. */
  onChange: (value: T[]) => void;
  displayKey: keyof T | string;
  idKey: keyof T | string;
  /** In single mode, also doubles as the label for the built-in "All" option (e.g. "All branches"). Multi mode has no synthetic "All" entry — clearing every tag means "no filter", same as never having picked one. */
  placeholder?: string;
  className?: string;
  /** Allow selecting more than one value (tag chips, no "All" option). Default: false. */
  multiple?: boolean;
};

/**
 * The one shared filter dropdown behind every Branch/Company/Type/... filter across the app —
 * single-select (with a built-in "All" option) by default, or `multiple` for tag-chip multi-select.
 * Both modes are just two configurations of the same `CustomAutoComplete` primitive, so there's a
 * single place that owns "how a filter dropdown behaves," not two parallel implementations.
 */
export const CustomSelectFilter = <T,>({ multiple = false, ...props }: CustomSelectFilterProps<T>) => {
  const idKey = props.idKey as keyof T;
  const displayKey = props.displayKey as keyof T;
  const allLabel = props.placeholder ?? "All";

  const allOption = useMemo(() => ({ [idKey]: ALL_OPTION_ID, [displayKey]: allLabel }) as unknown as T, [idKey, displayKey, allLabel]);

  const singleItems = useMemo(() => [allOption, ...props.data], [allOption, props.data]);

  if (multiple) {
    const multiValue = Array.isArray(props.value) ? props.value : props.value ? [props.value] : [];
    return (
      <CustomAutoComplete<T>
        itemsData={props.data}
        value={multiValue}
        onChange={props.onChange}
        displayKey={displayKey}
        idKey={idKey}
        label={props.label}
        ariaLabel={props.ariaLabel ?? props.label}
        placeholder={props.placeholder}
        selectionMode={SelectionModeEnum.multiple}
        triggerClassName={FILTER_TRIGGER_CLASSNAME}
        className={props.className}
      />
    );
  }

  const currentValue = Array.isArray(props.value) ? props.value[0] : props.value;
  const selected = currentValue ? [currentValue] : [allOption];

  return (
    <CustomAutoComplete<T>
      itemsData={singleItems}
      value={selected}
      onChange={(value) => {
        const picked = value[0];
        if (!picked || String(picked[idKey]) === ALL_OPTION_ID) {
          props.onChange([]);
          return;
        }
        props.onChange([picked]);
      }}
      displayKey={displayKey}
      idKey={idKey}
      label={props.label}
      ariaLabel={props.ariaLabel ?? props.label}
      placeholder={props.placeholder}
      selectionMode={SelectionModeEnum.single}
      showClearButton={false}
      triggerClassName={FILTER_TRIGGER_CLASSNAME}
      className={props.className}
    />
  );
};
