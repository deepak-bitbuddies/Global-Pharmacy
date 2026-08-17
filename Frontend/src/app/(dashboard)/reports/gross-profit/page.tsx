import { Suspense } from "react"

import { CustomSpinner } from "@/components/ui"
import { GrossProfitReportPage } from "@/modules/reports"

export default function Page() {
  return (
    <Suspense fallback={<CustomSpinner />}>
      <GrossProfitReportPage />
    </Suspense>
  )
}
