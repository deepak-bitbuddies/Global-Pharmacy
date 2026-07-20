"use client";
import { ReactNode } from "react";
import {
  CustomBreadcrumb,
  CustomBreadcrumbItem,
} from "../customBreadcrumb/customBreadcrumb";
import { CustomText, TextVariant, TextWeight } from "../customText/customText";

type CustomPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: CustomBreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
};

export const CustomPageHeader = ({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: CustomPageHeaderProps) => {
  return (
    <div
      className={`flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div className="space-y-0.5">
        {breadcrumb && breadcrumb.length > 0 && (
          <CustomBreadcrumb items={breadcrumb} />
        )}
        <CustomText variant={TextVariant.h5} weight={TextWeight.semibold} className="tracking-tight">
          {title}
        </CustomText>
        {description && (
          <CustomText variant={TextVariant.bodyXs} className="text-muted-foreground">
            {description}
          </CustomText>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
