"use client";
import { Dropdown, Key, Label, Selection } from "@heroui/react";
import { ReactNode } from "react";

/**
 * Selection modes for CustomDropdown.
 */
export enum SelectionModeEnum {
  /**
   * Single selection mode.
   */
  single = "single",
  /**
   * Multiple selection mode.
   */
  multiple = "multiple",
}

/**
 * Props for CustomDropdown component.
 * @template T - Type of data items.
 */
type CustomDropdownProps<T extends object> = {
  /**
   * Trigger content (usually button/icon).
   */
  children: ReactNode;
  /**
   * Array of data objects for dropdown items.
   */
  data: T[];
  /**
   * Key property for each item (used for item id).
   */
  itemKey: keyof T;
  /**
   * Label property for display text.
   */
  itemLabel: keyof T;
  /**
   * Keys to disable items.
   */
  disableKeys?: string[];
  /**
   * Currently selected keys.
   */
  selectedKeys?: "all" | Iterable<Key>;
  /**
   * Selection mode. Defaults to 'single'.
   * @see SelectionModeEnum
   */
  selectionMode?: SelectionModeEnum;
  /**
   * Callback for selection changes.
   */
  onSelectionChange?: (keys: Selection) => void;
  /**
   * Optional per-item icon, rendered before the label.
   */
  itemIcon?: (item: T) => ReactNode;
  className?: string;
};

/**
 * Custom Dropdown component using HeroUI Dropdown.
 *
 * Example:
 * ```
 * type Option = { id: string; name: string };
 *
 * const options: Option[] = [
 *   { id: '1', name: 'Option 1' },
 *   { id: '2', name: 'Option 2' },
 * ];
 *
 * <CustomDropdown
 *   data={options}
 *   itemKey="id"
 *   itemLabel="name"
 *   selectionMode={SelectionModeEnum.multiple}
 *   onSelectionChange={(keys) => console.log(keys)}
 * >
 *   <button>Trigger</button>
 * </CustomDropdown>
 * ```
 *
 * @template T - Data item type
 */
export const CustomDropdown = <T extends object>({
  selectionMode = SelectionModeEnum.single,
  itemKey,
  itemLabel,
  ...props
}: CustomDropdownProps<T>) => {
  return (
    <Dropdown>
      <Dropdown.Trigger>{props.children}</Dropdown.Trigger>
      <Dropdown.Popover className={props.className}>
        <Dropdown.Menu
          selectionMode={selectionMode}
          selectedKeys={props.selectedKeys}
          onSelectionChange={props.onSelectionChange}
          disabledKeys={props.disableKeys}
        >
          {props.data.map((item) => {
            const itemKeyValue = String(item[itemKey]);
            const itemLabelValue = String(item[itemLabel]);
            return (
              <Dropdown.Item
                key={itemKeyValue}
                id={itemKeyValue}
                textValue={itemLabelValue}
                className="capitalize"
              >
                <Dropdown.ItemIndicator />
                {props.itemIcon?.(item)}
                <Label>{itemLabelValue}</Label>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
