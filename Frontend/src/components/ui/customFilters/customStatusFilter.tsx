"use client";
import { CustomSelectFilter } from "./customSelectFilter";

export enum RecordStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Archived = "ARCHIVED",
}

type StatusOption = { id: RecordStatus; label: string };

const STATUS_OPTIONS: StatusOption[] = [
  { id: RecordStatus.Active, label: "Active" },
  { id: RecordStatus.Inactive, label: "Inactive" },
  { id: RecordStatus.Archived, label: "Archived" },
];

type CustomStatusFilterProps = {
  value?: RecordStatus;
  onChange: (value?: RecordStatus) => void;
  label?: string;
  className?: string;
};

export const CustomStatusFilter = ({
  value,
  onChange,
  label = "Status",
  className,
}: CustomStatusFilterProps) => {
  const selected = STATUS_OPTIONS.find((option) => option.id === value);

  return (
    <CustomSelectFilter<StatusOption>
      label={label}
      data={STATUS_OPTIONS}
      value={selected}
      onChange={(next) => onChange(next[0]?.id)}
      displayKey="label"
      idKey="id"
      placeholder="All statuses"
      className={className}
    />
  );
};
