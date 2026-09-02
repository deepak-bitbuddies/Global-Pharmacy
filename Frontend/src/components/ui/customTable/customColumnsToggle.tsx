"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ColumnsIcon } from "@phosphor-icons/react";

import { CustomSize } from "@/lib/types";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { ButtonVariant, CustomButton } from "../customButton/customButton";
import { CustomCheckbox, CustomCheckboxVariant } from "../customCheckboxGroup/customCheckbox";
import { CustomPopover } from "../customPopover/customPopover";
import type { TableHeaderColumn } from "./customTable";

type CustomColumnsToggleProps<T> = {
  /** Every column the table could show — the same array passed to `CustomTable`'s own `columns` prop. */
  columns: TableHeaderColumn<T>[];
  /** Keys currently shown — filter `columns` by this before passing them to `CustomTable`. */
  visibleKeys: string[];
  onChange: (keys: string[]) => void;
};

/**
 * Standalone "which columns to show" toggle — deliberately NOT rendered inside `CustomTable`
 * itself, so a page can place it wherever its own filter bar needs (e.g. beside a "Filters"
 * button) instead of being pinned to the table's own toolbar. The page owns `visibleKeys` and is
 * responsible for filtering the `columns` array it hands to `CustomTable` accordingly.
 *
 * Laid out as a fixed 2–3 column CSS grid (not a `flex-wrap`, which is what made an earlier
 * version of this ragged) — every cell is the same width so a long list of columns with uneven
 * label lengths still lines up into clean rows instead of wrapping unevenly.
 */
export function CustomColumnsToggle<T extends object>({ columns, visibleKeys, onChange }: CustomColumnsToggleProps<T>) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  // A table with zero visible columns is a meaningless state — always leave at least one checked,
  // same reasoning `ShowAll`'s counterpart uses (kept as a "hide down to one" action, not to zero).
  const toggle = (key: string, checked: boolean) => {
    if (!checked && visibleKeys.length <= 1) return;
    onChange(checked ? [...visibleKeys, key] : visibleKeys.filter((existing) => existing !== key));
  };

  return (
    <CustomPopover
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      ariaLabel={t("Columns")}
      trigger={
        <CustomButton variant={ButtonVariant.outline} startContent={<CustomAppIcon Icon={ColumnsIcon} size={16} />}>
          {t("Columns")}
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
            {visibleKeys.length}/{columns.length}
          </span>
        </CustomButton>
      }
    >
      <div className="w-[min(92vw,34rem)] overflow-hidden rounded-xl border border-default bg-surface shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-default px-3.5 py-3">
          <span className="text-sm font-semibold text-foreground">{t("Columns")}</span>
          <div className="flex items-center gap-1">
            <CustomButton
              variant={ButtonVariant.ghost}
              size={CustomSize.sm}
              className="h-7 px-2 text-xs font-medium text-primary hover:text-primary"
              isDisabled={visibleKeys.length === columns.length}
              onClick={() => onChange(columns.map((column) => String(column.key)))}
            >
              {t("ShowAll")}
            </CustomButton>
            <CustomButton
              variant={ButtonVariant.ghost}
              size={CustomSize.sm}
              className="h-7 px-2 text-xs font-medium text-muted-foreground"
              isDisabled={visibleKeys.length <= 1}
              onClick={() => onChange(columns.length > 0 ? [String(columns[0].key)] : [])}
            >
              {t("HideAll")}
            </CustomButton>
          </div>
        </div>

        <div className="grid max-h-80 grid-cols-2 gap-x-1 gap-y-0.5 overflow-y-auto p-1.5 sm:grid-cols-3">
          {columns.map((column) => {
            const key = String(column.key);
            const isChecked = visibleKeys.includes(key);
            const isLastChecked = isChecked && visibleKeys.length <= 1;
            return (
              <CustomCheckbox
                key={key}
                value={key}
                label={column.label}
                isSelected={isChecked}
                isDisabled={isLastChecked}
                setIsSelected={(next) => toggle(key, next)}
                variant={CustomCheckboxVariant.Primary}
                className="min-w-0 flex-row items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted-surface"
                controlClassName="rounded-sm before:rounded-sm"
                labelClassName="min-w-0 flex-1 truncate text-sm font-normal text-foreground"
              />
            );
          })}
        </div>
      </div>
    </CustomPopover>
  );
}
