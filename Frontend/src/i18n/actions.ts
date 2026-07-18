"use server"

import { cookies } from "next/headers"

import { locales, type AppLocale } from "./locales"

const LOCALE_COOKIE = "locale"

export async function setLocale(locale: AppLocale) {
  if (!locales.includes(locale)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}
