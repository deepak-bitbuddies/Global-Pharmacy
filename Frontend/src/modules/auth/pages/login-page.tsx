import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"

import { brandLogoIcon, brandLogoIconHeight, brandLogoIconWidth, brandName, brandTitle, brandDescription, brandLogo } from "@/config/brand"
import { LoginForm } from "../components/login-form"

export async function LoginPage() {
  const t = await getTranslations("Login")

  return (
    <main className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl shadow-primary/10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-155 overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-accent/60" />
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-primary-foreground/15" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full border border-primary-foreground/10" />
        <div className="relative flex w-full justify-start">
          <span className="inline-flex items-center rounded-2xl bg-white p-2 shadow-lg shadow-black/10">
            <Image
              src={brandLogo}
              alt={brandName}
              width={brandLogoIconWidth}
              height={brandLogoIconHeight}
              className="h-12 w-auto"
              priority
            />
          </span>
        </div>

        <div className="relative my-auto max-w-sm space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide uppercase">
            <ShieldCheckIcon weight="fill" className="size-4" />
            {t("secureAdmin")}
          </span>
          <h2 className="text-4xl font-semibold tracking-tight">
            {brandTitle}
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/75">
            {brandDescription}
          </p>
        </div>

        <p className="relative text-sm text-primary-foreground/65">
          {t("protectedWorkspace")}
        </p>
      </section>

      <section className="flex min-h-155 flex-col justify-center p-6 sm:p-10 lg:p-12">
        <div className="mb-10 flex items-center lg:hidden">
          <Image
            src={brandLogo}
            alt={brandName}
            width={brandLogoIconWidth}
            height={brandLogoIconHeight}
            className="h-16 w-auto"
            priority
          />
        </div>
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-primary">{t("welcomeBack")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>
        <LoginForm />
      </section>
    </main>
  )
}
