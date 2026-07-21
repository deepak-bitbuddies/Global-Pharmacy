"use client";

import {
  Autocomplete,
  Description,
  FieldError,
  Header,
  Key,
  Label,
  ListBox,
  SearchField,
  Separator,
  Tag,
  TagGroup,
  useFilter,
} from "@heroui/react";

import { CustomSize } from "@/lib/types";
import { ReactNode, useMemo } from "react";
import { CustomEmptyState } from "../customEmptyState/customEmptyState";
import { SelectionModeEnum } from "../customDropdown/customDropdown";
import { CustomSpinner } from "../customSpinner/customSpinner";

/**
 * Props for CustomAutoComplete component
 * @interface CustomAutoCompleteProps
 * @description A generic autocomplete component built on HeroUI Autocomplete
 * @template T - The type of data items
 */
export type CustomAutoCompleteProps<T> = {
  /** Currently selected items. Always an array, even for single-select (one item = [item]) */
  value?: T[];
  /** Default selected items when component first renders */
  defaultValue?: T[];
  /** Callback when selection changes. Always returns an array of selected items. */
  onChange?: (value: T[]) => void;
  /** Controlled value of the search input inside the popover */
  inputValue?: string;
  /** Callback when the search input value changes */
  onInputChange?: (value: string) => void;
  /** Array of data items to display (used without sections) */
  itemsData?: T[];
  /** Sections data as array of tuples [sectionName, items] */
  sectionsData?: [string, T[]][];
  /** Property key to use for display text in the dropdown */
  displayKey: keyof T;
  /** Property key to use as item identifier */
  idKey: keyof T;
  /** Default selected item when component first renders */
  defaultSelectedItem?: T;
  /** Callback when an item is selected. Always returns array of selected items. */
  onSelection?: (items: T[]) => void;
  /** Whether to clear display text content. Default: false */
  clearContent?: boolean;
  /** Placeholder text to display when input is empty */
  placeholder?: string;
  /** Content to display at the start of the input (e.g., icon) */
  startContent?: ReactNode;
  /** Content to display at the end of the input (e.g., icon or button) */
  endContent?: ReactNode;
  /** Label displayed above the input */
  label?: string;
  /** Accessible name when no visible `label` is rendered (required by React Aria whenever there's no connected `<Label>`) */
  ariaLabel?: string;
  /** Marks the field as required (shows asterisk) */
  isRequired?: boolean;
  fullWidth?: boolean;
  className?: string;
  description?: string;
  /** Show "Select All" option in multi-select mode. Default: true */
  showSelectAllOption?: boolean;
  /** Selection mode - single or multiple. Default: single */
  selectionMode?: SelectionModeEnum;
  isInvalid?: boolean;
  errorMsg?: string;
  onClear?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  /** Custom render function for dropdown items. Returns ReactNode to display in the list */
  renderItem?: (item: T) => ReactNode;
  /** Custom render function for selected value(s) in the input. For multi-select, receives the selected item. */
  renderValue?: (item: T) => ReactNode;
  showClearButton?: boolean;
};

/**
 * A generic autocomplete component built on HeroUI Autocomplete.
 * @component
 * @description Provides a searchable dropdown with support for single selection,
 * grouped items (sections), and customizable display keys. Built on top of HeroUI's
 * Autocomplete component.
 *
 * @template T - The type of data items
 *
 * @param props - CustomAutoComplete component props
 * @param props.inputValue - Current input value (controlled)
 * @param props.onInputChange - Callback when input value changes
 * @param props.itemsData - Array of data items to display (used without sections)
 * @param props.sectionsData - Sections data as array of tuples [sectionName, items]
 * @param props.displayKey - Property key to use for display text in the dropdown
 * @param props.idKey - Property key to use as item identifier
 * @param props.defaultSelectedItem - Default selected item when component first renders
 * @param props.onSelection - Callback when an item is selected. Returns the selected item or undefined
 * @param props.clearContent - Whether to clear display text content (default: false)
 * @param props.placeholder - Placeholder text
 * @param props.startContent - Content to display at the start of the input
 * @param props.endContent - Content to display at the end of the input
 *
 * @returns Rendered autocomplete component
 *
 * @example
 * // Basic usage with items
 * interface Item { id: number; name: string; }
 * const items: Item[] = [{ id: 1, name: "Option 1" }, { id: 2, name: "Option 2" }];
 * <CustomAutoComplete<Item>
 *   itemsData={items}
 *   displayKey="name"
 *   idKey="id"
 *   onSelection={(item) => console.log(item)}
 *   placeholder="Select an option"
 * />
 *
 * @example
 * // With sections
 * const sections: [string, Item[]][] = [
 *   ["Group A", [{ id: 1, name: "Option 1" }]],
 *   ["Group B", [{ id: 2, name: "Option 2" }]]
 * ];
 * <CustomAutoComplete<Item>
 *   sectionsData={sections}
 *   displayKey="name"
 *   idKey="id"
 * />
 */
export function CustomAutoComplete<T>({
  showClearButton = true,
  ...props
}: CustomAutoCompleteProps<T>) {
  const { contains } = useFilter({ sensitivity: "base" });

  const isMultiSelect = props.selectionMode === SelectionModeEnum.multiple;

  const showSelectAllOption =
    props.showSelectAllOption !== false && isMultiSelect;

  // Get all available items for "Select All" functionality
  const allItems = useMemo(() => {
    if (props.itemsData) return props.itemsData;
    return props.sectionsData?.flatMap(([, items]) => items) ?? [];
  }, [props.itemsData, props.sectionsData]);

  const handleSelectAll = () => {
    props.onChange?.(allItems);
  };

  const renderSections = () => {
    return (
      <ListBox
        renderEmptyState={() => <CustomEmptyState title="No results found" />}
      >
        {showSelectAllOption && (
          <>
            <ListBox.Item
              key="__select-all"
              id="__select-all"
              className="font-semibold"
              textValue="Select All"
              onPress={handleSelectAll}
            >
              <Label>Select All</Label>
            </ListBox.Item>
            <Separator />
          </>
        )}
        {props.sectionsData?.map(([sectionName, sectionItems]) => (
          <ListBox.Section key={sectionName}>
            <Header>{sectionName}</Header>
            {sectionItems.map((item) => (
              <ListBox.Item
                key={String(item[props.idKey])}
                id={String(item[props.idKey])}
                textValue={
                  props.clearContent ? "" : String(item[props.displayKey])
                }
                aria-label={String(item[props.displayKey])}
              >
                {props.renderItem ? (
                  <>{props.renderItem(item)}</>
                ) : (
                  <Label>{String(item[props.displayKey])}</Label>
                )}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox.Section>
        ))}
      </ListBox>
    );
  };

  const renderItems = () => {
    return (
      <ListBox
        renderEmptyState={() => <CustomEmptyState title="No results found" />}
      >
        {showSelectAllOption && (
          <>
            <ListBox.Item
              key="__select-all"
              id="__select-all"
              className="font-semibold"
              textValue="Select All"
              onPress={handleSelectAll}
            >
              <Label>Select All</Label>
            </ListBox.Item>
            <Separator />
          </>
        )}
        {props.itemsData?.map((item) => (
          <ListBox.Item
            key={String(item[props.idKey])}
            id={String(item[props.idKey])}
            textValue={props.clearContent ? "" : String(item[props.displayKey])}
            aria-label={String(item[props.displayKey])}
          >
            {props.renderItem ? (
              <>{props.renderItem(item)}</>
            ) : (
              <Label>{String(item[props.displayKey])}</Label>
            )}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    );
  };

  // Convert selected items to keys for HeroUI
  const selectedKeyArray: Key[] = useMemo(() => {
    if (!props.value || props.value.length === 0) return [];
    const sValue = props.value.map((item) => String(item[props.idKey]));
    return sValue;
  }, [props.value, props.idKey]);

  const selectedKey = isMultiSelect ? selectedKeyArray : selectedKeyArray[0];

  const onRemoveTags = (keys: Set<React.Key>) => {
    if (!props.value) return;
    const remainingItems = props.value.filter(
      (item) => !keys.has(String(item[props.idKey])),
    );
    props.onChange?.(remainingItems);
  };

  return (
    <Autocomplete
      className={props.className}
      aria-label={!props.label ? (props.ariaLabel ?? props.placeholder) : undefined}
      value={selectedKey}
      placeholder={props.placeholder}
      fullWidth={props.fullWidth}
      selectionMode={props.selectionMode}
      isInvalid={props.isInvalid}
      isDisabled={props.isDisabled}
      onChange={(keys) => {
        if (isMultiSelect) {
          const keysArray =
            keys instanceof Set
              ? Array.from(keys)
              : Array.isArray(keys)
                ? keys
                : [];
          // Convert keys back to items using all available items
          const selectedItems = keysArray
            .map((key) =>
              allItems.find(
                (item) => String(item[props.idKey]) === String(key),
              ),
            )
            .filter((item) => item !== undefined) as T[];

          props.onChange?.(selectedItems);
          props.onSelection?.(selectedItems);
          return;
        }

        // Single select mode
        const item =
          props.itemsData?.find(
            (i) => String(i[props.idKey]) === String(keys),
          ) ??
          props.sectionsData
            ?.flatMap(([, items]) => items)
            .find((i) => String(i[props.idKey]) === String(keys));
        if (item !== undefined) {
          props.onChange?.([item]);
          props.onSelection?.([item]);
        }
      }}
      onClear={() => {
        props.onChange?.([]);
        props.onSelection?.([]);
      }}
    >
      {props.label && <Label>{props.label}</Label>}
      <Autocomplete.Trigger className={`border-default rounded-app border-2`}>
        {props.isLoading && (
          <CustomSpinner size={CustomSize.sm} className="mx-1 self-center" />
        )}
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }) => {
            if (props.clearContent) {
              return <>{props.placeholder}</>;
            }
            if (isPlaceholder || state.selectedItems.length === 0) {
              return defaultChildren;
            }
            if (!isMultiSelect) {
              const selectedItem = state.selectedItems?.at(0);
              if (!selectedItem) return defaultChildren;
              const item =
                allItems.find(
                  (i) => String(i[props.idKey]) === String(selectedItem.key),
                ) ??
                (Array.isArray(props.value) &&
                  props.value.find(
                    (i) => String(i[props.idKey]) === String(selectedItem.key),
                  ));
              if (!item) return defaultChildren;
              return props.renderValue ? (
                <>{props.renderValue(item)}</>
              ) : (
                selectedItem.textValue
              );
            }
            return (
              <TagGroup size="sm" onRemove={onRemoveTags} aria-label={props.label ?? "Selected items"}>
                <TagGroup.List>
                  {state.selectedItems.map((selectedItem) => {
                    const itemKey = String(selectedItem.key);
                    const item =
                      allItems.find(
                        (i) => String(i[props.idKey]) === itemKey,
                      ) ??
                      (Array.isArray(props.value) &&
                        props.value.find(
                          (i) => String(i[props.idKey]) === itemKey,
                        ));
                    if (!item) return null;
                    return (
                      <Tag
                        key={String(item[props.idKey])}
                        id={String(item[props.idKey])}
                      >
                        {props.renderValue ? (
                          props.renderValue(item)
                        ) : (
                          <>{String(item[props.displayKey])}</>
                        )}
                      </Tag>
                    );
                  })}
                </TagGroup.List>
              </TagGroup>
            );
          }}
        </Autocomplete.Value>
        {!props.clearContent && showClearButton && (
          <Autocomplete.ClearButton type="button" onClick={props.onClear} />
        )}
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter
          filter={contains}
          inputValue={props.inputValue}
          onInputChange={props.onInputChange}
        >
          <SearchField autoFocus>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={props.placeholder} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          {props.sectionsData ? renderSections() : renderItems()}
        </Autocomplete.Filter>
      </Autocomplete.Popover>
      {props.description && (
        <Description className="mx-2 mt-1">{props.description}</Description>
      )}

      {props.errorMsg && <FieldError>{props.errorMsg}</FieldError>}
    </Autocomplete>
  );
}
