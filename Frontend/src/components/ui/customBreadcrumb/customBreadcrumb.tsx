"use client";
import { Breadcrumbs } from "@heroui/react";
import { ReactNode } from "react";

export type CustomBreadcrumbItem = {
  label: ReactNode;
  href?: string;
  onPress?: () => void;
};

type CustomBreadcrumbProps = {
  items: CustomBreadcrumbItem[];
  className?: string;
};

export const CustomBreadcrumb = ({ items, className }: CustomBreadcrumbProps) => {
  return (
    <Breadcrumbs className={className}>
      {items.map((item, index) => (
        <Breadcrumbs.Item key={index} href={item.href} onPress={item.onPress}>
          {item.label}
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  );
};
