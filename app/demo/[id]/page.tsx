import Link from 'next/link'
import { notFound } from 'next/navigation'
import BrandMark from '@/components/brand-mark'
import DemoEmbed from '@/components/demos/demo-embed'
import LearnHero from '@/components/demos/learn-hero'
import { IconArrowLeft } from '@/components/icons'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { DEMOS, DEMO_BY_ID } from '@/lib/demos'

export function generateStaticParams() {
  return DEMOS.map((d) => ({ id: d.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: DEMO_BY_ID[id]?.title ?? 'Demo' }
}

/** One interactive demo: watch the code move, predict, step, try your own input. A focus page: slim bar, no app chrome. */
export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const demo = DEMO_BY_ID[id]
  if (!demo) notFound()
  const concept = CONCEPT_BY_ID[demo.concept]
  return (
    <main className="flex-1 bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center gap-3 px-5 sm:px-8">
          <Link href="/" className="font-display flex items-center gap-2 text-[19px] font-semibold tracking-tight" aria-label="Reps, today">
            <BrandMark size={22} /> Reps
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-line-strong" />
          <span className="truncate text-[13px] text-muted">Watch it move</span>
          <span className="ml-auto flex items-center gap-1">
            {concept && (
              <Link href={`/learn/${concept.id}`} className="hidden rounded-lg px-2.5 py-1.5 text-[13px] text-ink-2 hover:bg-surface sm:inline-block">
                The full guide
              </Link>
            )}
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-2">
              <IconArrowLeft size={13} /> Today
            </Link>
          </span>
        </div>
      </header>
      <LearnHero
        kind="Watch it move"
        crumbs={[{ href: '/learn', label: 'Learn' }, ...(concept ? [{ href: `/learn/${concept.id}`, label: concept.title }] : [])]}
        title={demo.title}
        sub={demo.summary}
        meta={
          <span className="rounded-full bg-white/70 px-2.5 py-1">Step through it · predict before each reveal · try your own input</span>
        }
      />
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-24 sm:px-8">
        <DemoEmbed id={demo.id} />
      </div>
    </main>
  )
}
