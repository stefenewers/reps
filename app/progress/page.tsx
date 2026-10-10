import ClientOnly from '@/components/client-only'
import ProgressView from '@/components/progress-view'

export const metadata = { title: 'Progress' }

export default function ProgressPage() {
  return <ClientOnly>
      <ProgressView />
    </ClientOnly>
}
