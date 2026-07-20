"use client";
import { CustomColor, CustomSize } from "@/lib/types";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { ChipVariant, CustomChip } from "../customChip/customChip";
import { CustomDropdown } from "../customDropdown/customDropdown";

export type StatusColorMap<S extends string> = Record<S, CustomColor>;

/** Renders a status value as a `CustomChip`, for use inside `renderCustomCell`. */
export function renderStatusCell<S extends string>(
  status: S,
  colorMap: StatusColorMap<S>,
  labelMap?: Partial<Record<S, string>>,
): ReactNode {
  return (
    <CustomChip color={colorMap[status]} variant={ChipVariant.Soft} size={CustomSize.sm}>
      {labelMap?.[status] ?? status}
    </CustomChip>
  );
}

export type RowAction<T> = {
  key: string;
  label: string;
  onSelect: (item: T) => void;
};

/** Renders a row-level action dropdown, for use inside `renderCustomCell`. */
export function renderActionsCell<T extends object>(
  item: T,
  actions: RowAction<T>[],
): ReactNode {
  return (
    <CustomDropdown
      data={actions.map((action) => ({ id: action.key, label: action.label }))}
      itemKey="id"
      itemLabel="label"
      onSelectionChange={(keys) => {
        if (keys === "all") return;
        const key = Array.from(keys)[0];
        actions.find((action) => action.key === key)?.onSelect(item);
      }}
    >
      <CustomAppIcon Icon={DotsThreeVerticalIcon} className="cursor-pointer" ariaLabel="Row actions" />
    </CustomDropdown>
  );
}
