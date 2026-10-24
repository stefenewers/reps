import { notFound } from 'next/navigation'
import LabView from '@/components/course/lab-view'
import LearnHero from '@/components/demos/learn-hero'
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
      <LearnHero
        kind="Lab"
        crumbs={[{ href: '/plan', label: `Week ${lab.week}` }]}
        title={lab.title}
        sub="A small, real program. Design it, build it against acceptance tests, change it when the requirements move, then review it."
        meta={
          <>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Design → build → change → review</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Done or not done · not counted as reps</span>
            {lab.optional && <span className="rounded-full bg-white/70 px-2.5 py-1">Optional this week</span>}
          </>
        }
      />
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-10 pb-24 sm:px-8">
        <LabView lab={lab} />
      </div>
    </main>
  )
}
