"use client";
import { Toast, type ToastProviderProps } from "@heroui/react";

/**
 * Thin rename of HeroUI's imperative toast API so the app never imports
 * `@heroui/react` directly. Usage: `customToast.success("Saved")`,
 * `customToast.danger("Failed")`, `customToast.promise(promise, {...})`.
 */
export const customToast = Toast.toast;

export function CustomToastProvider(props: ToastProviderProps) {
  return <Toast.Provider {...props} />;
}
