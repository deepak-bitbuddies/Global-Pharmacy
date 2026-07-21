"use client";
import { CustomColor } from "@/lib/types";
import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import {
  ClipboardEventHandler,
  FocusEvent,
  FocusEventHandler,
  ReactNode,
} from "react";

/**
 * Input type options for HTML input element
 * @enum {string}
 * @readonly
 * @description Defines the type of input to render
 * - text: Standard text input
 * - email: Email input with validation
 * - url: URL input
 * - password: Password input (masked characters)
 * - tel: Telephone number input
 * - search: Search input
 * - file: File upload input
 * - number: Numeric input
 * @example
 * // Usage examples
 * <CustomInput type={InputTypes.text} placeholder="Enter name" />
 * <CustomInput type={InputTypes.email} placeholder="email@example.com" />
 * <CustomInput type={InputTypes.password} placeholder="Enter password" />
 * <CustomInput type={InputTypes.number} placeholder="0" />
 */
export enum InputTypes {
  text = "text",
  email = "email",
  url = "url",
  password = "password",
  tel = "tel",
  number = "number",
}

/**
 * Props for CustomInput component
 * @interface CustomInputProps
 * @extends {InputProps}
 * @description A customizable input component built on HeroUI Input
 */
export type CustomInputProps = {
  /** Current value of the input field */
  value: string;
  /** Change event handler for the input */
  onChange: (value: string) => void;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Label text to display above/beside the input */
  label?: string;
  /** Accessible name when no visible `label` is rendered (required by React Aria whenever there's no connected `<Label>`) */
  ariaLabel?: string;
  /** Type of input (text, email, password, etc.). Default: InputTypes.text */
  type?: InputTypes;
  /** Content to display before the input (e.g., icon) */
  startContent?: ReactNode;
  /** Content to display after the input (e.g., icon, button) */
  endContent?: ReactNode;
  /** Color theme for the input */
  color?: CustomColor;
  /** Child elements to render inside the input */
  children?: ReactNode;
  /** Placeholder text to display when input is empty */
  placeholder?: string;
  /** Whether the field is required. Default: false */
  isRequired?: boolean;
  /** Whether the input is read-only. Default: false */
  isReadOnly?: boolean;
  /** Whether the input is disabled. Default: false */
  isDisabled?: boolean;
  /** Whether to show validation error state. Default: false */
  isInvalid?: boolean;
  /** Additional CSS classes for the input wrapper */
  className?: string;
  /** Helper text to display below the input */
  description?: string;
  /** Keyboard event handler for the input */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** OnBlur event handler for the input */
  onBlur?:
    | (FocusEventHandler<HTMLInputElement> &
        ((e: FocusEvent<HTMLInputElement, Element>) => void))
    | undefined;
  /** onFocus event handler for the input */
  onFocus?: FocusEventHandler<HTMLInputElement> &
    ((e: FocusEvent<HTMLInputElement, Element>) => void);
  onPaste?: ClipboardEventHandler<HTMLInputElement>;
  /** error message to display below input */
  errorMessage?: string;
  fullWidth?: boolean;
};

export const CustomInput = ({ ...props }: CustomInputProps) => {
  return (
    <TextField
      aria-label={!props.label ? (props.ariaLabel ?? props.placeholder) : undefined}
      isRequired={props.isRequired}
      isInvalid={props.isInvalid}
      isDisabled={props.isDisabled}
      onChange={props.onChange}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      fullWidth={props.fullWidth}
      isReadOnly={props.isReadOnly}
      variant={props.isDisabled || props.isReadOnly ? "secondary" : "primary"}
    >
      {props.label && <Label>{props.label}</Label>}

      <InputGroup
        className={`${props.isDisabled || props.isReadOnly ? "border-border" : "border-default"} rounded-app border-2`}
        fullWidth={props.fullWidth}
      >
        {props.startContent && (
          <InputGroup.Prefix>{props.startContent}</InputGroup.Prefix>
        )}
        <InputGroup.Input
          className={`rounded-app ${props.className} w-full`}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          type={props.type || InputTypes.text}
          placeholder={props.placeholder}
          onKeyDown={props.onKeyDown}
          onPaste={props.onPaste}
        />
        {props.endContent && (
          <InputGroup.Suffix className="p-0">
            {props.endContent}
          </InputGroup.Suffix>
        )}
      </InputGroup>
      {props.errorMessage ? (
        <FieldError>{props.errorMessage}</FieldError>
      ) : (
        props.description && <Description>{props.description}</Description>
      )}
    </TextField>
  );
};
