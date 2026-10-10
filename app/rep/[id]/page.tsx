import { notFound } from 'next/navigation'
import RepWorkspace from '@/components/rep/rep-workspace'
import { EXERCISE_BY_ID } from '@/data/curriculum'

export const metadata = { title: 'Rep' }

export default async function RepPage({ params, searchParams }: PageProps<'/rep/[id]'>) {
  const { id } = await params
  // Authored reps are known on the server. Generated reps (gen-…) live only in the browser, so they pass through.
  const exerciseId = decodeURIComponent(id)
  if (!exerciseId.startsWith('gen-') && !EXERCISE_BY_ID[exerciseId]) notFound()
  const sp = await searchParams
  const s = typeof sp.s === 'string' ? sp.s : undefined
  const from = typeof sp.from === 'string' ? sp.from : undefined
  const mode = sp.mode === 'interview' || sp.mode === 'practice' || sp.mode === 'learn' ? sp.mode : undefined
  return <RepWorkspace exerciseId={exerciseId} sessionId={s} fromId={from} initialMode={mode} />
}
