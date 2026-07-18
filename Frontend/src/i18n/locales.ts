export const locales = ["en", "hi"] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = "en"
