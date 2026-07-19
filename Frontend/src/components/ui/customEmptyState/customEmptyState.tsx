"use client";
import type { IconProps } from "@phosphor-icons/react";
import { EmptyState } from "@heroui/react";
import { ReactNode } from "react";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { CustomText, TextVariant } from "../customText/customText";

type CustomEmptyStateProps = {
  icon?: React.ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export const CustomEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: CustomEmptyStateProps) => {
  return (
    <EmptyState
      className={`flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-center ${className ?? ""}`}
    >
      {Icon && <CustomAppIcon Icon={Icon} size={32} className="text-muted-foreground" />}
      <CustomText variant={TextVariant.body} className="font-semibold">
        {title}
      </CustomText>
      {description && (
        <CustomText variant={TextVariant.bodySm} className="text-muted-foreground">
          {description}
        </CustomText>
      )}
      {action}
    </EmptyState>
  );
};
