import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConceptBody } from '@/components/concept-guide'
import LessonBody from '@/components/course/lesson-body'
import { CONCEPTS, CONCEPT_BY_ID } from '@/data/concepts'
import { LESSONS, LESSON_BY_ID, WORKED_EXAMPLES } from '@/data/course/lessons'
import { UNITS } from '@/data/course/units'
import { SECTION_BY_ID } from '@/data/course'

export function generateStaticParams() {
  return [...LESSONS.map((l) => ({ id: l.id })), ...CONCEPTS.map((c) => ({ id: c.id }))]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: LESSON_BY_ID[id]?.title ?? CONCEPT_BY_ID[id]?.title ?? 'Learn' }
}

/** After a lesson: the unit's worked example, then its first rep. */
function nextSteps(lessonId: string): { href: string; label: string }[] {
  const unit = UNITS.find((u) => u.lessonIds.includes(lessonId))
  if (!unit) return []
  const later = unit.lessonIds.slice(unit.lessonIds.indexOf(lessonId) + 1).find((id) => LESSON_BY_ID[id])
  if (later) return [{ href: `/learn/${later}`, label: `Next: ${LESSON_BY_ID[later].title}` }]
  const example = unit.workedExampleIds.map((id) => WORKED_EXAMPLES.find((w) => w.id === id)).find(Boolean)
  const first = unit.sections.map((id) => SECTION_BY_ID[id]?.exercises[0]).find(Boolean)
  return [...(example ? [{ href: `/example/${example.id}`, label: `Worked example: ${example.title}` }] : []), ...(first ? [{ href: `/rep/${first.id}`, label: 'Start the reps' }] : [])]
}

/** One concept's full guide. */
export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = LESSON_BY_ID[id]
  if (lesson)
    return (
      <main className="flex-1 bg-canvas">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
          <p className="eyebrow text-muted">
            <Link href="/learn" className="hover:text-ink">
              Learn
            </Link>
            {' · Lesson'}
          </p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">{lesson.title}</h1>
          <div className="panel mt-6 p-6">
            <LessonBody lesson={lesson} next={nextSteps(lesson.id)} />
          </div>
        </div>
      </main>
    )
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
