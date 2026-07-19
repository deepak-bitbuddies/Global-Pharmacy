"use client";

import { ClipboardEventHandler, ReactNode } from "react";
import {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
  useController,
} from "react-hook-form";
import { CustomAutoComplete } from "../customAutoComplete/customAutoComplete";
import { SelectionModeEnum } from "../customDropdown/customDropdown";
import { CustomSelect } from "../customSelect/customSelect";
import { CustomInput, CustomInputProps } from "./customInput";

/**
 * Enum controlling which input component is rendered by FormInput.
 * @enum {string}
 * @readonly
 * @description
 * - `text`         — renders a plain `CustomInput` (default)
 * - `number`       — renders a `CustomInput` with number type
 * - `select`       — renders a `CustomSelect` dropdown
 * - `autocomplete` — renders a `CustomAutoComplete` searchable dropdown
 */
export enum FormInputType {
  text = "text",
  number = "number",
  select = "select",
  autocomplete = "autocomplete",
}

/**
 * Props for the FormInput component.
 *
 * @template TFieldValues - The react-hook-form field values shape
 * @template T - The item type used for select / autocomplete dropdowns
 *
 * All `CustomInputProps` except `value`, `onChange`, `onBlur`, `isInvalid`, and
 * `errorMessage` are available — those are wired up internally via `useController`.
 *
 * **Select-specific props** (required when `inputType === FormTextInputType.select`):
 * - `selectData` — array of items
 * - `selectDisplayKey` — property used as display label
 * - `selectIdKey` — property used as unique key
 * - `selectSelectionMode` — single or multiple (default: single)
 *
 * **Autocomplete-specific props** (required when `inputType === FormTextInputType.autocomplete`):
 * - `autocompleteItems` — flat array of items
 * - `autocompleteSections` — grouped items as `[sectionName, items][]`
 * - `autocompleteDisplayKey` — property used for display text
 * - `autocompleteIdKey` — property used as item identifier
 * - `autocompleteDefaultItem` — pre-selected item
 * - `autocompleteClearContent` — hide display text content when `true`
 * - `onAutocompleteSelection` — callback when items selected (always receives T[] array)
 * - `autocompleteStartContent` / `autocompleteEndContent` — slot content
 * - `autocompleteSelectionMode` — single or multiple selection (default: single)
 * - `autocompleteShowSelectAll` — show "Select All" option in multi-select mode (default: true)
 *
 * **Note:** Form field values are automatically converted:
 * - Single-select: Stores single item T, internally converted to T[] for component
 * - Multi-select: Stores array T[], passed directly to component
 */
type FormInputProps<
  TFieldValues extends FieldValues,
  T extends object = Record<string, unknown>,
> = Omit<
  CustomInputProps,
  "value" | "onChange" | "onBlur" | "isInvalid" | "errorMessage"
> & {
  /** React Hook Form `control` object from `useForm` */
  control: Control<TFieldValues>;
  /** Field name in the form; supports dot-notation for nested fields */
  name: FieldPath<TFieldValues>;
  /** Validation rules forwarded to `useController` */
  rules?: RegisterOptions<TFieldValues>;
  /**
   * Controls which input component is rendered.
   * @default FormTextInputType.text
   */
  inputType?: FormInputType;

  // ─── Select props ────────────────────────────────────────────────────────────
  /** Items to display in the select dropdown */
  selectData?: T[];
  /** Property key used for display text in select items */
  selectDisplayKey?: keyof T;
  /** Property key used as unique identifier in select items */
  selectIdKey?: keyof T;
  /** Allow single or multiple selection. @default SelectionModeEnum.single */
  selectSelectionMode?: SelectionModeEnum;
  /** Show "Select All" option in multiple mode. @default false */
  selectShowAll?: boolean;
  showClear?: boolean;

  // ─── Autocomplete props ──────────────────────────────────────────────────────
  /** Flat array of items for the autocomplete dropdown */
  autocompleteItems?: T[];
  /** Grouped items as `[sectionName, items][]` */
  autocompleteSections?: [string, T[]][];
  /** Property key used for display text in autocomplete items */
  autocompleteDisplayKey?: keyof T;
  /** Property key used as the item identifier in autocomplete */
  autocompleteIdKey?: keyof T;
  /** Item pre-selected when the component first renders */
  autocompleteDefaultItem?: T;
  /**
   * When `true`, hides the item label text in the autocomplete list.
   * @default false
   */
  autocompleteClearContent?: boolean;
  /** Callback fired when the user selects autocomplete items (always array) */
  onAutocompleteSelection?: (items: T[]) => void;
  /** Content rendered before the autocomplete input (e.g. a search icon) */
  autocompleteStartContent?: ReactNode;
  /** Content rendered after the autocomplete input (e.g. a clear button) */
  autocompleteEndContent?: ReactNode;
  /** Selection mode for autocomplete - single or multiple. @default SelectionModeEnum.single */
  autocompleteSelectionMode?: SelectionModeEnum;
  /** Show "Select All" option in autocomplete multi-select mode. @default true */
  autocompleteShowSelectAll?: boolean;
  /** Custom render function for autocomplete dropdown items */
  autocompleteRenderItem?: (item: T) => ReactNode;
  /** Custom render function for autocomplete selected value(s) */
  autocompleteRenderValue?: (item: T) => ReactNode;

  onPaste?: ClipboardEventHandler<HTMLInputElement>;
};

/**
 * FormInput Component
 *
 * A polymorphic, form-integrated input that delegates to:
 * - **`CustomInput`** — for `text` / `number` (default)
 * - **`CustomSelect`** — for `select`
 * - **`CustomAutoComplete`** — for `autocomplete`
 *
 * The active component is chosen via the `inputType` prop.
 * All three variants are wired to **react-hook-form** through `useController` so
 * validation, error messages, and controlled value state are handled automatically.
 *
 * @component
 * @template TFieldValues - react-hook-form field values shape
 * @template T - item type for select / autocomplete dropdowns
 *
 * @example
 * // ── Text / number input (default) ──────────────────────────────────────────
 * const { control } = useForm<{ email: string }>();
 *
 * <FormInput
 *   control={control}
 *   name="email"
 *   label="Email"
 *   type={InputTypes.email}
 *   placeholder="you@example.com"
 *   rules={{ required: "Email is required" }}
 * />
 *
 * @example
 * // ── Select dropdown ────────────────────────────────────────────────────────
 * interface Env { id: string; label: string }
 * const envOptions: Env[] = [
 *   { id: "dev",  label: "Development" },
 *   { id: "prod", label: "Production"  },
 * ];
 * const { control } = useForm<{ env: string }>();
 *
 * <FormInput<{ env: string }, Env>
 *   control={control}
 *   name="env"
 *   label="Environment"
 *   inputType={FormInputType.select}
 *   selectData={envOptions}
 *   selectIdKey="id"
 *   selectDisplayKey="label"
 *   placeholder="Pick an environment"
 *   rules={{ required: "Environment is required" }}
 * />
 *
 * @example
 * // ── Autocomplete ──────────────────────────────────────────────────────────
 * interface User { userId: number; fullName: string }
 * const users: User[] = [
 *   { userId: 1, fullName: "Alice" },
 *   { userId: 2, fullName: "Bob"   },
 * ];
 * const { control } = useForm<{ assignee: string }>();
 *
 * <FormInput<{ assignee: string }, User>
 *   control={control}
 *   name="assignee"
 *   inputType={FormTextInputType.autocomplete}
 *   autocompleteItems={users}
 *   autocompleteDisplayKey="fullName"
 *   autocompleteIdKey="userId"
 *   placeholder="Search users…"
 *   onAutocompleteSelection={(user) => console.log("selected", user)}
 * />
 *
 * @example
 * // ── Autocomplete with sections ────────────────────────────────────────────
 * <FormInput<FormData, User>
 *   control={control}
 *   name="assignee"
 *   inputType={FormTextInputType.autocomplete}
 *   autocompleteSections={[
 *     ["Admins", adminUsers],
 *     ["Members", memberUsers],
 *   ]}
 *   autocompleteDisplayKey="fullName"
 *   autocompleteIdKey="userId"
 * />
 *
 * @example
 * // ── Autocomplete with multi-select ────────────────────────────────────────
 * // Form field stores T[] for multi-select
 * const schema = z.object({ assignees: z.array(z.object({...})) });
 * <FormInput<FormData, User>
 *   control={control}
 *   name="assignees"
 *   inputType={FormTextInputType.autocomplete}
 *   autocompleteItems={users}
 *   autocompleteDisplayKey="fullName"
 *   autocompleteIdKey="userId"
 *   autocompleteSelectionMode={SelectionModeEnum.multiple}
 *   autocompleteShowSelectAll={true}
 *   placeholder="Select multiple users…"
 *   onAutocompleteSelection={(users) => console.log("Selected:", users)}
 * />
 *
 * @remarks
 * - Uses react-hook-form's `useController` for form state integration
 * - Automatically wires `value`, `onChange`, `onBlur`, `isInvalid`, and `errorMessage`
 * - Memoized with `React.memo` to prevent unnecessary re-renders
 * - Select `value` / `onChange` are forwarded directly to `CustomSelect`
 * - Autocomplete `inputValue` / `onInputChange` are forwarded to `CustomAutoComplete`
 * - Validation errors are displayed below the field for all input types
 *
 * @see {@link CustomInput}
 * @see {@link CustomSelect}
 * @see {@link CustomAutoComplete}
 * @see {@link https://react-hook-form.com/docs/usecontroller | React Hook Form useController}
 */
export function FormInput<
  TFieldValues extends FieldValues,
  T extends object = Record<string, unknown>,
>({
  control,
  name,
  rules,
  inputType = FormInputType.text,
  // select
  selectData,
  selectDisplayKey,
  selectIdKey,
  selectSelectionMode,
  selectShowAll,
  // autocomplete
  autocompleteItems,
  autocompleteSections,
  autocompleteDisplayKey,
  autocompleteIdKey,
  autocompleteDefaultItem,
  autocompleteClearContent,
  onAutocompleteSelection,
  autocompleteStartContent,
  autocompleteEndContent,
  autocompleteSelectionMode,
  autocompleteShowSelectAll,
  autocompleteRenderItem,
  autocompleteRenderValue,
  ...props
}: FormInputProps<TFieldValues, T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error, invalid },
  } = useController({ control, name, rules });

  if (inputType === FormInputType.select) {
    // Always convert form value to array for CustomSelect

    return (
      <CustomSelect
        data={selectData ?? []}
        value={value}
        onChange={onChange}
        displayKey={selectDisplayKey!}
        idKey={selectIdKey!}
        selectionMode={selectSelectionMode}
        showSelectAll={selectShowAll}
        showClear={props.showClear}
        label={props.label}
        placeholder={props.placeholder}
        className={props.className}
        isRequired={props.isRequired}
        description={props.description}
        disabled={props.isDisabled}
        fullWidth={props.fullWidth}
        isInvalid={invalid}
        errorMsg={error?.message}
      />
    );
  }

  if (inputType === FormInputType.autocomplete) {
    return (
      <CustomAutoComplete<T>
        itemsData={autocompleteItems || []}
        sectionsData={autocompleteSections}
        displayKey={autocompleteDisplayKey!}
        idKey={autocompleteIdKey!}
        value={value}
        onChange={(items) => {
          onChange(items);
        }}
        defaultSelectedItem={autocompleteDefaultItem}
        clearContent={autocompleteClearContent}
        onSelection={onAutocompleteSelection}
        startContent={autocompleteStartContent}
        endContent={autocompleteEndContent}
        placeholder={props.placeholder}
        label={props.label}
        isRequired={props.isRequired}
        description={props.description}
        selectionMode={autocompleteSelectionMode}
        showSelectAllOption={autocompleteShowSelectAll}
        fullWidth={props.fullWidth}
        isInvalid={invalid}
        errorMsg={error?.message}
        renderItem={autocompleteRenderItem}
        renderValue={autocompleteRenderValue}
        showClearButton={props.showClear}
      />
    );
  }

  return (
    <CustomInput
      {...props}
      value={value ?? ""}
      onChange={onChange}
      onBlur={onBlur}
      isInvalid={!!error}
      errorMessage={error?.message}
    />
  );
}
