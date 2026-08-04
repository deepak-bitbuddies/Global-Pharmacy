"use client"

import { ThemeProvider } from "next-themes"

import { QueryProvider } from "@/providers/query-provider"
import { CustomConfirmDialogProvider, CustomToastProvider } from "@/components/ui"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <CustomConfirmDialogProvider>
          {children}
          <CustomToastProvider placement="top end" />
        </CustomConfirmDialogProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
