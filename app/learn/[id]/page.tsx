import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConceptBody } from '@/components/concept-guide'
import { CONCEPTS, CONCEPT_BY_ID } from '@/data/concepts'

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: CONCEPT_BY_ID[id]?.title ?? 'Learn' }
}

/** One concept's full guide. */
export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = CONCEPT_BY_ID[id]
  if (!c) notFound()
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
        <p className="eyebrow text-muted">
          <Link href="/learn" className="hover:text-ink">
            Learn
          </Link>
          {c.pattern ? ` · ${c.pattern}` : ''}
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">{c.title}</h1>
        <div className="panel mt-6 p-6">
          <ConceptBody concept={c} full />
        </div>
      </div>
    </main>
  )
}
