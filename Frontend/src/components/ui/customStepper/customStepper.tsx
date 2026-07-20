"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { CustomAppIcon } from "../customAppIcon/customAppIcon";
import { CustomText, TextVariant } from "../customText/customText";

export enum StepperEnum {
  Pending = "Pending",
  InProgress = "In Progress",
  Completed = "Completed",
}

export type StepperDataType = {
  label: string;
  subLabel: string;
  status: StepperEnum;
};

export type CustomStepperProps = {
  data: StepperDataType[];
  handleStepperItemCLick?: (item: StepperDataType, index: number) => void;
};

export type StepperButtonProps = {
  item: StepperDataType;
  index: number;
};

export const CustomStepper = ({ data, ...props }: CustomStepperProps) => {
  return (
    <div className="scrollbar-hide flex min-h-fit w-[calc(100dvw-32px)] items-center gap-2 overflow-auto py-2 md:w-full md:gap-3">
      {data.map((item, index) => {
        return (
          <div
            key={`stepper-${index}`}
            className="flex grow cursor-pointer items-center gap-2 md:gap-3"
          >
            <div
              onClick={() =>
                props?.handleStepperItemCLick &&
                props?.handleStepperItemCLick(item, index)
              }
              key={`step-${index}`}
              className="flex items-center gap-2"
            >
              <StepperButton key={index} item={item} index={index} />
              <div className="flex flex-col items-start justify-between">
                <CustomText
                  variant={TextVariant.bodySm}
                  className="font-semibold text-nowrap"
                >
                  {item.label}
                </CustomText>
                {item.subLabel && (
                  <CustomText
                    variant={TextVariant.bodyXs}
                    className="line-clamp-1 truncate text-nowrap"
                  >
                    {item.subLabel}
                  </CustomText>
                )}
              </div>
            </div>

            {data.length - 1 !== index && (
              <span
                key={`stepper-line-${index}`}
                className={`bg-default-hover h-1 min-h-1 min-w-10 grow rounded-full duration-300`}
              >
                <span
                  className={`bg-success flex h-full min-h-full rounded-full ${item.status == StepperEnum.Completed ? "w-full" : "w-0"} duration-300`}
                ></span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StepperButton = ({ item, index }: StepperButtonProps) => {
  if (item.status === StepperEnum.Pending) {
    return (
      <span className="bg-default text-foreground flex h-9 min-h-9 w-9 min-w-9 items-center justify-center rounded-full text-sm font-semibold transition-all">
        {index + 1}
      </span>
    );
  }

  if (item.status === StepperEnum.InProgress) {
    return (
      <span className="bg-accent text-accent-foreground shadow-primary/30 flex h-9 min-h-9 w-9 min-w-9 items-center justify-center rounded-full text-sm font-semibold shadow-md transition-all">
        {index + 1}
      </span>
    );
  }

  return (
    <span className="bg-success text-success-foreground flex h-9 min-h-9 w-9 min-w-9 items-center justify-center rounded-full text-sm font-semibold transition-all">
      <CustomAppIcon Icon={CheckIcon} color={"white"} />
    </span>
  );
};
