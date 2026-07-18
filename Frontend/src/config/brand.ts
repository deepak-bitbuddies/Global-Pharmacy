import * as Icons from "@phosphor-icons/react/dist/ssr"

const iconName = process.env.NEXT_PUBLIC_BRAND_ICON ?? "CodeIcon"

export const brandName =
  process.env.NEXT_PUBLIC_BRAND_NAME ?? "Bit Buddies"

export const brandTitle =
  process.env.NEXT_PUBLIC_BRAND_TITLE ??
  "Building Digital Products That Scale."

export const brandDescription =
  process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
  "Sign in to access the Bit Buddies platform."

export const BrandIcon =
  (Icons[iconName as keyof typeof Icons] as typeof Icons.HeartbeatIcon) ??
  Icons.CodeIcon