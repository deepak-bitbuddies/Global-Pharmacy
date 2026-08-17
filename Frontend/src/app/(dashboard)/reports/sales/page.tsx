import { Suspense } from "react"

import { CustomSpinner } from "@/components/ui"
import { SalesReportPage } from "@/modules/reports"

export default function Page() {
  return (
    <Suspense fallback={<CustomSpinner />}>
      <SalesReportPage />
    </Suspense>
  )
}
