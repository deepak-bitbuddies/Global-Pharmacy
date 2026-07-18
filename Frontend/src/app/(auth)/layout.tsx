export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_36%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent)_20%,transparent),transparent_32%)]" />
      <div className="relative flex w-full justify-center">
      {children}
      </div>
    </div>
  )
}
