"use client";
import { ReactNode } from "react";
import { CustomText, TextVariant } from "../customText/customText";

type CustomSectionProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
};

export const CustomSection = ({
  children,
  title,
  description,
  className,
}: CustomSectionProps) => {
  return (
    <section className={`space-y-4 ${className ?? ""}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <CustomText variant={TextVariant.h5}>{title}</CustomText>}
          {description && (
            <CustomText variant={TextVariant.bodySm} className="text-muted-foreground">
              {description}
            </CustomText>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

type CustomContentContainerProps = {
  children: ReactNode;
  className?: string;
};

export const CustomContentContainer = ({
  children,
  className,
}: CustomContentContainerProps) => {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className ?? ""}`}>
      {children}
    </div>
  );
};
