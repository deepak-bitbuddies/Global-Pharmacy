import { Suspense } from "react"

import { CustomSpinner } from "@/components/ui"
import { StockReportPage } from "@/modules/reports"

export default function Page() {
  return (
    <Suspense fallback={<CustomSpinner />}>
      <StockReportPage />
    </Suspense>
  )
}
