"use client";
import { CustomSize } from "@/lib/types";
import { Button } from "@heroui/react";
import { ReactNode } from "react";
import { CustomSpinner } from "../customSpinner/customSpinner";

export enum ButtonVariant {
  primary = "primary",
  secondary = "secondary",
  tertiary = "tertiary",
  outline = "outline",
  danger = "danger",
  dangerSoft = "danger-soft",
  ghost = "ghost",
}

export enum ButtonType {
  submit = "submit",
  reset = "reset",
  button = "button",
}

type CustomButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: CustomSize;
  type?: ButtonType;
  fullWidth?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  startContent?: ReactNode;
  endContent?: ReactNode;
  isIconOnly?: boolean;
  loading?: boolean;
};

export const CustomButton = ({
  isDisabled = false,
  type = ButtonType.button,
  size = CustomSize.md,
  variant = ButtonVariant.primary,
  ...props
}: CustomButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={props.fullWidth}
      isDisabled={isDisabled}
      className={`rounded-app ${props.className ?? ""}`}
      onClick={props.onClick}
      type={type}
      isIconOnly={props.isIconOnly}
      isPending={props.loading}
    >
      {({ isPending }) => (
        <>
          {isPending ? (
            <CustomSpinner
              size={CustomSize.sm}
              className={
                variant == ButtonVariant.primary ||
                variant == ButtonVariant.danger
                  ? "text-surface"
                  : "text-foreground"
              }
            />
          ) : null}
          {props.startContent}
          {props.children}
          {props.endContent}
        </>
      )}
    </Button>
  );
};
