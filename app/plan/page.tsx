import ClientOnly from '@/components/client-only'
import PlanView from '@/components/plan-view'

export const metadata = { title: 'Road to Ready' }

export default function PlanPage() {
  return <ClientOnly>
      <PlanView />
    </ClientOnly>
}
