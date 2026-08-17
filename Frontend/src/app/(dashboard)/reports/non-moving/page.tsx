import { Suspense } from "react"

import { CustomSpinner } from "@/components/ui"
import { NonMovingReportPage } from "@/modules/reports"

export default function Page() {
  return (
    <Suspense fallback={<CustomSpinner />}>
      <NonMovingReportPage />
    </Suspense>
  )
}
