"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { z } from "zod"
import {
  CircleNotchIcon,
  EnvelopeSimpleIcon,
  LockKeyIcon,
  SparkleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { useAuthStore } from "@/providers"
import { login } from "../api/auth-api"
import type { ApiErrorPayload } from "@/lib/axios"

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
      router.push(searchParams.get("from") ?? "/")
    },
    onError: (error: ApiErrorPayload) => {
      toast.error(t("errorTitle"), { description: error.message })
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
      <FieldSet>
        <FieldGroup>
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  <EnvelopeSimpleIcon className="size-4" />
                  {t("email")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[
                      {
                        message: fieldState.error?.message
                          ? t(`validation.${fieldState.error.message}`)
                          : undefined,
                      },
                    ]}
                  />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  <LockKeyIcon className="size-4" />
                  {t("password")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("passwordPlaceholder")}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[
                      {
                        message: fieldState.error?.message
                          ? t(`validation.${fieldState.error.message}`)
                          : undefined,
                      },
                    ]}
                  />
                )}
              </Field>
            )}
          />

          <Button type="submit" disabled={isSubmitting || isPending} className="h-11 w-full rounded-xl shadow-lg shadow-primary/20">
            {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </FieldGroup>
      </FieldSet>

      <div className="rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm">
        <p className="font-medium">{t("demoCredentialsTitle")}</p>
        <p className="text-muted-foreground">
          {DEMO_EMAIL} / {DEMO_PASSWORD}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          disabled={isSubmitting || isPending}
          onClick={handleUseDemoCredentials}
        >
          <SparkleIcon className="size-4" />
          {t("useDemoCredentials")}
        </Button>
      </div>
    </form>
  )
}
