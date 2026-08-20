"use client";

import { Label, RangeCalendar } from "@heroui/react";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { formatDate } from "@/utils/formatting";
import { CustomPopover } from "../customPopover/customPopover";
import { CustomButton, ButtonVariant } from "../customButton/customButton";

const ReturnFormat = "YYYY-MM-DD";

export type CustomDateRange = {
  start?: string;
  end?: string;
};

type CustomDateRangePickerProps = {
  value?: CustomDateRange;
  onChange: (value?: CustomDateRange) => void;
  label?: string;
  placeholder?: string;
  className?: string;
};

export const CustomDateRangePicker = ({
  placeholder = "Select date range",
  ...props
}: CustomDateRangePickerProps) => {
  const rangeValue =
    props.value?.start && props.value?.end
      ? { start: parseDate(props.value.start), end: parseDate(props.value.end) }
      : null;

  const displayText =
    props.value?.start && props.value?.end
      ? `${props.value.start} – ${props.value.end}`
      : placeholder;

  return (
    <div className={props.className}>
      {props.label && <Label>{props.label}</Label>}
      <CustomPopover
        ariaLabel={props.label ?? "Date range"}
        trigger={
          <CustomButton
            variant={ButtonVariant.outline}
            fullWidth
            className="justify-start border-default bg-card font-normal shadow-field transition-colors hover:bg-card"
          >
            {displayText}
          </CustomButton>
        }
      >
        <RangeCalendar
          aria-label="Date range"
          value={rangeValue}
          onChange={(value) => {
            if (!value) {
              props.onChange(undefined);
              return;
            }
            props.onChange({
              start: formatDate({
                date: value.start.toDate(getLocalTimeZone()),
                returnFormat: ReturnFormat,
              }),
              end: formatDate({
                date: value.end.toDate(getLocalTimeZone()),
                returnFormat: ReturnFormat,
              }),
            });
          }}
        >
          <RangeCalendar.Header>
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </CustomPopover>
    </div>
  );
};
