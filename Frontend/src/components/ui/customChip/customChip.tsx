import { CustomColor, CustomSize } from "@/lib/types";
import { Chip, CloseButton } from "@heroui/react";
import { ReactNode } from "react";

/**
 * Chip variant options for CustomChip
 * @enum {string}
 * @readonly
 * @description Defines different visual styles for the chip
 * - Solid: Solid background with contrast text
 * - Bordered: Outlined chip with transparent background
 * - Light: Light background that darkens on hover
 * - Flat: Flat background without shadows
 * - Faded: Faded/muted appearance
 * - Shadow: Chip with shadow effect
 * - Dot: Chip with a dot indicator
 * @example
 * // Basic usage with different variants
 * <CustomChip variant={ChipVariant.Solid}>Solid</CustomChip>
 * <CustomChip variant={ChipVariant.Bordered}>Bordered</CustomChip>
 * <CustomChip variant={ChipVariant.Light}>Light</CustomChip>
 * <CustomChip variant={ChipVariant.Flat}>Flat</CustomChip>
 * <CustomChip variant={ChipVariant.Faded}>Faded</CustomChip>
 * <CustomChip variant={ChipVariant.Shadow}>Shadow</CustomChip>
 * <CustomChip variant={ChipVariant.Dot}>With Dot</CustomChip>
 * @example
 * // With color and size
 * <CustomChip
 *   variant={ChipVariant.Solid}
 *   color={CustomColor.primary}
 *   size={CustomSize.md}
 * >
 *   Primary Chip
 * </CustomChip>
 */
export enum ChipVariant {
  Primary = "primary",
  Secondary = "secondary",
  Tertiary = "tertiary",
  Soft = "soft",
}

/**
 * Props for CustomChip component
 * @interface CustomChipProps
 * @description A customizable chip component built on HeroUI Chip
 */
type CustomChipProps = {
  /** The content to display inside the chip */
  children?: ReactNode;
  /** Additional CSS classes to apply */
  className?: string;
  /** Color theme for the chip */
  color?: CustomColor;
  /** Size of the chip */
  size?: CustomSize;
  /** Visual variant of the chip */
  variant?: ChipVariant;
  /** Content to display before the chip text (e.g., icon) */
  startContent?: ReactNode;
  /** Content to display after the chip text (e.g., icon) */
  endContent?: ReactNode;
  /** Callback when close button is clicked */
  onClose?: () => void;
};

export const CustomChip = ({ ...props }: CustomChipProps) => {
  return (
    <Chip
      color={props.color}
      size={props.size}
      variant={props.variant}
      className={props.className}
    >
      {props.startContent}
      <Chip.Label>{props.children}</Chip.Label>
      {props.endContent}
      {props.onClose && <CloseButton onPress={props.onClose} />}
    </Chip>
  );
};
