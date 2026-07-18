import type { Metadata } from "next"
import { Figtree, Geist_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"

import { AppProviders, AuthStoreProvider } from "@/providers"
import { getSession } from "@/lib/auth/session"
import "./globals.css"

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Quick Commerce Admin Panel",
  description: "Production-ready Next.js admin panel foundation.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const user = await getSession()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider>
          <AppProviders>
            <AuthStoreProvider initialUser={user}>
              {children}
            </AuthStoreProvider>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
