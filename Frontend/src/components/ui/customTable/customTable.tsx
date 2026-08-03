"use client";

import { CustomSize } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Selection, SortDescriptor } from "@heroui/react";
import { Checkbox, Label, Table } from "@heroui/react";
import { ArrowDownIcon, ClipboardTextIcon, ColumnsIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { BulkAction, CustomBulkActionsToolbar } from "../customActions/customBulkActionsToolbar";
import { ButtonVariant, CustomButton } from "../customButton/customButton";
import { CheckboxOrientation, CustomCheckboxGroup } from "../customCheckboxGroup/customCheckboxGroup";
import { CustomEmptyState } from "../customEmptyState/customEmptyState";
import { CustomSearchFilter } from "../customFilters/customSearchFilter";
import CustomCursorPagination from "../customPagination/customCursorPagination";
import CustomPagination from "../customPagination/customPagination";
import { CustomPopover } from "../customPopover/customPopover";
import { CustomSelect } from "../customSelect/customSelect";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";

const rows = ["5", "10", "25", "50", "100", "250", "500"];

/**
 * Column configuration for the CustomTable.
 * @template T - The type of data items in the table.
 */
export type TableHeaderColumn<T> = {
  /**
   * The key of the column, used for sorting and cell rendering. Can be a keyof T or string.
   */
  key: keyof T | string;
  /**
   * Display label for the column header.
   */
  label: string;
  /**
   * Whether the column is sortable. Defaults to false.
   */
  sortable?: boolean;
};

/**
 * Selection modes supported by CustomTable.
 */
export enum TableSelectionModeEnum {
  /**
   * Single row selection.
   */
  Single = "single",
  /**
   * Multiple row selection.
   */
  Multiple = "multiple",
}

/**
 * Props for the CustomTable component.
 * @template T - The type of objects in the data array.
 */
type CustomTableProps<T extends object> = {
  /**
   * Array of column definitions.
   * @see TableHeaderColumn
   */
  columns: TableHeaderColumn<T>[];
  /**
   * Array of data objects to display in the table.
   */
  data: T[];
  /**
   * Whether to show loading state with skeleton rows. Defaults to false.
   */
  loading?: boolean;
  /**
   * Custom empty state text. Defaults to translated "DataNotAvailable".
   */
  emptyText?: string;
  /**
   * Whether table header should be sticky. Defaults to false.
   */
  isHeaderSticky?: boolean;
  /**
   * Whether to render table in compact mode. Defaults to false.
   */
  isCompact?: boolean;
  /**
   * Required function to render content for each cell.
   * @param item - The data item for the row.
   * @param columnKey - The column key.
   * @returns Rendered cell content.
   */
  renderCustomCell: (
    item: T,
    columnKey: keyof T,
  ) => string | number | React.ReactNode;
  /**
   * Selection mode: 'single' or 'multiple'. Defaults to none.
   * @see TableSelectionModeEnum
   */
  selectionMode?: TableSelectionModeEnum;
  /**
   * Currently selected item IDs (controlled). Array of strings.
   */
  selectedValue?: string[];
  /**
   * Initially selected item IDs (uncontrolled). Array of strings.
   */
  defaultSelectedValue?: string[];
  /**
   * Callback when selection changes. Receives array of selected IDs.
   */
  onSelectionChange?: (value: string[]) => void;
  /**
   * Total number of items for pagination calculation (used with currentPage/onPageChange).
   */
  totalItems?: number;
  /**
   * Key to use for TableRow key prop. Required.
   */
  rowKey: keyof T;
  /**
   * Key to use for item ID in selection. Required.
   */
  itemId: keyof T;
  /**
   * Default rows per page. Defaults to 10.
   */
  defaultRowsPerPage?: number;
  /**
   * Callback when rows per page changes.
   */
  onRowsPerPageChange?: (value: number) => void;
  /**
   * Current page (controlled). Starts at 1.
   */
  currentPage?: number;
  /**
   * Callback when page changes.
   */
  onPageChange?: (page: number) => void;
  /**
   * top content above table
   */
  topContent?: ReactNode;
  /**
   * show pagination
   */
  showPagination?: boolean;
  /**
   * Array of item IDs that should be disabled (not selectable). Defaults to empty array.
   */
  disabledKeys?: string[];
  /**
   * Callback when sort changes. Receives column key and direction.
   */
  onSortChange?: (sortKey: string, direction: "asc" | "desc") => void;
  /**
   * Current global search value. Providing this (with `onGlobalFilterChange`)
   * renders a debounced search box above the table.
   */
  globalFilter?: string;
  /**
   * Callback fired (debounced) when the global search value changes.
   */
  onGlobalFilterChange?: (value: string) => void;
  /**
   * Placeholder for the global search box.
   */
  searchPlaceholder?: string;
  /**
   * Bulk actions shown in a toolbar that replaces the search box while any
   * rows are selected. Requires `selectionMode="multiple"`.
   */
  bulkActions?: BulkAction[];
  /**
   * Renders Previous/Next keyset-pagination controls instead of the default
   * numbered-page `CustomPagination` — for backend cursor-paginated data,
   * which can't jump to an arbitrary unvisited page. When set, `data` is
   * trusted to already be the correct page (same as controlled `currentPage`).
   */
  cursorPagination?: {
    page: number;
    totalPages?: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onNext: () => void;
    onPrevious: () => void;
  };
  /**
   * Shows a "Columns" toggle button (in the top toolbar row) that lets the
   * user show/hide individual columns. Hidden columns are omitted from both
   * the header and body cells but stay listed (and re-toggleable) in the
   * popover. Defaults to false.
   */
  enableColumnVisibility?: boolean;
  /**
   * Prevents header labels and cell content from wrapping (keeps every
   * column to a single line, relying on the table's horizontal scroll for
   * overflow). Defaults to false.
   */
  noWrap?: boolean;
};

/**
 * A feature-rich, customizable table component.
 *
 * Supports sorting, row selection (single/multiple), pagination (controlled/uncontrolled),
 * loading states, sticky headers, compact mode, and custom cell rendering.
 *
 * ## Example Usage:
 * ```
 * type User = { id: string; name: string; email: string };
 *
 * const columns: TableHeaderColumn<User>[] = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'email', label: 'Email' },
 * ];
 *
 * const renderCell = (user: User, key: keyof User) => user[key];
 *
 * <CustomTable<User>
 *   columns={columns}
 *   data={users}
 *   renderCustomCell={renderCell}
 *   rowKey="id"
 *   itemId="id"
 *   totalItems={users.length}
 *   selectionMode="multiple"
 *   onSelectionChange={setSelectedUsers}
 * />
 * ```
 *
 * @template T - Type of data row objects.
 * @param props - CustomTableProps
 */
export const CustomTable = <T extends object>({
  defaultRowsPerPage = 10,
  currentPage: controlledPage,
  showPagination = true,
  selectionMode = TableSelectionModeEnum.Single,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  ...props
}: CustomTableProps<T>) => {
  const t = useTranslations();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(String(defaultRowsPerPage));
  const finalPage = controlledPage !== undefined ? controlledPage : page;

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>();

  // Track the last clicked sortable column header to map aria IDs to column keys
  const [lastSortedColumnKey, setLastSortedColumnKey] = useState<string>();

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    props.columns.map((column) => String(column.key)),
  );
  const [isColumnPopoverOpen, setIsColumnPopoverOpen] = useState(false);

  const visibleColumns = useMemo(
    () =>
      props.enableColumnVisibility
        ? props.columns.filter((column) => visibleColumnKeys.includes(String(column.key)))
        : props.columns,
    [props.columns, props.enableColumnVisibility, visibleColumnKeys],
  );

  const handleSortChange = useCallback(
    (descriptor: SortDescriptor) => {
      setSortDescriptor(descriptor);
      setPage(1);
      onPageChange?.(1);
      if (lastSortedColumnKey && descriptor.direction) {
        onSortChange?.(
          lastSortedColumnKey,
          descriptor.direction == "ascending" ? "asc" : "desc",
        );
      }
    },
    [onPageChange, lastSortedColumnKey, onSortChange],
  );

  const selectedKeys: Selection = useMemo(() => {
    return props.selectedValue ? new Set(props.selectedValue) : new Set([]);
  }, [props.selectedValue]);

  const defaultSelectedKeys: Selection = props.defaultSelectedValue
    ? new Set(props.defaultSelectedValue)
    : new Set([]);

  const handleSelectionChange = (selection: Selection) => {
    let selectedArray: string[] = [];

    if (selection === "all") {
      // Get all non-disabled item IDs
      const allNonDisabledIds = props.data
        .map((item) => {
          const itemIdValue = item[props.itemId as keyof T];
          return String(itemIdValue);
        })
        .filter((id) => !props.disabledKeys?.includes(id));

      // Check if all non-disabled items are already selected
      const currentSelectedSet =
        selectedKeys instanceof Set ? selectedKeys : new Set();
      const allAlreadySelected =
        allNonDisabledIds.length > 0 &&
        allNonDisabledIds.every((id) => currentSelectedSet.has(id));

      // Toggle: if all non-disabled are selected, deselect all; otherwise select all
      selectedArray = allAlreadySelected ? [] : allNonDisabledIds;
    } else {
      const keysArray = Array.from(selection as Set<string>);
      selectedArray = keysArray
        .map((k) => String(k))
        .filter((id) => !props.disabledKeys?.includes(id));
    }

    props.onSelectionChange?.(selectedArray);
  };

  const sortedItems = useMemo(() => {
    if (!sortDescriptor || !lastSortedColumnKey || !props.data.length)
      return props.data;

    const sorted = [...props.data].sort((a, b) => {
      const aVal = a[lastSortedColumnKey as keyof T];
      const bVal = b[lastSortedColumnKey as keyof T];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });

    return sorted;
  }, [sortDescriptor, props.data, lastSortedColumnKey]);

  const paginatedItems = useMemo(() => {
    if (!showPagination) return sortedItems;
    if (controlledPage !== undefined || props.cursorPagination) return sortedItems;
    const startIndex = (finalPage - 1) * parseInt(rowsPerPage);
    const endIndex = startIndex + parseInt(rowsPerPage);
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, finalPage, rowsPerPage, showPagination, controlledPage, props.cursorPagination]);

  const handleDropdown = useCallback(
    (value: { value: string; label?: string }) => {
      setRowsPerPage(value.value);
      onRowsPerPageChange?.(parseInt(value.value));
      setPage(1);
      onPageChange?.(1);
    },
    [onPageChange, onRowsPerPageChange],
  );

  function SortableColumnHeader({
    children,
    sortDirection,
  }: {
    children: React.ReactNode;
    sortDirection?: "ascending" | "descending";
  }) {
    return (
      <span className="flex items-center justify-between">
        {children}
        {!!sortDirection && (
          <CustomAppIcon
            Icon={ArrowDownIcon}
            className={cn(
              "size-3 transform transition-transform duration-100 ease-out",
              sortDirection === "descending" ? "rotate-180" : "",
            )}
          />
        )}
      </span>
    );
  }

  const rowOptions = useMemo(
    () => rows.map((row) => ({ value: row, label: row })),
    [],
  );

  const bottomContent = useMemo(() => {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-2 py-2">
        <div className="flex flex-row items-center gap-2">
          <Label>{t("Show")}</Label>
          <CustomSelect
            ariaLabel={t("Show")}
            data={rowOptions}
            idKey="value"
            displayKey="label"
            value={rowOptions.filter((opt) => opt.value === rowsPerPage)}
            onChange={(value) => {
              if (Array.isArray(value) || !value) {
                handleDropdown({ value: rowsPerPage });
              } else {
                handleDropdown(value);
              }
            }}
          />

          <Label>{t("entries")}</Label>
        </div>

        <div className="flex justify-end gap-2">
          {props.cursorPagination ? (
            <CustomCursorPagination
              page={props.cursorPagination.page}
              totalPages={props.cursorPagination.totalPages}
              totalItems={props.totalItems ?? 0}
              itemsPerPage={parseInt(rowsPerPage)}
              hasNextPage={props.cursorPagination.hasNextPage}
              hasPreviousPage={props.cursorPagination.hasPreviousPage}
              onNext={props.cursorPagination.onNext}
              onPrevious={props.cursorPagination.onPrevious}
            />
          ) : (
            <CustomPagination
              page={finalPage}
              total={Math.ceil((props.totalItems ?? 0) / parseInt(rowsPerPage))}
              totalItems={props.totalItems ?? 0}
              itemsPerPage={parseInt(rowsPerPage)}
              onChange={(page: number) => {
                setPage(page);
                onPageChange?.(page);
              }}
            />
          )}
        </div>
      </div>
    );
  }, [
    rowsPerPage,
    rowOptions,
    t,
    handleDropdown,
    finalPage,
    props.totalItems,
    props.cursorPagination,
    onPageChange,
  ]);

  const selectedCount =
    selectedKeys instanceof Set ? selectedKeys.size : props.data.length;

  const tableBodyItems = useMemo(
    () =>
      paginatedItems.map((item) => ({
        ...item,
        key: String(item[props.rowKey as keyof T] ?? "fallback-row"),
      })),
    [paginatedItems, props.rowKey],
  );

  return (
    <Table
      className="w-full max-w-[calc(100vw-32px)] lg:max-w-[calc(100vw-128px)]"
    >
      {(props.onGlobalFilterChange || props.bulkActions || props.enableColumnVisibility) && (
        <div className="flex items-center justify-between gap-2 pb-3">
          <div>
            {props.bulkActions && selectedCount > 0 ? (
              <CustomBulkActionsToolbar
                selectedCount={selectedCount}
                actions={props.bulkActions}
                onClearSelection={() => props.onSelectionChange?.([])}
              />
            ) : (
              props.onGlobalFilterChange && (
                <CustomSearchFilter
                  value={props.globalFilter}
                  onChange={props.onGlobalFilterChange}
                  placeholder={props.searchPlaceholder ?? t("Search")}
                  className="max-w-xs"
                />
              )
            )}
          </div>
          {props.enableColumnVisibility && (
            <CustomPopover
              isOpen={isColumnPopoverOpen}
              setIsOpen={setIsColumnPopoverOpen}
              ariaLabel={t("Columns")}
              trigger={
                <CustomButton
                  variant={ButtonVariant.outline}
                  startContent={<CustomAppIcon Icon={ColumnsIcon} size={16} />}
                >
                  {t("Columns")} ({visibleColumnKeys.length}/{props.columns.length})
                </CustomButton>
              }
            >
              <div className="w-[min(90vw,32rem)] overflow-hidden rounded-app border border-default bg-surface shadow-lg">
                <div className="flex items-center justify-between gap-3 border-b border-default px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">{t("Columns")}</span>
                  <CustomButton
                    variant={ButtonVariant.ghost}
                    size={CustomSize.sm}
                    className="h-7 px-2 text-xs"
                    isDisabled={visibleColumnKeys.length === props.columns.length}
                    onClick={() => setVisibleColumnKeys(props.columns.map((column) => String(column.key)))}
                  >
                    {t("ShowAll")}
                  </CustomButton>
                </div>
                <CustomCheckboxGroup
                  data={props.columns}
                  valueKey="key"
                  labelKey="label"
                  value={visibleColumnKeys}
                  onChange={setVisibleColumnKeys}
                  orientation={CheckboxOrientation.Horizontal}
                  className="max-h-72 overflow-y-auto p-3"
                />
              </div>
            </CustomPopover>
          )}
        </div>
      )}
      <div>{props.topContent}</div>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Table with selection"
          selectionMode={selectionMode}
          selectedKeys={selectedKeys}
          defaultSelectedKeys={defaultSelectedKeys}
          onSelectionChange={handleSelectionChange}
          sortDescriptor={sortDescriptor}
          onSortChange={handleSortChange}
          className={cn(
            props.isCompact && "[&_td]:py-1.5 [&_th]:py-1.5",
            props.noWrap && "[&_td]:text-nowrap [&_th]:text-nowrap",
          )}
        >
          <Table.Header
            className={cn(props.isHeaderSticky && "sticky top-0 z-10 bg-background")}
          >
            {selectionMode === TableSelectionModeEnum.Multiple && (
              <Table.Column className="w-12 pr-0">
                <Checkbox aria-label="Select all" slot="selection">
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
              </Table.Column>
            )}
            {visibleColumns.map((column) => (
              <Table.Column
                key={String(column.key)}
                allowsSorting={column.sortable}
                isRowHeader
              >
                {({ sortDirection }) => (
                  <div
                    onClick={() => {
                      if (column.sortable) {
                        setLastSortedColumnKey(String(column.key));
                      }
                    }}
                  >
                    <SortableColumnHeader sortDirection={sortDirection}>
                      {column.label}
                    </SortableColumnHeader>
                  </div>
                )}
              </Table.Column>
            ))}
          </Table.Header>
          {props.loading ? (
            <Table.Body
              items={Array.from({ length: 10 }, (_, i) => ({
                id: `tableskeleton-${i}`,
              }))}
            >
              {(item: { id: string }) => {
                const isDisabled = props.disabledKeys?.includes(
                  String(item.id),
                );
                return (
                  <Table.Row key={`table-skeleton-${item.id}`}>
                    {selectionMode === TableSelectionModeEnum.Multiple && (
                      <Table.Cell className="pr-0">
                        <Checkbox
                          aria-label="Select row"
                          slot="selection"
                          variant="secondary"
                          isDisabled={isDisabled}
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox>
                      </Table.Cell>
                    )}
                    <Table.Collection items={visibleColumns}>
                      {(column) => (
                        <Table.Cell key={String(column.key)} className="p-4">
                          <CustomSkeleton className={`rounded-app h-3 w-25`} />
                        </Table.Cell>
                      )}
                    </Table.Collection>
                  </Table.Row>
                );
              }}
            </Table.Body>
          ) : (
            <Table.Body
              renderEmptyState={() =>
                props.emptyText ? (
                  <CustomEmptyState
                    icon={ClipboardTextIcon}
                    title={props.emptyText ?? t("DataNotAvailable")}
                  />
                ) : (
                  <></>
                )
              }
              items={tableBodyItems}
            >
              {(item) => {
                const keyValue =
                  item[props.rowKey as keyof T] ?? "fallback-row";
                const itemIdValue = String(item[props.itemId as keyof T]);
                const isSelected =
                  selectedKeys instanceof Set && selectedKeys.has(itemIdValue);
                const isDisabled = props.disabledKeys?.includes(itemIdValue);

                return (
                  <Table.Row key={String(keyValue)} id={itemIdValue}>
                    {selectionMode === TableSelectionModeEnum.Multiple && (
                      <Table.Cell className="pr-0">
                        <Checkbox
                          aria-label={`Select item ${itemIdValue}`}
                          slot="selection"
                          variant="secondary"
                          isSelected={isSelected}
                          isDisabled={isDisabled}
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox>
                      </Table.Cell>
                    )}
                    <Table.Collection items={visibleColumns}>
                      {(column) => (
                        <Table.Cell key={String(column.key)}>
                          {props.renderCustomCell(item, column.key as keyof T)}
                        </Table.Cell>
                      )}
                    </Table.Collection>
                  </Table.Row>
                );
              }}
            </Table.Body>
          )}
        </Table.Content>
      </Table.ScrollContainer>
      {showPagination && <Table.Footer>{bottomContent}</Table.Footer>}
    </Table>
  );
};
