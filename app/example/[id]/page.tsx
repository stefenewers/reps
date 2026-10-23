import Link from 'next/link'
import { notFound } from 'next/navigation'
import WorkedExampleView from '@/components/course/worked-example'
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
      <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
        <p className="eyebrow text-muted">
          <Link href="/plan" className="hover:text-ink">
            Week {unit?.week ?? ''}
          </Link>
          {unit ? ` · ${unit.title}` : ''} · Worked example
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">{ex.title}</h1>
        <div className="panel mt-6 p-6">
          <WorkedExampleView example={ex} />
        </div>
      </div>
    </main>
  )
}
