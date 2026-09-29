"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ButtonType,
  ButtonVariant,
  CustomButton,
  CustomInput,
  customToast,
  InputTypes,
} from "@/components/ui"
import { z } from "zod"
import {
  EnvelopeSimpleIcon,
  LockKeyIcon,
  SparkleIcon,
} from "@phosphor-icons/react"

import { useAuthStore } from "@/providers"
import { SystemRoleCode } from "@/store/auth-store"
import { login } from "../api/auth-api"
import type { ApiErrorPayload } from "@/lib/axios"

// Dashboard ("/") is super_admin-only nav (see config/nav.ts) — a branch_user landing there right
// after login would hit a page their own sidebar doesn't even link to, so they get the one page
// that's always theirs instead.
const DEFAULT_LANDING_ROUTE = "/"
const BRANCH_USER_LANDING_ROUTE = "/import"

const DEMO_EMAIL = process.env.NEXT_PUBLIC_BRAND_DEMO_USERNAME ?? ''
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_BRAND_DEMO_PASSWORD ?? ''

const loginFormSchema = z.object({
  email: z.string().min(1, "emailRequired").email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export function LoginForm() {
  const t = useTranslations("Login")
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useAuthStore((state) => state.setUser)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: ({ user }) => {
      setUser(user)
      const defaultRoute = user.role === SystemRoleCode.BranchUser ? BRANCH_USER_LANDING_ROUTE : DEFAULT_LANDING_ROUTE
      router.push(searchParams.get("from") ?? defaultRoute)
    },
    onError: (error: ApiErrorPayload) => {
      customToast.danger(error.message || t("errorTitle"))
    },
  })

  const onSubmit = handleSubmit((values) => mutate(values))

  const handleUseDemoCredentials = () => {
    setValue("email", DEMO_EMAIL, { shouldValidate: true })
    setValue("password", DEMO_PASSWORD, { shouldValidate: true })
    onSubmit()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-5">
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <CustomInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label={t("email")}
              type={InputTypes.email}
              startContent={<EnvelopeSimpleIcon className="size-4" />}
              placeholder={t("emailPlaceholder")}
              isInvalid={fieldState.invalid}
              errorMessage={
                fieldState.error?.message ? t(`validation.${fieldState.error.message}`) : undefined
              }
              fullWidth
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <CustomInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label={t("password")}
              type={InputTypes.password}
              startContent={<LockKeyIcon className="size-4" />}
              placeholder={t("passwordPlaceholder")}
              isInvalid={fieldState.invalid}
              errorMessage={
                fieldState.error?.message ? t(`validation.${fieldState.error.message}`) : undefined
              }
              fullWidth
            />
          )}
        />

        <CustomButton
          type={ButtonType.submit}
          isDisabled={isSubmitting || isPending}
          loading={isPending}
          fullWidth
          className="h-11 rounded-xl"
        >
          {isPending ? t("submitting") : t("submit")}
        </CustomButton>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted-surface/50 p-4 text-sm">
        <p className="font-medium">{t("demoCredentialsTitle")}</p>
        <p className="text-muted-foreground">
          {DEMO_EMAIL} / {DEMO_PASSWORD}
        </p>
        <CustomButton
          type={ButtonType.button}
          variant={ButtonVariant.outline}
          className="mt-2 w-full"
          isDisabled={isSubmitting || isPending}
          onClick={handleUseDemoCredentials}
        >
          <SparkleIcon className="size-4" />
          {t("useDemoCredentials")}
        </CustomButton>
      </div>
    </form>
  )
}
