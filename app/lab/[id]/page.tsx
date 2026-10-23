import Link from 'next/link'
import { notFound } from 'next/navigation'
import LabView from '@/components/course/lab-view'
import { LABS, LAB_BY_ID } from '@/data/course/lessons'

export function generateStaticParams() {
  return LABS.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: LAB_BY_ID[id]?.title ?? 'Lab' }
}

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lab = LAB_BY_ID[id]
  if (!lab) notFound()
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
        <p className="eyebrow text-muted">
          <Link href="/plan" className="hover:text-ink">
            Week {lab.week}
          </Link>{' '}
          · Lab{lab.optional ? ' · optional' : ''}
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">{lab.title}</h1>
        <div className="panel mt-6 p-6">
          <LabView lab={lab} />
        </div>
      </div>
    </main>
  )
}
