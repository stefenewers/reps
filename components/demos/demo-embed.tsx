'use client'

import DemoPlayer from '@/components/demos/demo-player'
import { DEMO_VIEWS } from '@/components/demos/registry'
import { useReps } from '@/components/reps-provider'
import { DEMO_BY_ID } from '@/lib/demos'

/** Study state key: the date a demo was last watched to the end (a learning step on Today; never counted as a rep). */
export const demoKey = (id: string) => `demo:${id}`

export default function DemoEmbed({ id, compact = false }: { id: string; compact?: boolean }) {
  const { repo, today } = useReps()
  const demo = DEMO_BY_ID[id]
  const View = DEMO_VIEWS[id]
  if (!demo || !View) return null
  return <DemoPlayer demo={demo} View={View} compact={compact} onFinished={() => void repo.setState(demoKey(id), { watchedOn: today })} />
}
