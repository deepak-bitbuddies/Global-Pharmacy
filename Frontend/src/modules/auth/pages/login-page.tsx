import { getTranslations } from "next-intl/server"
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"

import { BrandIcon, brandName, brandTitle, brandDescription } from "@/config/brand"
import { LoginForm } from "../components/login-form"

export async function LoginPage() {
  const t = await getTranslations("Login")

  return (
    <main className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl shadow-primary/10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-155 overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-accent/60" />
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-primary-foreground/15" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full border border-primary-foreground/10" />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-10 place-items-center rounded-full bg-primary-foreground/15 backdrop-blur-sm">
            <BrandIcon weight="fill" className="size-6" />
          </span>
          {brandName}
        </div>

        <div className="relative my-auto max-w-sm space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide uppercase">
            <ShieldCheckIcon weight="fill" className="size-4" />
            Secure administration
          </span>
          <h2 className="text-4xl font-semibold tracking-tight">
            {brandTitle}
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/75">
            {brandDescription}
          </p>
        </div>

        <p className="relative text-sm text-primary-foreground/65">
          Protected workspace for authorized administrators.
        </p>
      </section>

      <section className="flex min-h-155 flex-col justify-center p-6 sm:p-10 lg:p-12">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BrandIcon weight="fill" className="size-6" />
          </span>
          <span className="font-semibold">{brandName}</span>
        </div>
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-primary">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>
        <LoginForm />
      </section>
    </main>
  )
}
