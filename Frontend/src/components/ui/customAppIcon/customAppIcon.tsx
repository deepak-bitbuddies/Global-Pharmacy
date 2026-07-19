"use client";
import { IconProps } from "@phosphor-icons/react";
import React from "react";
import { twMerge } from "tailwind-merge";

/**
 * Icon variant options for CustomAppIcon
 * @enum {string}
 * @readonly
 * @description Defines different visual styles for the icon button
 * - default: No additional styling, inline icon
 * - bordered: Bordered button with background, hover effect
 * - light: Light background on hover, transparent default
 * - flat: Flat background color, rounded corners
 * - ghost: Ghost button style with border, surface background
 * @example
 * // Basic usage with different variants
 * <CustomAppIcon Icon={AppIcons.Home} variant={IconVariant.default} />
 * <CustomAppIcon Icon={AppIcons.Settings} variant={IconVariant.bordered} />
 * <CustomAppIcon Icon={AppIcons.User} variant={IconVariant.light} />
 * <CustomAppIcon Icon={AppIcons.Star} variant={IconVariant.flat} />
 * <CustomAppIcon Icon={AppIcons.Bell} variant={IconVariant.ghost} />
 * @example
 * // With click handler and custom size
 * <CustomAppIcon
 *   Icon={AppIcons.Search}
 *   variant={IconVariant.bordered}
 *   size={24}
 *   onClick={() => console.log('clicked')}
 *   ariaLabel="Search"
 * />
 */
export enum IconVariant {
  /** No additional styling, renders as inline icon */
  default = "default",
  /** Bordered button style with background and hover effect */
  bordered = "bordered",
  /** Light background on hover, transparent by default */
  light = "light",
  /** Flat background color with rounded corners */
  flat = "flat",
  /** Ghost button style with border and surface background */
  ghost = "ghost",
}

/**
 * Icon weight options for Phosphor icons
 * @enum {string}
 * @readonly
 * @description Defines the visual thickness/style of the icon
 * - thin: Extra thin weight (1px stroke)
 * - light: Light weight (1.5px stroke)
 * - regular: Default weight (2px stroke)
 * - bold: Bold weight (2.5px stroke)
 * - fill: Filled/solid version of the icon
 * - duotone: Two-tone version with primary and secondary colors
 */
export enum IconWeight {
  thin = "thin",
  light = "light",
  regular = "regular",
  bold = "bold",
  fill = "fill",
  duotone = "duotone",
}

/**
 * Props for CustomAppIcon component
 * @interface CustomAppIconProps
 * @description A wrapper component for Phosphor icons with various styling options
 */
type CustomAppIconProps = {
  /** The Phosphor icon component to render (required) */
  Icon: React.ComponentType<IconProps>;
  /** Size of the icon in pixels. Default: 20 */
  size?: string | number;
  /** Color of the icon. Accepts any CSS color value. Default: "currentColor" */
  color?: string;
  /** Weight/style of the icon from IconWeight enum. Default: IconWeight.regular */
  weight?: IconWeight;
  /** Whether to horizontally flip the icon (useful for RTL layouts). Default: false */
  mirrored?: boolean;
  /** Alternative text for the icon (passed to img tag internally). Default: undefined */
  alt?: string;
  /** Visual variant of the icon button. Default: IconVariant.default */
  variant?: IconVariant;
  /** Additional CSS classes to apply to the icon container */
  className?: string;
  /** Click event handler for the icon button */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Accessibility label for screen readers. Default: undefined */
  ariaLabel?: string;
  iconClassName?: string;
};

const heroColorToCSS: Record<string, string> = {
  default: "var(--default)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const resolveColor = (color: string): string => heroColorToCSS[color] ?? color;

const variantToClass = (v?: IconVariant): string => {
  switch (v) {
    case IconVariant.bordered:
      return twMerge(
        "tap-highlight-transparent text-default-foreground outline",
        "outline-transparent rounded-app border-2 border-default bg-surface w-10 h-10 hover:opacity-85",
      );
    case IconVariant.light:
      return twMerge(
        "tap-highlight-transparent outline",
        "outline-transparent rounded-app bg-transparent text-default-foreground hover:bg-default-hover w-10 h-10",
      );
    case IconVariant.flat:
      return twMerge(
        "tap-highlight-transparent outline",
        "outline-transparent rounded-app bg-default/40 text-default-foreground w-10 h-10 hover:opacity-85",
      );
    case IconVariant.ghost:
      return twMerge(
        "tap-highlight-transparent text-default-foreground outline",
        "outline-transparent rounded-app border-2 border-default bg-surface w-10 h-10 hover:opacity-85 hover:bg-default",
      );

    default:
      return "";
  }
};

/**
 * CustomAppIcon component - A wrapper for Phosphor icons with various styling options
 * @component
 * @description Renders a clickable Phosphor icon with customizable variant, size, color, and weight
 * @example
 * // Basic usage
 * <CustomAppIcon Icon={AppIcons.Home} size={24} />
 *
 * @example
 * // With variant and click handler
 * <CustomAppIcon
 *   Icon={AppIcons.Settings}
 *   variant={IconVariant.bordered}
 *   size={24}
 *   onClick={() => console.log('clicked')}
 *   ariaLabel="Settings"
 * />
 */
export function CustomAppIcon({
  variant = IconVariant.default,
  size = 20,
  color = "currentColor",
  ...props
}: CustomAppIconProps) {
  const wrapperClass = twMerge(
    "inline-flex items-center justify-center",
    variantToClass(variant),
    !!props.onClick ? "cursor-pointer" : "",
    props.className,
  );

  return (
    <div
      aria-label={props.ariaLabel}
      onClick={props.onClick}
      className={wrapperClass}
    >
      <props.Icon
        size={size}
        color={resolveColor(color)}
        weight={props.weight}
        mirrored={props.mirrored}
        alt={props.alt}
        className={props.iconClassName}
      />
    </div>
  );
}
