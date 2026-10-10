import ClientOnly from '@/components/client-only'
import { Suspense } from 'react'
import SolveLogView from '@/components/solve-log-view'

export const metadata = { title: 'Solve log' }

export default function SolveLogPage() {
  // useSearchParams (the ?edit= link from the LeetCode list) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ClientOnly><SolveLogView /></ClientOnly>
    </Suspense>
  )
}
