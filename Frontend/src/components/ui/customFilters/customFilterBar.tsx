"use client";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ButtonVariant, CustomButton } from "../customButton/customButton";

type CustomFilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  className?: string;
};

export const CustomFilterBar = ({ children, onReset, className }: CustomFilterBarProps) => {
  const t = useTranslations();

  return (
    <div className={`grid grid-cols-1 items-center gap-3 sm:grid-cols-2 ${className ?? ""}`}>
      {children}
      {onReset && (
        <CustomButton variant={ButtonVariant.ghost} onClick={onReset}>
          {t("Reset")}
        </CustomButton>
      )}
    </div>
  );
};
