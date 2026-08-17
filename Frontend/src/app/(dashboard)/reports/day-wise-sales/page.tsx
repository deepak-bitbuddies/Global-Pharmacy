import { Suspense } from "react"

import { CustomSpinner } from "@/components/ui"
import { DaySalesReportPage } from "@/modules/reports"

export default function Page() {
  return (
    <Suspense fallback={<CustomSpinner />}>
      <DaySalesReportPage />
    </Suspense>
  )
}
