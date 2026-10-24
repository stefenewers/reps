'use client'

import Link from 'next/link'
import { useMockGate } from '@/components/use-mock-gate'
import EarnedMoment from '@/components/course/earned-moment'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useReps } from '@/components/reps-provider'
import Ring from '@/components/ring'
import Scene, { type Mood } from '@/components/scene'
import TrainingFlame from '@/components/course/training-flame'
import WeekStrip from '@/components/course/week-strip'
import WinstonPerch from '@/components/winston-perch'
import { IconArrowRight, IconBook, IconCheck, IconLock, IconMoon, IconRepair, IconTarget } from '@/components/icons'
import type { useCourseDay } from '@/components/use-course-day'
import type { useTodayPlan } from '@/components/use-today-plan'
import { trainingKey, type useTraining } from '@/components/use-training'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { COURSE_END, INTERVIEW_CHECKPOINT } from '@/data/course/calendar'
import { LESSON_BY_ID, WORKED_EXAMPLE_BY_ID } from '@/data/course/lessons'
import { motivate } from '@/data/course/motivation'
import { DAY_PLAN } from '@/data/course/schedule'
import { UNIT_BY_ID } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { practiceUrl } from '@/data/problem-urls'
import { parseLocal } from '@/lib/dates'
import { demosForConcept } from '@/lib/demos'
import { createSession } from '@/lib/sessions'
import type { PlanItem } from '@/lib/today-plan'

type CourseDayState = ReturnType<typeof useCourseDay>
type Plan = ReturnType<typeof useTodayPlan>
type Training = ReturnType<typeof useTraining>
type StepState = 'done' | 'now' | 'todo' | 'locked' | 'repair'

const LONG_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const LEARN_ORDER = ['LEARN', 'WATCH IT MOVE', 'REBUILD']
const GROUPS = [
  { id: 'drill', title: 'Drill', why: 'Short reps on today’s idea, until it is automatic.' },
  { id: 'combine', title: 'Combine', why: 'Put the pieces together into a whole program.' },
  { id: 'retrieve', title: 'Retrieve', why: 'Earlier skills, cold, so they stay yours.' }
] as const

function groupOf(kind: PlanItem['kind']): (typeof GROUPS)[number]['id'] {
  if (['cold', 'warm', 'redo', 'resolve'].includes(kind)) return 'retrieve'
  if (['combine', 'prove', 'transfer'].includes(kind)) return 'combine'
  return 'drill'
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'
}

/** The scene at the top of Today: it states the day before a word is read. */
function Hero({
  mood,
  eyebrow,
  title,
  sub,
  aside,
  titleId,
  titleTestId
}: {
  mood: Mood
  eyebrow: ReactNode
  title: ReactNode
  sub?: ReactNode
  aside?: ReactNode
  titleId?: string
  titleTestId?: string
}) {
  const dark = mood === 'dusk' || mood === 'night'
  return (
    <div className="hero" data-mood={mood} data-testid="today-hero">
      <Scene mood={mood} />
      <div className="hero-veil" />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-5 pt-8 pb-32 sm:px-8 sm:pt-12 lg:flex-row lg:items-start lg:justify-between lg:pb-40">
        <div className="max-w-[660px]">
          <p className={`text-[14px] font-medium ${dark ? 'text-white/80' : 'text-ink-2'}`} suppressHydrationWarning>
            {eyebrow}
          </p>
          <h1 id={titleId} className="headline mt-2" data-testid={titleTestId}>
            {title}
          </h1>
          {sub && <div className={`mt-3 max-w-[580px] text-[16px] leading-relaxed ${dark ? 'text-white/85' : 'text-ink-2'}`}>{sub}</div>}
        </div>
        {aside}
      </div>
    </div>
  )
}

/** The flame, the streak and the distance to February, on the scene. */
function MomentumCard({ cd, today }: { cd: CourseDayState; today: string }) {
  const daysLeft = Math.max(0, Math.round((parseLocal(INTERVIEW_CHECKPOINT).getTime() - parseLocal(today).getTime()) / 86_400_000))
  return (
    <div className="glass flex shrink-0 items-center gap-4 self-start rounded-2xl px-4 py-3 lg:mt-2">
      <TrainingFlame state={cd.flame} size={46} />
      <div className="leading-tight">
        <p className="num text-[22px] font-semibold tracking-tight">
          {cd.streak}
          <span className="ml-1 text-[13px] font-medium opacity-70">day streak</span>
        </p>
        <p className="mt-0.5 text-[12.5px] opacity-80" data-testid="streak">
          {cd.streak ? `${cd.streak} training day${cd.streak === 1 ? '' : 's'} in a row` : 'Streak starts with today'}
        </p>
      </div>
      <span aria-hidden="true" className="mx-1 h-10 w-px bg-current opacity-15" />
      <div className="leading-tight">
        <p className="num text-[22px] font-semibold tracking-tight">{daysLeft}</p>
        <p className="mt-0.5 text-[12.5px] opacity-80">days to Feb 1</p>
      </div>
    </div>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <span className="check" data-on={on ? 'true' : 'false'} aria-hidden="true">
      {on && <IconCheck size={10} strokeWidth={3} />}
    </span>
  )
}

/** One stage of today's session, on the path. */
function Step({
  n,
  state,
  title,
  meta,
  why,
  tag,
  children,
  testId
}: {
  n: number
  state: StepState
  title: string
  meta?: ReactNode
  why?: string
  tag?: ReactNode
  children?: ReactNode
  testId?: string
}) {
  return (
    <li className="step" data-state={state} data-testid={testId}>
      <span className="step-dot num" aria-hidden="true">
        {state === 'done' ? <IconCheck size={15} strokeWidth={2.8} /> : state === 'locked' ? <IconLock size={14} /> : n}
      </span>
      <div className="min-w-0 pt-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-[16px] font-semibold tracking-tight text-ink">{title}</h3>
          {tag}
          {state === 'now' && <span className="tag tag-flame">Now</span>}
          {meta && <span className="num ml-auto text-[12.5px] text-muted">{meta}</span>}
        </div>
        {why && <p className="mt-0.5 text-[13px] text-muted">{why}</p>}
        {children && <div className="mt-2.5">{children}</div>}
      </div>
    </li>
  )
}

/** The complete daily contract and its next action, in one place. */
export default function CourseToday({ plan, cd, lcUrl }: { plan: Plan; training: Training; cd: CourseDayState; lcUrl: (lc: number) => string | undefined }) {
  const { repo, today } = useReps()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [stopped, setStopped] = useState(false)
  const mockGate = useMockGate()
  const c = cd.dayContract
  const placement = cd.course.statuses.find((s) => !s.locked && s.route === 'placement' && s.unit.week <= cd.week.number)
  const placementItems: PlanItem[] =
    placement?.gates.flatMap((g) =>
      g.next.map((exerciseId) => ({ key: exerciseId, exerciseId, title: g.gate.title, kind: 'gate' as const, units: 1, done: false }))
    ) ?? []
  const complete = c.type === 'training' && c.complete
  const recovery = c.type === 'recovery'
  const target = recovery ? cd.day.optionalTarget : c.reps.target
  const focus = (DAY_PLAN[today]?.focusUnits ?? []).map((id) => UNIT_BY_ID[id])
  const units = focus.length ? focus : cd.course.current ? [cd.course.current.unit] : []
  const learningUnits = cd.course.current && cd.course.current.unit.week < cd.week.number ? [cd.course.current.unit] : units
  const unlabeled = cd.week.unlabeled
  const learning = unlabeled
    ? []
    : learningUnits
        .flatMap((u) => [
          ...u.lessonIds.map((id) => ({
            key: `lesson:${id}`,
            title: (LESSON_BY_ID[id] ?? CONCEPT_BY_ID[id])?.title ?? id,
            href: `/learn/${id}`,
            label: 'LEARN'
          })),
          ...u.lessonIds
            .flatMap((id) => demosForConcept(id))
            .map((d) => ({ key: `demo:${d.id}`, title: d.title, href: `/demo/${d.id}`, label: 'WATCH IT MOVE' })),
          ...u.workedExampleIds.map((id) => ({ key: `example:${id}`, title: WORKED_EXAMPLE_BY_ID[id]?.title ?? id, href: `/example/${id}`, label: 'REBUILD' }))
        ])
        .filter((x, i, xs) => xs.findIndex((y) => y.key === x.key) === i)
        .sort((a, b) => LEARN_ORDER.indexOf(a.label) - LEARN_ORDER.indexOf(b.label))
  const learn = learning.find((l) => !repo.state(l.key))
  const reps = plan.items.filter((i) => i.exerciseId && i.kind !== 'gate' && i.kind !== 'problem')
  const remainingReps = reps.filter((i) => !i.done)
  const repair = remainingReps.filter((i) => i.kind === 'repair')
  const lab = c.labs.find((l) => l.state !== 'done')
  const gate = c.gates.find((g) => g.state === 'open')
  const failedGate = c.gates.find((g) => g.state === 'repair')
  const outside = c.targets.find((t) => t.state === 'open')
  const openItems = c.labs.some((l) => l.state !== 'done') || c.gates.some((g) => g.state !== 'cleared') || c.targets.some((t) => t.state !== 'done')
  const learningNeeded = !placement && !c.reps.met && !recovery && learn
  const main = complete
    ? { label: 'Day complete', href: '' }
    : repair.length
      ? { label: 'Do repair first', href: '' }
      : placementItems.length
        ? { label: 'Try placement checkpoint', href: '' }
        : learningNeeded
          ? { label: 'Start today', href: learningNeeded.href }
          : remainingReps.length
            ? { label: c.reps.done ? 'Continue today' : 'Start today', href: '' }
            : lab
              ? { label: 'Start lab', href: `/lab/${lab.id}` }
              : gate
                ? { label: 'Start checkpoint', href: '' }
                : outside
                  ? { label: 'Start target', href: lcUrl(outside.lc) ?? practiceUrl(outside.lc) ?? '/problems' }
                  : undefined

  const startReps = async (items: PlanItem[], title = "Today's training") => {
    const ids = items.flatMap((i) => (i.exerciseId ? [i.exerciseId] : []))
    if (busy || !ids.length) return
    setBusy(true)
    try {
      const extras = items.filter((i) => i.kind === 'cold' || i.kind === 'warm' || i.kind === 'redo').map((i) => i.exerciseId!)
      for (const id of extras) {
        try {
          window.localStorage.removeItem(`reps-draft:${id}`)
        } catch {
          /* drafts still reset in the repository */
        }
        await repo.saveDraft(id, EXERCISE_BY_ID[id]?.starterCode ?? '')
      }
      const blocks = items.map((i) => ({
        kind: i.kind === 'cold' ? 'maintain' : i.kind === 'gate' ? 'prove' : i.kind,
        title: i.kind === 'gate' ? 'Checkpoint' : 'Practice',
        why: i.kind === 'gate' ? 'Prove the prerequisite cold.' : 'Write it yourself, then check it.',
        reps: [i.exerciseId!],
        extra: extras.includes(i.exerciseId!)
      }))
      const session = await createSession(repo, 'day', title, ids, undefined, { training: { blocks, extras } })
      await repo.setState(trainingKey(today), { sessionId: session.id })
      router.push(`/rep/${ids[0]}?s=${session.id}`)
    } finally {
      setBusy(false)
    }
  }
  const startGate = (id: string) => {
    const due = c.gates.find((g) => g.id === id)
    if (!due || due.state !== 'open') return
    void startReps(
      due.next.map((exerciseId) => ({ key: exerciseId, exerciseId, title: due.title, kind: 'gate', units: 1, done: false })),
      due.title
    )
  }
  const primary = () => {
    if (repair.length) void startReps(repair, 'Focused repair')
    else if (placementItems.length) void startReps(placementItems, 'Placement checkpoint')
    else if (remainingReps.length) void startReps(remainingReps)
    else if (gate) startGate(gate.id)
  }

  if (today > COURSE_END)
    return (
      <>
        <Hero
          mood={cd.finalDecision === 'ready' ? 'golden' : 'cold'}
          eyebrow="February checkpoint"
          title={cd.finalDecision === 'ready' ? 'Ready.' : cd.finalDecision === 'ready-with-gaps' ? 'Ready, with gaps.' : 'Not yet ready.'}
          sub="Fourteen weeks of evidence, read honestly. Your next work follows from it."
        />
        <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 sm:px-8">
          <section className="deck p-6 sm:p-8" data-testid="course-finished">
            <p className="eyebrow text-muted">February checkpoint</p>
            <h2 className="section-title mt-2">
              {cd.finalDecision === 'ready' ? 'Ready' : cd.finalDecision === 'ready-with-gaps' ? 'Ready with gaps' : 'Not yet ready'}
            </h2>
            <p className="mt-3 text-ink-2">Your next work follows the evidence recorded across the course.</p>
            <Link href="/progress" className="btn btn-accent btn-lg mt-5">
              Review your readiness and next steps
            </Link>
          </section>
        </div>
      </>
    )

  if (c.type === 'rest')
    return (
      <section data-testid="course-today" data-day="rest" aria-labelledby="rest-h">
        <Hero
          mood="dusk"
          eyebrow={
            <>
              {cd.day.holiday ?? 'Sunday'} · Week {cd.week.number}
            </>
          }
          title="Rest day"
          titleId="rest-h"
          titleTestId="rest-title"
          sub={<p data-testid="motivation">Nothing is due. Your plan is intact.</p>}
          aside={
            <div className="glass flex items-center gap-3 self-start rounded-2xl px-4 py-3">
              <IconMoon size={22} />
              <div className="leading-tight">
                <p className="text-[15px] font-semibold">Streak protected</p>
                <p className="num text-[12.5px] opacity-80">
                  {cd.streak} training day{cd.streak === 1 ? '' : 's'} and counting
                </p>
              </div>
            </div>
          }
        />
        <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 sm:px-8">
          <div className="deck grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="eyebrow text-rest">Rest is part of the plan</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Rest day, streak protected. Sleep is when practice settles in. The next training day picks up exactly where you left off.
              </p>
            </div>
            <div>
              <p className="label mb-2">Week {cd.week.number}</p>
              <WeekStrip week={cd.week.number} today={today} credits={cd.credits} contracts={cd.contracts} />
            </div>
          </div>
        </div>
      </section>
    )

  // What the hero says, by state. The state decides; the words follow.
  const repsLeft = Math.max(0, target - c.reps.done)
  const repairing = repair.length > 0 || Boolean(failedGate)
  const mood: Mood = complete ? 'golden' : repairing ? 'repair' : placementItems.length || unlabeled || cd.week.number === 14 ? 'cold' : 'dawn'
  const headline = complete
    ? 'You did enough today.'
    : repairing
      ? 'Repair first.'
      : placementItems.length
        ? 'Prove what you already know.'
        : recovery
          ? 'Optional recovery.'
          : unlabeled
            ? 'Solve it on your own.'
            : cd.week.number === 14
              ? 'Interview week.'
              : learningNeeded
                ? 'Learn first, then train.'
                : c.reps.met
                  ? 'Reps done. Close the day.'
                  : c.reps.done
                    ? `${repsLeft} to go.`
                    : 'Time to train.'
  const unitTitle = unlabeled ? 'Independent practice' : units.map((u) => u.title).join(' + ') || 'Continue your course'
  const groups = GROUPS.map((g) => ({ ...g, items: reps.filter((i) => groupOf(i.kind) === g.id) })).filter((g) => g.items.length)
  const learnDone = learning.filter((l) => repo.state(l.key)).length
  const contractRows = [
    { key: 'reps', label: 'Qualifying reps', done: c.reps.done, total: target, show: true },
    { key: 'labs', label: 'Labs', done: c.labs.filter((l) => l.state === 'done').length, total: c.labs.length, show: c.labs.length > 0 },
    {
      key: 'gates',
      label: 'Checkpoints',
      done: c.gates.filter((g) => g.state === 'cleared' || g.state === 'handled').length,
      total: c.gates.length,
      show: c.gates.length > 0
    },
    { key: 'targets', label: 'Targets', done: c.targets.filter((t) => t.state === 'done').length, total: c.targets.length, show: c.targets.length > 0 }
  ]
  const motivation = complete
    ? 'Good work today. You completed the training contract. This moved the plan forward.'
    : recovery
      ? 'Saturday is optional. You can close open work here or come back on your next training day.'
      : c.reps.met
        ? 'The rep target is met. Finish the open items below to complete the day.'
        : c.reps.done
          ? motivate('day-progress', { repsDone: c.reps.done, repsTarget: target }).text
          : 'Follow the steps below. Each qualifying rep is something you produced.'

  // Session order: learn, reps, then the build, the checkpoint and the target. The first open step is "now".
  const order = [
    ...(learning.length ? [{ key: 'learn', done: learnDone === learning.length, locked: false, repair: false }] : []),
    ...groups.map((g) => ({ key: g.id, done: g.items.every((i) => i.done), locked: false, repair: g.items.some((i) => i.kind === 'repair' && !i.done) })),
    ...(c.labs.length ? [{ key: 'build', done: c.labs.every((l) => l.state === 'done'), locked: false, repair: false }] : []),
    ...(c.gates.length
      ? [
          {
            key: 'gate',
            done: c.gates.every((g) => g.state === 'cleared' || g.state === 'handled'),
            locked: c.gates.every((g) => g.state === 'locked'),
            repair: c.gates.some((g) => g.state === 'repair')
          }
        ]
      : []),
    ...(c.targets.length ? [{ key: 'target', done: c.targets.every((t) => t.state === 'done'), locked: c.targets.every((t) => t.state === 'locked'), repair: false }] : [])
  ]
  const nowKey = order.find((o) => !o.done && !o.repair && !o.locked)?.key
  const step = Object.fromEntries(
    order.map((o, i) => [o.key, { n: i + 1, state: (o.done ? 'done' : o.repair ? 'repair' : o.locked ? 'locked' : o.key === nowKey ? 'now' : 'todo') as StepState }])
  )

  return (
    <section aria-labelledby="today-h" data-testid="course-today" data-day={c.type} data-complete={complete ? 'true' : 'false'}>
      <Hero
        mood={mood}
        eyebrow={
          <>
            {greeting()} {LONG_DAY.format(parseLocal(today))}
          </>
        }
        title={headline}
        titleId="today-h"
        sub={
          <>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] opacity-75" data-testid="day-heading">
              <span data-testid="course-week">
                Week {cd.week.number} · {cd.week.title}
              </span>
            </p>
            {complete ? (
              <p className="mt-2 text-[18px]" data-testid="day-complete">
                <span className="num font-semibold">
                  {c.reps.done} / {target}
                </span>{' '}
                · You did enough. Stop whenever you like.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[19px] font-semibold tracking-tight text-ink">{unitTitle}</p>
                {!unlabeled && (
                  <p className="mt-1" data-testid="unit-focus">
                    {units.map((u) => u.purpose).join(' ')}
                  </p>
                )}
              </>
            )}
          </>
        }
        aside={<MomentumCard cd={cd} today={today} />}
      />

      <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 sm:px-8 lg:-mt-28">
        <WinstonPerch
          className="pointer-events-none !absolute -top-[61px] right-12 hidden w-[200px] sm:block"
          ground={false}
          mood={complete ? 'celebrate' : c.reps.done > 0 ? 'awake' : 'rest'}
        />
        <div className={`deck relative p-3 sm:p-4 ${complete ? 'stamp-in' : ''}`}>
          <EarnedMoment events={cd.events} />
          <div className="grid gap-3 lg:grid-cols-3">
            {/* 1 · What comes first */}
            {complete ? (
              <div className="tile tile-flame flex flex-col" data-testid="complete-panel">
                <div className="flex items-center gap-3">
                  <span className="icon-tile bg-white/70">
                    <TrainingFlame state="blaze" size={26} testId="complete-flame" />
                  </span>
                  <p className="text-[16px] font-semibold">Earned today</p>
                </div>
                <p className="num mt-3 text-[14px] text-ink-2">
                  Week {cd.week.number} · {cd.weekContract.output.done} / {cd.weekContract.output.target} qualifying reps
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {cd.weekContract.gates.filter((g) => g.cleared).length} checkpoints cleared ·{' '}
                  {cd.weekContract.labs.filter((l) => l.done && !l.optional).length} builds completed this week.
                </p>
                {cd.weekContract.complete && (
                  <p className="mt-3 font-semibold text-green-ink" data-testid="week-complete">
                    Week {cd.week.number} complete. You met the output, build, checkpoint and target requirements.
                  </p>
                )}
                <div className="mt-auto pt-5">
                  {stopped ? (
                    <p className="stamp-in font-display text-[22px] font-semibold" data-testid="stopped">
                      Good. See you tomorrow.
                    </p>
                  ) : (
                    <button className="btn btn-accent btn-lg w-full" onClick={() => setStopped(true)} data-testid="stop-today">
                      Stop for today
                    </button>
                  )}
                  <Link href="/progress" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink">
                    See what changed and what comes next <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ) : cd.week.number === 14 ? (
              <div
                className={`tile flex flex-col ${mockGate.grade === 'green' ? 'tile-pass' : mockGate.grade === 'yellow' ? 'tile-repair' : 'tile-cold'}`}
                data-testid="week14-route"
                data-grade={mockGate.grade}
              >
                <div className="flex items-center gap-3">
                  <span className="icon-tile bg-white/70">
                    <IconTarget size={18} />
                  </span>
                  <p className="text-[16px] font-semibold">
                    Interview route · <span className="capitalize">{mockGate.grade}</span>
                  </p>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{mockGate.note}</p>
                <p className="num mt-1 text-[13px] text-muted">
                  {mockGate.done} mocks completed · {mockGate.allowed} allowed by your transfer evidence.
                </p>
                <Link className="btn btn-sm mt-auto self-start" href={mockGate.allowed > mockGate.done ? '/interview' : '/plan'}>
                  {mockGate.allowed > mockGate.done ? 'Open interview practice' : 'Review transfer and repair work'}
                </Link>
              </div>
            ) : repair.length > 0 ? (
              <div className="tile tile-repair flex flex-col" data-testid="repair-step">
                <div className="flex items-center gap-3">
                  <span className="icon-tile bg-white/70 text-repair">
                    <IconRepair size={18} />
                  </span>
                  <p className="text-[16px] font-semibold">Repair first</p>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  {failedGate ? (
                    <>
                      The <b>{failedGate.title}</b> checkpoint found a weak link.{' '}
                    </>
                  ) : null}
                  {repair.length} focused reps before a fresh checkpoint.
                </p>
                <p className="mt-1 text-[13px] text-muted">Finding the weak link is the system working, not a setback.</p>
                <button className="btn btn-sm mt-auto self-start" onClick={() => void startReps(repair)}>
                  Start repair
                </button>
              </div>
            ) : placementItems.length > 0 ? (
              <div className="tile tile-cold flex flex-col" data-testid="placement-step">
                <div className="flex items-center gap-3">
                  <span className="icon-tile bg-white/70 text-cold">
                    <IconTarget size={18} />
                  </span>
                  <p className="text-[16px] font-semibold">Prove what you already know</p>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  Earlier work suggests you know {placement!.unit.title.toLowerCase()}. Pass a cold checkpoint to skip its teaching. If it needs work, a short repair
                  comes first.
                </p>
                <button className="btn btn-sm mt-auto self-start" disabled={busy} onClick={() => void startReps(placementItems, 'Placement checkpoint')}>
                  Try placement checkpoint
                </button>
              </div>
            ) : learning.length > 0 ? (
              <div className="tile tile-learn flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="icon-tile bg-white/80 text-learn">
                    <IconBook size={18} />
                  </span>
                  <p className="text-[16px] font-semibold">{learn ? 'Learn first' : 'Learning done'}</p>
                  <span className="num ml-auto text-[12.5px] text-muted">
                    {learnDone}/{learning.length}
                  </span>
                </div>
                {learn ? (
                  <>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-learn">
                      {learn.label === 'LEARN' ? 'Lesson' : learn.label === 'REBUILD' ? 'Worked example' : 'Watch it move'}
                    </p>
                    <Link href={learn.href} className="mt-1 font-display text-[24px] font-semibold leading-tight tracking-tight hover:underline">
                      {learn.title}
                    </Link>
                    <p className="mt-2 text-[13px] text-muted">The idea before the reps. Learning is not counted; it is what makes the reps count.</p>
                  </>
                ) : (
                  <p className="mt-3 text-[14px] text-ink-2">Today&apos;s lessons and examples are done. The ideas are in place; now make them automatic.</p>
                )}
              </div>
            ) : (
              <div className="tile tile-plain flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="icon-tile bg-white text-ink-2">
                    <IconTarget size={18} />
                  </span>
                  <p className="text-[16px] font-semibold">{unlabeled ? 'No pattern names' : 'Today’s skill'}</p>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  {unlabeled
                    ? 'This week the problems arrive unlabeled, as they will in the room. Read, decide the approach yourself, then prove it.'
                    : units.map((u) => u.purpose).join(' ') || 'Keep the streak alive with today’s reps.'}
                </p>
              </div>
            )}

            {/* 2 · The reps */}
            <div className={`tile flex flex-col ${complete ? 'tile-flame' : 'tile-plain'}`}>
              <div className="flex items-center gap-3">
                <span className="icon-tile num bg-white text-[14px] font-bold text-ink-2">{complete ? <IconCheck size={16} strokeWidth={2.6} /> : 2}</span>
                <p className="text-[16px] font-semibold">{complete ? 'Reps done' : learn ? 'Then do reps' : 'Do your reps'}</p>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <Ring value={c.reps.done} max={target || 1} size={108} stroke={10} color={complete ? 'var(--flame)' : 'var(--accent)'}>
                  <span className="num block text-[30px] font-semibold leading-none tracking-tight">{c.reps.done}</span>
                  <span className="num block text-[12px] text-muted">of {target}</span>
                </Ring>
                <div className="min-w-0 flex-1">
                  <p className="num text-[19px] font-semibold tracking-tight" data-testid="day-target">
                    {recovery ? (openItems ? 'Open work, if you choose' : target ? `${target} reps would close the week` : 'Week complete') : `${target} reps`}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-[13px] text-ink-2">
                    {groups.map((g) => (
                      <li key={g.id} className="flex items-center gap-2">
                        <Check on={g.items.every((i) => i.done)} />
                        <span>{g.title}</span>
                        <span className="num ml-auto text-muted">
                          {g.items.filter((i) => i.done).length}/{g.items.length}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-auto pt-4 text-[12.5px] text-muted">Only work you produce counts. Reading, watching and shown solutions do not.</p>
            </div>

            {/* 3 · Done when */}
            <div className={`tile flex flex-col ${complete ? 'tile-pass' : 'tile-plain'}`}>
              <div className="flex items-center gap-3">
                <span className="icon-tile bg-white text-green-ink">
                  <IconTarget size={18} />
                </span>
                <p className="text-[16px] font-semibold">Today&apos;s goal</p>
              </div>
              <dl className="mt-4 flex flex-col gap-2 text-[13.5px]" data-testid="today-contract">
                {contractRows
                  .filter((r) => r.show)
                  .map((r) => (
                    <div key={r.key} className="flex items-center gap-2.5">
                      <Check on={r.total > 0 && r.done >= r.total} />
                      <dt className="text-ink-2">{r.label}</dt>
                      <dd className={`num ml-auto ${r.key === 'reps' ? 'font-semibold text-ink' : 'text-muted'}`}>
                        {r.done} / {r.total}
                      </dd>
                    </div>
                  ))}
              </dl>
              <div
                className="bar bar-flame mt-4 h-2"
                role="progressbar"
                aria-label="Today's reps"
                aria-valuemin={0}
                aria-valuemax={target || 1}
                aria-valuenow={Math.min(target || 1, c.reps.done)}
                data-testid="day-progress"
              >
                <span style={{ width: `${target ? Math.min(100, (c.reps.done / target) * 100) : 0}%` }} />
              </div>
              {!recovery && !complete && (
                <div className="mt-3" data-testid="still-due">
                  <p className="label">Done for today when</p>
                  <ul className="mt-1 flex flex-col gap-0.5 text-[13px] text-ink-2">
                    {c.remaining.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {complete && <p className="mt-3 text-[13.5px] font-medium text-green-ink">Every part of today&apos;s contract is met.</p>}
            </div>
          </div>

          {complete ? (
            <p className="sr-only" data-testid="motivation" data-tone="celebrate">
              {motivation}
            </p>
          ) : (
            <div className="flex flex-col gap-4 px-2 pt-5 pb-2 sm:flex-row sm:items-center sm:justify-between sm:px-3">
              <p className="max-w-[620px] text-[14px] text-ink-2" data-testid="motivation" data-tone="neutral">
                {motivation}
              </p>
              {main &&
                (main.href ? (
                  <Link href={main.href} className="btn btn-accent btn-lg shrink-0" data-testid="training-start">
                    {main.label}
                    <IconArrowRight size={15} />
                  </Link>
                ) : (
                  <button className="btn btn-accent btn-lg shrink-0" onClick={primary} disabled={busy} data-testid="training-start">
                    {main.label}
                    <IconArrowRight size={15} />
                  </button>
                ))}
              {!main && <p className="text-sm text-muted">Finish the prerequisite reps to open the remaining checkpoints and targets.</p>}
            </div>
          )}
        </div>
      </div>

      {!complete && (
        <div className="mx-auto mt-12 w-full max-w-[1180px] px-5 sm:px-8" data-testid="execution-stack">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="section-title">Today&apos;s session</h2>
            <p className="text-[13px] text-muted">In order. Each step opens the next.</p>
          </div>
          <ol className="steps mt-6 max-w-[860px]">
            {learning.length > 0 && (
              <Step
                n={step.learn.n}
                state={step.learn.state}
                title="Learn"
                tag={<span className="tag tag-learn">Not counted</span>}
                why="The idea first: lessons, a moving picture, then a worked example you rebuild."
                meta={`${learnDone}/${learning.length}`}
              >
                <ol className="flex flex-col gap-0.5" data-testid="learn-first">
                  {learning.map((l) => (
                    <li key={l.key}>
                      <Link href={l.href} className="rep-row" data-state={repo.state(l.key) ? 'done' : 'todo'}>
                        <Check on={Boolean(repo.state(l.key))} />
                        <span className="min-w-0 flex-1">
                          {l.label === 'LEARN' ? 'Lesson: ' : l.label === 'REBUILD' ? 'Worked example: ' : ''}
                          {l.title}
                        </span>
                        <span className={`tag ${l.label === 'REBUILD' ? 'tag-plain' : 'tag-learn'}`}>
                          {l.label === 'LEARN' ? 'Read' : l.label === 'WATCH IT MOVE' ? 'Watch' : 'Rebuild'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </Step>
            )}
            <li className="contents" data-testid="today-blocks">
              <ol className="contents" data-testid="training-items">
                {groups.map((g) => {
                  const done = g.items.filter((i) => i.done).length
                  const fixing = g.items.some((i) => i.kind === 'repair' && !i.done)
                  return (
                    <Step
                      key={g.id}
                      n={step[g.id].n}
                      state={step[g.id].state}
                      title={fixing ? 'Repair' : g.title}
                      why={fixing ? 'Small, focused reps on the exact piece the checkpoint found.' : g.why}
                      meta={`${done}/${g.items.length}`}
                      tag={<span className="tag tag-flame">Counts</span>}
                      testId={`group-${g.id}`}
                    >
                      <ul className="flex flex-col gap-0.5" data-group={g.id}>
                        {g.items.map((i) => (
                          <li key={i.key} data-kind={i.kind} data-state={i.done ? 'done' : 'todo'}>
                            {i.done ? (
                              <span className="rep-row" data-state="done">
                                <Check on />
                                <span>{unlabeled ? 'Independent practice' : i.title}</span>
                              </span>
                            ) : (
                              <Link href={`/rep/${i.exerciseId}`} className="rep-row">
                                <Check on={false} />
                                <span className="min-w-0 flex-1">{unlabeled ? 'Independent practice' : i.title}</span>
                                {i.kind === 'repair' && <span className="tag tag-repair">Repair</span>}
                                {(i.kind === 'cold' || i.kind === 'warm') && <span className="tag tag-cold">Cold</span>}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </Step>
                  )
                })}
              </ol>
            </li>
            {c.labs.length > 0 && (
              <Step
                n={step.build.n}
                state={step.build.state}
                title="Build"
                why="A small, real program: design it, build it, change it, review it."
                tag={<span className="tag tag-plain">{recovery ? 'Optional' : 'Required'}</span>}
              >
                <ul className="flex flex-col gap-2">
                  {c.labs.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3" data-testid="today-lab" data-state={l.state}>
                      <Check on={l.state === 'done'} />
                      <Link href={`/lab/${l.id}`} className="text-[14px] font-medium hover:underline">
                        {l.title}
                      </Link>
                      <span className="ml-auto text-[12px] text-muted">
                        Lab · {l.state === 'done' ? 'Done' : recovery ? 'Optional recovery' : l.carried ? 'Carried over' : 'Required today'}
                      </span>
                    </li>
                  ))}
                </ul>
              </Step>
            )}
            {c.gates.length > 0 && (
              <Step
                n={step.gate.n}
                state={step.gate.state}
                title="Checkpoint"
                why="Cold: no hints, no lesson panel, no technique named. It proves the prerequisite."
                tag={<span className="tag tag-cold">Cold</span>}
              >
                <ul className="flex flex-col gap-2">
                  {c.gates.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3" data-testid="today-gate" data-state={g.state}>
                      <span aria-hidden="true" className={g.state === 'locked' ? 'text-faint' : g.state === 'repair' ? 'text-repair' : 'text-cold'}>
                        {g.state === 'locked' ? <IconLock size={15} /> : g.state === 'repair' ? <IconRepair size={15} /> : <Check on={g.state === 'cleared'} />}
                      </span>
                      <span className="text-[14px] font-medium">{g.title}</span>
                      <span className="sr-only">Checkpoint · {g.state}</span>
                      <span className="ml-auto">
                        {g.state === 'open' ? (
                          <button className="btn btn-sm" disabled={busy} onClick={() => startGate(g.id)}>
                            Start checkpoint
                          </button>
                        ) : g.state === 'locked' ? (
                          <span className="text-[12.5px] text-muted">Finish the prerequisite reps first.</span>
                        ) : g.state === 'repair' ? (
                          <span className="text-[12.5px] text-repair">Do the repair reps first.</span>
                        ) : g.state === 'handled' ? (
                          <span className="text-[12.5px] text-muted">Repair done. A fresh checkpoint opens next training day.</span>
                        ) : (
                          <span className="tag tag-cold">Cleared</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Step>
            )}
            {c.targets.length > 0 && (
              <Step
                n={step.target.n}
                state={step.target.state}
                title="Target problem"
                why="A real interview problem, solved on your own after the checkpoint."
                tag={<span className="tag tag-cold">Outside</span>}
              >
                <ul className="flex flex-col gap-2">
                  {c.targets.map((t) => (
                    <li key={t.lc} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3" data-testid="today-target" data-state={t.state}>
                      <span aria-hidden="true" className={t.state === 'locked' ? 'text-faint' : 'text-cold'}>
                        {t.state === 'locked' ? <IconLock size={15} /> : <Check on={t.state === 'done'} />}
                      </span>
                      <span className="text-[14px] font-medium">
                        LC {t.lc} · {t.title}
                      </span>
                      <span className="sr-only">Target · {t.state}</span>
                      <span className="ml-auto">
                        {t.state === 'locked' ? (
                          <span className="text-[12.5px] text-muted">Opens after checkpoint.</span>
                        ) : t.state === 'open' ? (
                          <Link href={lcUrl(t.lc) ?? '/problems'} className="btn btn-sm">
                            Start target
                          </Link>
                        ) : (
                          <span className="tag tag-pass">Done</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Step>
            )}
          </ol>
        </div>
      )}
    </section>
  )
}
