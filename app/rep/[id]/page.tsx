import RepWorkspace from '@/components/rep/rep-workspace'

export const metadata = { title: 'Rep' }

export default async function RepPage({ params, searchParams }: PageProps<'/rep/[id]'>) {
  const { id } = await params
  const sp = await searchParams
  const s = typeof sp.s === 'string' ? sp.s : undefined
  const from = typeof sp.from === 'string' ? sp.from : undefined
  const mode = sp.mode === 'interview' || sp.mode === 'practice' || sp.mode === 'learn' ? sp.mode : undefined
  return <RepWorkspace exerciseId={decodeURIComponent(id)} sessionId={s} fromId={from} initialMode={mode} />
}
