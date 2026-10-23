import Link from 'next/link'
import { notFound } from 'next/navigation'
import DemoEmbed from '@/components/demos/demo-embed'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { DEMOS, DEMO_BY_ID } from '@/lib/demos'

export function generateStaticParams() {
  return DEMOS.map((d) => ({ id: d.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: DEMO_BY_ID[id]?.title ?? 'Demo' }
}

/** One interactive demo: watch the code move, predict, step, try your own input. */
export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const demo = DEMO_BY_ID[id]
  if (!demo) notFound()
  const concept = CONCEPT_BY_ID[demo.concept]
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-10 sm:px-8">
        <p className="eyebrow text-muted">
          <Link href="/learn" className="hover:text-ink">
            Learn
          </Link>
          {concept ? (
            <>
              {' · '}
              <Link href={`/learn/${concept.id}`} className="hover:text-ink">
                {concept.title}
              </Link>
            </>
          ) : null}
          {' · Watch it move'}
        </p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">{demo.title}</h1>
        <p className="mt-1 max-w-[720px] text-[15px] text-ink-2">{demo.summary}</p>
        <div className="mt-6">
          <DemoEmbed id={demo.id} />
        </div>
      </div>
    </main>
  )
}
