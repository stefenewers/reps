import { notFound } from 'next/navigation'
import WorkedExampleView from '@/components/course/worked-example'
import LearnHero from '@/components/demos/learn-hero'
import { WORKED_EXAMPLES, WORKED_EXAMPLE_BY_ID } from '@/data/course/lessons'
import { UNIT_BY_ID } from '@/data/course/units'

export function generateStaticParams() {
  return WORKED_EXAMPLES.map((w) => ({ id: w.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: WORKED_EXAMPLE_BY_ID[id]?.title ?? 'Worked example' }
}

export default async function ExamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ex = WORKED_EXAMPLE_BY_ID[id]
  if (!ex) notFound()
  const unit = UNIT_BY_ID[ex.unitId]
  return (
    <main className="flex-1 bg-canvas">
      <LearnHero
        kind="Worked example"
        crumbs={[{ href: '/learn', label: 'Learn' }, ...(unit ? [{ href: '/plan', label: `Week ${unit.week} · ${unit.title}` }] : [])]}
        title={ex.title}
        sub="A complete solution, one goal at a time. Read each goal, then rebuild the whole thing from a blank editor."
        meta={
          <>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{ex.subgoals.length} goals</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Then: rebuild it yourself</span>
          </>
        }
      />
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-10 pb-24 sm:px-8">
        <WorkedExampleView example={ex} />
      </div>
    </main>
  )
}
