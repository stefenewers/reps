import ClientOnly from '@/components/client-only'
import PlanView from '@/components/plan-view'

export const metadata = { title: 'Plan' }

export default function PlanPage() {
  return <ClientOnly>
      <PlanView />
    </ClientOnly>
}
