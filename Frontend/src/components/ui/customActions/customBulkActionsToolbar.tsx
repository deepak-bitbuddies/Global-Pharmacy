"use client";
import { CustomSize } from "@/lib/types";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ButtonVariant, CustomButton } from "../customButton/customButton";
import { CustomText, TextVariant } from "../customText/customText";

export type BulkAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  onClick: () => void;
};

type CustomBulkActionsToolbarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  className?: string;
};

export const CustomBulkActionsToolbar = ({
  selectedCount,
  actions,
  onClearSelection,
  className,
}: CustomBulkActionsToolbarProps) => {
  const t = useTranslations();

  if (selectedCount === 0) return null;

  return (
    <div
      className={`rounded-app border-default bg-muted-surface/50 flex flex-wrap items-center justify-between gap-3 border px-4 py-2 ${className ?? ""}`}
    >
      <CustomText variant={TextVariant.bodySm} className="font-medium">
        {selectedCount} selected
      </CustomText>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <CustomButton
            key={action.key}
            size={CustomSize.sm}
            variant={action.variant ?? ButtonVariant.secondary}
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </CustomButton>
        ))}
        <CustomButton size={CustomSize.sm} variant={ButtonVariant.ghost} onClick={onClearSelection}>
          {t("Close")}
        </CustomButton>
      </div>
    </div>
  );
};
