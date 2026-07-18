import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

import { defaultLocale, locales, type AppLocale } from "./locales"

const LOCALE_COOKIE = "locale"

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value

  const locale: AppLocale = locales.includes(cookieLocale as AppLocale)
    ? (cookieLocale as AppLocale)
    : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
