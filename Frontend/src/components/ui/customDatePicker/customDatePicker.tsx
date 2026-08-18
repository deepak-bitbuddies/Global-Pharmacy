"use client";

import {
  Calendar,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Label,
} from "@heroui/react";
import {
  getLocalTimeZone,
  parseDate,
  parseDateTime,
} from "@internationalized/date";
import { formatDate } from "@/utils/formatting";

const ReturnFormat = "YYYY-MM-DD";

type CustomDatePickerProps = {
  date?: string;
  onChange: (value?: string) => void;
  className?: string;
  isInvalid?: boolean;
  minDate?: string;
  maxDate?: string;
  errorMsg?: string;
  label?: string;
  /** Accessible name when no visible `label` is rendered. */
  ariaLabel?: string;
  description?: string;
};

export const CustomDatePicker = ({ ...props }: CustomDatePickerProps) => {
  // `date`/`onChange` both use YYYY-MM-DD (ReturnFormat below), matching every other date value
  // in the app (see CustomDateRangePicker) — no conversion needed, just pass it straight through.
  const isoDate = props.date || undefined;

  return (
    <DatePicker
      shouldForceLeadingZeros
      aria-label={!props.label ? (props.ariaLabel ?? "Date") : undefined}
      isInvalid={props.isInvalid}
      minValue={props.minDate ? parseDateTime(props.minDate) : undefined}
      maxValue={props.maxDate ? parseDateTime(props.maxDate) : undefined}
      value={isoDate ? parseDate(isoDate) : undefined}
      onChange={(value) => {
        if (value) {
          props.onChange(
            formatDate({
              date: value?.toDate(getLocalTimeZone()),
              returnFormat: ReturnFormat,
            }),
          );
        }
      }}
    >
      {props.label && <Label>{props.label}</Label>}
      <DateField.Group
        fullWidth
        className={"border-default bg-card rounded-app min-h-10 border-2"}
      >
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <FieldError>{props.errorMsg}</FieldError>
      <DatePicker.Popover>
        <>
          <Calendar aria-label="Event date">
            <Calendar.Header>
              <Calendar.YearPickerTrigger>
                <Calendar.YearPickerTriggerHeading />
                <Calendar.YearPickerTriggerIndicator />
              </Calendar.YearPickerTrigger>
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => <Calendar.Cell date={date} />}
              </Calendar.GridBody>
            </Calendar.Grid>
            <Calendar.YearPickerGrid>
              <Calendar.YearPickerGridBody>
                {({ year }) => <Calendar.YearPickerCell year={year} />}
              </Calendar.YearPickerGridBody>
            </Calendar.YearPickerGrid>
          </Calendar>
        </>
      </DatePicker.Popover>
      {props.description && <Description>{props.description}</Description>}
    </DatePicker>
  );
};
