"use client";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ButtonVariant, CustomButton } from "../customButton/customButton";

/**
 * Shared crisp/minimal chrome for every toolbar filter control (select, search, date range) — thin
 * border, subtle fill, gentle hover — so they read as one consistent filter bar instead of full
 * form fields. `min-w-40` is a fixed size (not a percentage) so each chip sizes itself correctly
 * inside `CustomFilterBar`'s flex-wrap row, regardless of that row's own width.
 */
export const FILTER_TRIGGER_CLASSNAME =
  "border-default rounded-app border bg-muted-surface/30 transition-colors hover:bg-muted-surface/60 min-w-56";

type CustomFilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  className?: string;
};

/** A row of compact filter chips (each sized to its own content, not stretched into equal grid columns) with a small text reset action — crisper and more minimal than a full-width form grid. */
export const CustomFilterBar = ({ children, onReset, className }: CustomFilterBarProps) => {
  const t = useTranslations();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {children}
      {onReset && (
        <CustomButton variant={ButtonVariant.ghost} className="h-9 px-3 text-sm" onClick={onReset}>
          {t("Reset")}
        </CustomButton>
      )}
    </div>
  );
};
