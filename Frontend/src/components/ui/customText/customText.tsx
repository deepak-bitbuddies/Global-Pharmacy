import { Typography } from "@heroui/react";
import { ReactNode } from "react";

export enum TextVariant {
  h1 = "h1",
  h2 = "h2",
  h3 = "h3",
  h4 = "h4",
  h5 = "h5",
  h6 = "h6",
  body = "body",
  bodySm = "body-sm",
  bodyXs = "body-xs",
  code = "code",
}

export enum TextWeight {
  normal = "normal",
  medium = "medium",
  semibold = "semibold",
  bold = "bold",
}

type TextProps = {
  children: ReactNode;
  variant?: TextVariant;
  className?: string;
  weight?: TextWeight;
  onClick?: () => void;
};

export const CustomText = ({
  variant = TextVariant.body,
  ...props
}: TextProps) => {
  return (
    <Typography type={variant} className={props.className} {...props}>
      {props.children}
    </Typography>
  );
};
