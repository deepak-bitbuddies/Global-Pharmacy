"use client";
import { Card } from "@heroui/react";
import { ReactNode } from "react";

export enum CardVariant {
  default = "default",
  secondary = "secondary",
  tertiary = "tertiary",
  transparent = "transparent",
}

/**
 * Props for CustomButton component
 * @interface CustomButtonProps
 * @description A customizable button component built on HeroUI Button
 */
type Props = {
  /** The content to be displayed inside the button (required) */
  children: ReactNode;
  /** Additional CSS classes to apply to the button */
  className?: string;
  /** Click event handler for the button */
  onClick?: () => void;
  variant?: CardVariant;
};

export const CustomCard = ({
  variant = CardVariant.default,
  ...props
}: Props) => {
  return (
    <Card
      className={`rounded-app border border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md ${props.className ?? ""}`}
      onClick={props.onClick}
      variant={variant}
    >
      {props.children}
    </Card>
  );
};
