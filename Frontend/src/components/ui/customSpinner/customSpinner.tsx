"use client";
import { CustomSize } from "@/lib/types";
import { Spinner } from "@heroui/react";

type CustomSpinnerProps = {
  size?: CustomSize;
  className?: string;
};

export const CustomSpinner = (props: CustomSpinnerProps) => {
  return <Spinner size={props.size} className={props.className} />;
};
