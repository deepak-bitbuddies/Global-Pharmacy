"use client";

import { CustomSize } from "@/lib/types";
import {
  Description,
  FieldError,
  Key,
  Label,
  ListBox,
  Select,
} from "@heroui/react";
import { XIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  CustomAppIcon,
  IconVariant,
  IconWeight,
} from "../customAppIcon/customAppIcon";
import { SelectionModeEnum } from "../customDropdown/customDropdown";
import { CustomSpinner } from "../customSpinner/customSpinner";

const SELECT_ALL_KEY = "__select_all__";

type CustomSelectProps<T> = {
  /** Array of data items to display in the select */
  data: T[];
  /** Currently selected values (always an array) */
  value?: T[] | T;
  /** Callback when selection changes. Always returns T[] */
  onChange: (value: T[] | T) => void;
  /** Function to convert item to display string */
  displayKey: keyof T | string;
  /** Function to get unique key for item */
  idKey: keyof T | string;

  /** Selection mode - single or multiple. Default: SelectionModeEnum.single */
  selectionMode?: SelectionModeEnum;
  /** Placeholder text to display when no selection is made */
  placeholder?: string;
  /** Label text to display above the select */
  label?: string;
  /** Additional CSS classes to apply to the select */
  className?: string;
  /** Helper text to display below the select */
  description?: string;
  /** Whether the select is disabled. Default: false */
  disabled?: boolean;
  /** Whether the field is required. Default: false */
  isRequired?: boolean;
  fullWidth?: boolean;
  isInvalid?: boolean;
  /** Show "Select All" option in multiple mode. Default: false */
  showSelectAll?: boolean;
  /** Show clear button. Default: false */
  showClear?: boolean;
  errorMsg?: string;
  isLoading?: boolean;
  triggerStyle?: string;
};

export const CustomSelect = <T,>({
  selectionMode = SelectionModeEnum.single,
  showSelectAll = false,
  showClear = false,
  triggerStyle = "border-default rounded-app border",
  ...props
}: CustomSelectProps<T>) => {
  const t = useTranslations();
  const isMultiple = selectionMode === SelectionModeEnum.multiple;
  const idKey = props.idKey as keyof T;
  const displayKey = props.displayKey as keyof T;
  const hasSelection = Array.isArray(props.value)
    ? props.value && props.value.length > 0
    : props.value;

  const handleChange = (selection: React.Key | React.Key[] | null) => {
    if (selection === null) return;

    const keys = Array.isArray(selection)
      ? selection.map(String)
      : [String(selection)];

    if (isMultiple && showSelectAll && keys.includes(SELECT_ALL_KEY)) {
      props.onChange(props.data);
    } else {
      const filtered = keys.filter((k) => k !== SELECT_ALL_KEY);
      const selectedItems = props.data.filter((item) =>
        filtered.includes(String(item[idKey])),
      );

      if (isMultiple) {
        props.onChange(selectedItems);
      } else {
        props.onChange(selectedItems.length > 0 ? selectedItems[0] : []);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onChange([]);
  };

  const selectedKeyArray: Key[] | Key = useMemo(() => {
    if (!props.value) return [];
    const sValue = Array.isArray(props.value)
      ? props.value.map((item) => String(item[idKey]))
      : String(props.value[idKey]);
    return sValue;
  }, [props.value, idKey]);

  return (
    <div className={`relative ${props.fullWidth ? "w-full" : "w-fit"}`}>
      <Select
        key={`select-${hasSelection}`}
        placeholder={props.placeholder}
        value={selectedKeyArray}
        isDisabled={props.disabled}
        selectionMode={selectionMode}
        className={props.className}
        isRequired={props.isRequired}
        fullWidth={props.fullWidth}
        isInvalid={props.isInvalid}
        onChange={handleChange}
      >
        {props.label && <Label>{props.label}</Label>}
        <Select.Trigger className={triggerStyle}>
          {props.isLoading && <CustomSpinner size={CustomSize.sm} />}
          <Select.Value
            className={"line-clamp-1 truncate text-nowrap wrap-anywhere"}
          />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox selectionMode={selectionMode}>
            {(!props.data || (props.data && props.data.length < 1)) && (
              <ListBox.Item
                key={"none"}
                id={"none"}
                textValue="Select All"
                className="text-muted gap-2 px-5"
              >
                {t("NoData")}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
            {isMultiple && showSelectAll && (
              <ListBox.Item
                key={SELECT_ALL_KEY}
                id={SELECT_ALL_KEY}
                textValue="Select All"
                className="gap-2 px-5"
              >
                Select All
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
            {props.data &&
              props.data.map((item) => {
                return (
                  <ListBox.Item
                    key={String(item[idKey])}
                    id={String(item[idKey])}
                    textValue={String(item[displayKey])}
                    className="gap-2 px-5"
                  >
                    {String(item[displayKey])}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
          </ListBox>
        </Select.Popover>
        {props.description && <Description>{props.description}</Description>}
        {props.errorMsg && <FieldError>{props.errorMsg}</FieldError>}
      </Select>
      {hasSelection && showClear && (
        <div
          className="pointer-events-auto absolute right-7 bottom-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClear(e);
          }}
        >
          <CustomAppIcon
            Icon={XIcon}
            weight={IconWeight.bold}
            variant={IconVariant.light}
            size={11.5}
            className="h-5 w-5 cursor-pointer rounded-full"
          />
        </div>
      )}
    </div>
  );
};
