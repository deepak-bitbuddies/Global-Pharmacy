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
  /** Rendered before the label, e.g. `<PencilSimpleIcon className="size-4" />`. */
  icon?: ReactNode;
  /** Colors both icon and label for destructive actions (delete, reject, ...). Default: "default". */
  tone?: "default" | "danger";
  onSelect: (item: T) => void;
};

/** Renders a row-level action dropdown (three-dot trigger, icon + text per item), for use inside `renderCustomCell`. */
export function renderActionsCell<T extends object>(
  item: T,
  actions: RowAction<T>[],
): ReactNode {
  return (
    <CustomDropdown
      data={actions.map((action) => ({ id: action.key, label: action.label }))}
      itemKey="id"
      itemLabel="label"
      itemIcon={(row) => actions.find((a) => a.key === row.id)?.icon ?? null}
      itemClassName={(row) => (actions.find((a) => a.key === row.id)?.tone === "danger" ? "text-danger" : undefined)}
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
