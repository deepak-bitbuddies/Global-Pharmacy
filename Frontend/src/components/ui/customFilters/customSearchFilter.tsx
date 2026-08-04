"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { CustomInput } from "../customInput/customInput";

type CustomSearchFilterProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name for the search box. Falls back to `placeholder` when omitted. */
  ariaLabel?: string;
  debounceMs?: number;
  className?: string;
  /** Overrides the outer field-group's className entirely — see `CustomInput`'s `wrapperClassName`. */
  wrapperClassName?: string;
  /** Default: true. Set false when this needs to size to its own content instead (e.g. a compact chip inside a flex filter row). */
  fullWidth?: boolean;
};

export const CustomSearchFilter = ({
  value = "",
  onChange,
  placeholder = "Search",
  ariaLabel,
  debounceMs = 300,
  className,
  wrapperClassName,
  fullWidth = true,
}: CustomSearchFilterProps) => {
  const [inputValue, setInputValue] = useState(value);
  const debounced = useDebounce(inputValue, debounceMs);

  useEffect(() => {
    onChange(debounced);
    // Intentionally omit `onChange` — callers typically pass a fresh
    // function each render, and only `debounced` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <CustomInput
      value={inputValue}
      onChange={setInputValue}
      placeholder={placeholder}
      ariaLabel={ariaLabel ?? placeholder}
      startContent={<MagnifyingGlassIcon className="size-4" />}
      className={className}
      wrapperClassName={wrapperClassName}
      fullWidth={fullWidth}
    />
  );
};
