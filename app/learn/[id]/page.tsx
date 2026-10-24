import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConceptLesson } from '@/components/concept-guide'
import LearningComplete from '@/components/course/learning-complete'
import LessonChecks from '@/components/course/lesson-checks'
import ScheduleNote from '@/components/course/schedule-note'
import { THREAD_LABEL } from '@/lib/course/library'
import { APPLIED_SCHEDULE, LAB_PREREQUISITES } from '@/data/course/applied'
import LessonBody, { lessonAnchors } from '@/components/course/lesson-body'
import DemoEmbed from '@/components/demos/demo-embed'
import LearnHero from '@/components/demos/learn-hero'
import { IconArrowRight, IconClock } from '@/components/icons'
import { demosForConcept } from '@/lib/demos'
import { CONCEPTS, CONCEPT_BY_ID, type Concept } from '@/data/concepts'
import { LAB_BY_ID, LESSONS, LESSON_BY_ID, WORKED_EXAMPLES } from '@/data/course/lessons'
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
  return [
    ...(example ? [{ href: `/example/${example.id}`, label: `Worked example: ${example.title}` }] : []),
    ...(first ? [{ href: `/rep/${first.id}`, label: 'Start the reps' }] : [])
  ]
}

/** Anchor ids for a concept's page, shared with its "On this page" list. */
const conceptAnchors = (c: Concept, demos: number) => [
  { id: 'idea', label: 'The idea' },
  { id: 'why', label: 'Why it matters' },
  ...(demos ? [{ id: 'watch', label: 'Watch it move' }] : []),
  { id: 'moves', label: 'Core moves' },
  ...(c.shape ? [{ id: 'shape', label: 'The usual shape' }] : []),
  { id: 'example', label: 'An example' },
  { id: 'mistakes', label: 'Watch out for' },
  ...(c.videos.length ? [{ id: 'videos', label: 'Watch the idea' }] : [])
]

/** Reading time at a calm pace, from the words on the page. */
function minutes(texts: string[]) {
  const words = texts.join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(3, Math.round(words / 160))
}

/** The rail beside the reading column: where you are in the page, and what comes after. */
function Rail({ anchors, next }: { anchors: { id: string; label: string }[]; next?: { href: string; label: string }[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-8 flex flex-col gap-6">
        <nav aria-label="On this page">
          <p className="label mb-2">On this page</p>
          {anchors.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="toc-link">
              {a.label}
            </a>
          ))}
        </nav>
        {next?.[0] && (
          <Link href={next[0].href} className="group rounded-2xl bg-learn-soft p-4 transition-colors hover:bg-[#e2ecfb]">
            <p className="eyebrow text-learn">Then</p>
            <p className="mt-1 flex items-start justify-between gap-2 text-[14px] font-semibold text-ink">
              {next[0].label}
              <IconArrowRight size={14} className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        )}
      </div>
    </aside>
  )
}

/** One lesson, or one concept's full guide. */
export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = LESSON_BY_ID[id]
  if (lesson) {
    const appliedUnit = APPLIED_SCHEDULE.find((x) => x.lessonId === id)?.unitId
    const unit = UNITS.find((u) => u.lessonIds.includes(id) || u.id === appliedUnit)
    // An applied / design lesson leads into the labs that use it.
    const usedIn = Object.entries(LAB_PREREQUISITES)
      .filter(([, ids]) => ids.includes(id))
      .map(([labId]) => LAB_BY_ID[labId])
      .filter(Boolean)
    const next = lesson.thread ? usedIn.map((l) => ({ href: `/lab/${l.id}`, label: `Used in: ${l.title} (Week ${l.week})` })) : nextSteps(lesson.id)
    const anchors = [...lessonAnchors(lesson), ...(lesson.checks?.length ? [{ id: 'checks', label: 'Check yourself' }] : [])]
    return (
      <main className="flex-1 bg-canvas">
        <LearnHero
          kind={lesson.thread ? THREAD_LABEL[lesson.thread] : 'Lesson'}
          crumbs={[
            { href: '/learn', label: 'Learn' },
            ...(lesson.thread
              ? [{ href: `/learn#${lesson.thread}`, label: THREAD_LABEL[lesson.thread] }, ...(unit ? [{ href: '/plan', label: `Week ${unit.week}` }] : [])]
              : unit
                ? [{ href: '/plan', label: `Week ${unit.week} · ${unit.title}` }]
                : [])
          ]}
          title={lesson.title}
          meta={
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1">
                <IconClock size={12} /> About {lesson.minutes ?? minutes([lesson.concept, lesson.whyItMatters, ...lesson.sections.map((s) => s.body)])} min
              </span>
              <span className="rounded-full bg-white/70 px-2.5 py-1">
                {lesson.sections.length} parts · code you can run
              </span>
              <span className="rounded-full bg-white/70 px-2.5 py-1">Not counted: it makes the reps count</span>
            </>
          }
        />
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 pt-10 pb-24 sm:px-8 lg:grid-cols-[minmax(0,720px)_220px] lg:justify-between">
          <div className="min-w-0">
            <ScheduleNote lessonId={lesson.id} week={unit?.week} />
            <LessonBody lesson={lesson} next={lesson.checks?.length ? [] : next} />
            <LessonChecks lesson={lesson} />
            <LearningComplete stateKey={`lesson:${id}`} />
          </div>
          <Rail anchors={anchors} next={next} />
        </div>
      </main>
    )
  }
  const c = CONCEPT_BY_ID[id]
  if (!c) notFound()
  const demos = demosForConcept(id)
  return (
    <main className="flex-1 bg-canvas">
      <LearnHero
        kind="Concept"
        crumbs={[{ href: '/learn', label: 'Learn' }, ...(c.pattern ? [{ href: '/learn', label: c.pattern }] : [])]}
        title={c.title}
        meta={
          <>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{c.coreMoves.length} core moves</span>
            {demos.length > 0 && <span className="rounded-full bg-white/70 px-2.5 py-1">Interactive: watch it move</span>}
            {c.videos.length > 0 && (
              <span className="rounded-full bg-white/70 px-2.5 py-1">
                {c.videos.length} concept video{c.videos.length === 1 ? '' : 's'}
              </span>
            )}
          </>
        }
      />
      <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 pt-10 pb-24 sm:px-8 lg:grid-cols-[minmax(0,760px)_220px] lg:justify-between">
        <div className="min-w-0">
          <ConceptLesson
            concept={c}
            demos={
              demos.length ? (
                <div className="flex flex-col gap-8">
                  {demos.map((d) => (
                    <DemoEmbed key={d.id} id={d.id} compact />
                  ))}
                </div>
              ) : undefined
            }
          />
          <LearningComplete stateKey={`lesson:${id}`} />
        </div>
        <Rail anchors={conceptAnchors(c, demos.length)} />
      </div>
    </main>
  )
}
