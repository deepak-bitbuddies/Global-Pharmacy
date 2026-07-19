"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { CustomInput } from "../customInput/customInput";

type CustomSearchFilterProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

export const CustomSearchFilter = ({
  value = "",
  onChange,
  placeholder = "Search",
  debounceMs = 300,
  className,
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
      startContent={<MagnifyingGlassIcon className="size-4" />}
      className={className}
      fullWidth
    />
  );
};
