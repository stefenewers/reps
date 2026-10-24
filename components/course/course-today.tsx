'use client'

import Link from 'next/link'
import { useMockGate } from '@/components/use-mock-gate'
import EarnedMoment from '@/components/course/earned-moment'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReps } from '@/components/reps-provider'
import Ring from '@/components/ring'
import Scene, { type Mood } from '@/components/scene'
import TrainingFlame from '@/components/course/training-flame'
import WeekStrip from '@/components/course/week-strip'
import WinstonPerch from '@/components/winston-perch'
import { LEARN_ACTION, LEARN_LABEL, useTodayLearning, type LearnItem } from '@/components/course/use-today-learning'
import { IconArrowRight, IconCheck, IconClock, IconLock, IconMoon, IconRepair } from '@/components/icons'
import type { useCourseDay } from '@/components/use-course-day'
import type { useTodayPlan } from '@/components/use-today-plan'
import { trainingKey, type useTraining } from '@/components/use-training'
import { COURSE_END, INTERVIEW_CHECKPOINT, dayType, weekDates } from '@/data/course/calendar'
import { motivate } from '@/data/course/motivation'
import { DAY_PLAN } from '@/data/course/schedule'
import { UNIT_BY_ID } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { practiceUrl } from '@/data/problem-urls'
import { addDays, parseLocal } from '@/lib/dates'
import { createSession } from '@/lib/sessions'
import type { PlanItem } from '@/lib/today-plan'

type CourseDayState = ReturnType<typeof useCourseDay>
type Plan = ReturnType<typeof useTodayPlan>
type Training = ReturnType<typeof useTraining>
type StepState = 'done' | 'now' | 'todo' | 'locked' | 'repair'
type DayStatus = 'preview' | 'not-started' | 'in-progress' | 'reps-met' | 'complete' | 'optional'

const LONG_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const SHORT_DOW = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
const GROUPS = [
  { id: 'drill', title: 'Drill', why: 'Short reps on today’s idea, one piece at a time, until it is automatic.' },
  { id: 'combine', title: 'Combine', why: 'Put the pieces together into a whole small program.' },
  { id: 'retrieve', title: 'Retrieve', why: 'Earlier skills from a blank editor, so they stay yours.' }
] as const

/** What a qualifying rep is, in one sentence. Shown wherever the word is. */
export const QUALIFYING =
  'A qualifying rep is a practice problem you solved yourself: your code passes, and the solution was not shown. Each rep counts once a day.'

function groupOf(kind: PlanItem['kind']): (typeof GROUPS)[number]['id'] {
  if (['cold', 'warm', 'redo', 'resolve'].includes(kind)) return 'retrieve'
  if (['combine', 'prove', 'transfer'].includes(kind)) return 'combine'
  return 'drill'
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

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
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-5 pt-6 pb-28 sm:px-8 sm:pt-10 lg:flex-row lg:items-start lg:justify-between lg:pb-32">
        <div className="max-w-[680px]">
          <p className={`text-[13.5px] font-medium ${dark ? 'text-white/80' : 'text-ink-2'}`} suppressHydrationWarning>
            {eyebrow}
          </p>
          <h1 id={titleId} className="headline mt-1.5" data-testid={titleTestId}>
            {title}
          </h1>
          {sub && <div className={`mt-3 max-w-[600px] text-[16px] leading-relaxed ${dark ? 'text-white/85' : 'text-ink-2'}`}>{sub}</div>}
        </div>
        {aside}
      </div>
    </div>
  )
}

/** The flame, the streak and the distance to February, on the scene. */
function MomentumCard({ cd, today, preview }: { cd: CourseDayState; today: string; preview: boolean }) {
  const daysLeft = Math.max(0, Math.round((parseLocal(INTERVIEW_CHECKPOINT).getTime() - parseLocal(today).getTime()) / 86_400_000))
  return (
    <div className="glass hidden shrink-0 items-center gap-4 self-start rounded-2xl px-4 py-3 sm:flex lg:mt-2">
      <TrainingFlame state={preview ? 'unlit' : cd.flame} size={42} />
      <div className="leading-tight">
        <p className="num text-[21px] font-semibold tracking-tight">
          {preview ? 0 : cd.streak}
          <span className="ml-1 text-[13px] font-medium opacity-70">day streak</span>
        </p>
        <p className="mt-0.5 text-[12.5px] opacity-80" data-testid="streak">
          {preview ? 'Starts with Day 1' : cd.streak ? `${cd.streak} training day${cd.streak === 1 ? '' : 's'} in a row` : 'Streak starts with today'}
        </p>
      </div>
      <span aria-hidden="true" className="mx-1 h-10 w-px bg-current opacity-15" />
      <div className="leading-tight">
        <p className="num text-[21px] font-semibold tracking-tight">{daysLeft}</p>
        <p className="mt-0.5 text-[12.5px] opacity-80">days to Feb 1</p>
      </div>
    </div>
  )
}

function Check({ on, tone = 'pass' }: { on: boolean; tone?: 'pass' | 'learn' }) {
  return (
    <span className="check" data-on={on ? 'true' : 'false'} data-tone={tone} aria-hidden="true">
      {on && <IconCheck size={10} strokeWidth={3} />}
    </span>
  )
}

/** One stage of today's training, on the path. Done stages fold away; the current one leads. */
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
  const head = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3 className={`font-semibold tracking-tight ${state === 'now' ? 'text-[18px] text-ink' : state === 'done' ? 'text-[15px] text-muted' : 'text-[16px] text-ink'}`}>{title}</h3>
      {tag}
      {state === 'now' && <span className="tag tag-flame">You are here</span>}
      {meta && <span className="num ml-auto text-[12.5px] text-muted">{meta}</span>}
    </div>
  )
  return (
    <li className="step" data-state={state} data-testid={testId}>
      <span className="step-dot num" aria-hidden="true">
        {state === 'done' ? <IconCheck size={15} strokeWidth={2.8} /> : state === 'locked' ? <IconLock size={14} /> : n}
      </span>
      {state === 'done' ? (
        <details className="group min-w-0 pt-2">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{head}</summary>
          {children && <div className="mt-2.5">{children}</div>}
        </details>
      ) : (
        <div className={`min-w-0 ${state === 'now' ? 'step-current' : 'pt-1.5'}`}>
          {head}
          {why && <p className={`mt-0.5 text-[13px] ${state === 'now' ? 'text-ink-2' : 'text-muted'}`}>{why}</p>}
          {children && <div className="mt-2.5">{children}</div>}
        </div>
      )}
    </li>
  )
}

/** The next training day after a date, and what it teaches. */
function nextTrainingDay(date: string): { date: string; focus: string } | null {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(date, i)
    if (d > COURSE_END) return null
    if (dayType(d) === 'training') {
      const units = (DAY_PLAN[d]?.focusUnits ?? []).map((id) => UNIT_BY_ID[id]?.title).filter(Boolean)
      return { date: d, focus: units.join(' + ') }
    }
  }
  return null
}

/** The training day: what to do, in order, what counts, and when it is finished. */
export default function CourseToday({
  plan,
  cd,
  lcUrl,
  preview = false
}: {
  plan: Plan
  training: Training
  cd: CourseDayState
  lcUrl: (lc: number) => string | undefined
  /** Before the course starts: Day 1, shown as a preview. Learning is open; nothing counts yet. */
  preview?: boolean
}) {
  const { repo, today } = useReps()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [stopped, setStopped] = useState(false)
  const mockGate = useMockGate()
  const learningState = useTodayLearning()
  const c = cd.dayContract
  const placement = preview ? undefined : cd.course.statuses.find((s) => !s.locked && s.route === 'placement' && s.unit.week <= cd.week.number)
  const placementItems: PlanItem[] =
    placement?.gates.flatMap((g) =>
      g.next.map((exerciseId) => ({ key: exerciseId, exerciseId, title: g.gate.title, kind: 'gate' as const, units: 1, done: false }))
    ) ?? []
  const complete = !preview && c.type === 'training' && c.complete
  const recovery = c.type === 'recovery'
  const target = recovery ? cd.day.optionalTarget : c.reps.target
  const { units, learningUnits, catchingUp, items: learning, next: learn, unlabeled, recall, done: learnDone } = learningState
  const reps = plan.items.filter((i) => i.exerciseId && i.kind !== 'gate' && i.kind !== 'problem')
  const remainingReps = reps.filter((i) => !i.done)
  const repair = remainingReps.filter((i) => i.kind === 'repair')
  const lab = c.labs.find((l) => l.state !== 'done')
  const gate = c.gates.find((g) => g.state === 'open')
  const failedGate = c.gates.find((g) => g.state === 'repair')
  const outside = c.targets.find((t) => t.state === 'open')
  const openItems = c.labs.some((l) => l.state !== 'done') || c.gates.some((g) => g.state !== 'cleared') || c.targets.some((t) => t.state !== 'done')
  const learningNeeded = !placement && !c.reps.met && !recovery ? learn : undefined
  const repsLeft = Math.max(0, target - c.reps.done)

  // The one next action, named for what the learner will actually do.
  const main: { label: string; href: string; why: string } | undefined = preview
    ? learn
      ? { label: `${LEARN_ACTION[learn.kind]}: ${learn.title}`, href: learn.href, why: 'Preview the teaching now. Reps, labs and checkpoints open Monday.' }
      : undefined
    : complete
      ? { label: 'Stop for today', href: '', why: '' }
      : repair.length
        ? {
            label: `Start repair · ${plural(repair.length, 'rep')}`,
            href: '',
            why: failedGate ? `Fix the piece the ${failedGate.title} checkpoint found, then try a fresh one.` : 'Fix the weak link first.'
          }
        : placementItems.length
          ? { label: 'Try placement checkpoint', href: '', why: 'Pass it cold and you skip teaching you do not need.' }
          : learningNeeded
            ? {
                label: `${LEARN_ACTION[learningNeeded.kind]}: ${learningNeeded.title}`,
                href: learningNeeded.href,
                why: 'Learning comes first: today’s reps build on it.'
              }
            : remainingReps.length
              ? {
                  label:
                    c.reps.done === 0
                      ? recovery
                        ? 'Start optional reps'
                        : unlabeled
                          ? 'Start transfer session'
                          : cd.week.number === 14
                            ? 'Start timed reps'
                            : 'Start today’s reps'
                      : repsLeft
                        ? `Continue reps · ${repsLeft} to go`
                        : 'Continue reps',
                  href: '',
                  why: unlabeled ? 'Unlabeled problems: choose the approach yourself.' : 'Reps open one after another. Each one you solve yourself counts.'
                }
              : lab
                ? { label: `Start lab: ${lab.title}`, href: `/lab/${lab.id}`, why: 'The rep target is met. The lab is still required today.' }
                : gate
                  ? { label: `Start checkpoint: ${gate.title}`, href: '', why: 'Cold: no hints. It proves what today taught.' }
                  : outside
                    ? { label: `Start target: LC ${outside.lc}`, href: lcUrl(outside.lc) ?? practiceUrl(outside.lc) ?? '/problems', why: 'Solve it from a blank editor, then log how it went.' }
                    : cd.week.number === 14 && mockGate.allowed > mockGate.done
                      ? { label: 'Start mock interview', href: '/interview', why: 'Your transfer evidence opens a mock.' }
                      : undefined

  const startReps = async (items: PlanItem[], title = "Today's training") => {
    const ids = items.flatMap((i) => (i.exerciseId ? [i.exerciseId] : []))
    if (busy || !ids.length || preview) return
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
    if (complete) setStopped(true)
    else if (repair.length) void startReps(repair, 'Focused repair')
    else if (placementItems.length) void startReps(placementItems, 'Placement checkpoint')
    else if (remainingReps.length) void startReps(remainingReps)
    else if (gate) startGate(gate.id)
  }

  // On a phone the action is repeated above the tab bar only once the deck's own button has scrolled away.
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = useState(true)
  useEffect(() => {
    const el = ctaRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  })

  // The coach hand-off: a learning page's "Start your reps" lands here with ?go=reps and the session starts.
  const handedOff = useRef(false)
  useEffect(() => {
    if (handedOff.current || preview || typeof window === 'undefined') return
    const go = new URLSearchParams(window.location.search).get('go')
    if (go !== 'reps') return
    handedOff.current = true
    window.history.replaceState(null, '', '/')
    // Started from a callback: the session is created once the page has settled.
    if (remainingReps.length && !repair.length && !placementItems.length) window.setTimeout(() => void startReps(remainingReps), 0)
  })

  if (today > COURSE_END)
    return (
      <>
        <Hero
          mood={cd.finalDecision === 'ready' ? 'golden' : 'cold'}
          eyebrow="February checkpoint"
          title={cd.finalDecision === 'ready' ? 'Ready.' : cd.finalDecision === 'ready-with-gaps' ? 'Ready, with gaps.' : 'Not yet ready.'}
          sub="Fourteen weeks of evidence, read honestly. Your next work follows from it."
        />
        <div className="relative mx-auto -mt-20 w-full max-w-[1180px] px-5 sm:px-8">
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

  if (c.type === 'rest' && !preview) {
    const next = nextTrainingDay(today)
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
        <div className="relative mx-auto -mt-20 w-full max-w-[1180px] px-5 sm:px-8">
          <WinstonPerch className="pointer-events-none !absolute -top-[61px] right-12 hidden w-[120px] sm:block" ground={false} mood="rest" prop="zzz" />
          <div className="deck grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="eyebrow text-rest">Recovery is part of training</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Rest day, streak protected. Sleep is when practice settles in.
                {next ? (
                  <>
                    {' '}
                    Next training: <b className="font-semibold text-ink">{SHORT_DOW.format(parseLocal(next.date))}</b>
                    {next.focus ? `, ${next.focus}` : ''}. It picks up exactly where you left off.
                  </>
                ) : null}
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
  }

  // The finish line: every requirement of today's contract, done or not.
  const requirements = preview
    ? []
    : [
        {
          key: 'reps',
          label: recovery ? `${target} reps would close the week` : `Solve ${target} qualifying reps`,
          detail: `${c.reps.done} / ${target}`,
          // On an optional Saturday the contract is always met; the row shows the reps actually done.
          done: recovery ? target > 0 && c.reps.done >= target : c.reps.met
        },
        ...c.repair.map((r) => ({ key: `repair:${r.gateId}`, label: `Repair: ${r.title}`, detail: plural(r.reps.length, 'focused rep'), done: false })),
        ...c.labs.map((l) => ({ key: `lab:${l.id}`, label: `Finish the lab: ${l.title}`, detail: '', done: l.state === 'done', carried: l.carried })),
        ...c.gates.map((g) => ({
          key: `gate:${g.id}`,
          label: `Clear the checkpoint: ${g.title}`,
          detail: g.state === 'locked' ? 'opens after its reps' : g.state === 'repair' ? 'repair first' : g.state === 'handled' ? 'repaired; retry next day' : '',
          done: g.state === 'cleared' || g.state === 'handled',
          carried: g.carried
        })),
        ...c.targets.map((t) => ({
          key: `target:${t.lc}`,
          label: `Solve LC ${t.lc}: ${t.title}`,
          detail: t.state === 'locked' ? 'opens after the checkpoint' : '',
          done: t.state === 'done',
          carried: t.carried
        }))
      ]
  const reqDone = requirements.filter((r) => r.done).length
  const carried = requirements.filter((r) => 'carried' in r && r.carried)
  const reqRow = (r: (typeof requirements)[number]) => (
    <li key={r.key} className="flex items-start gap-2.5" data-done={r.done ? 'true' : 'false'}>
      <span className="mt-0.5">
        <Check on={r.done} />
      </span>
      <span className={`min-w-0 flex-1 ${r.done ? 'text-muted line-through decoration-line-strong' : 'text-ink'}`}>{r.label}</span>
      {r.detail && <span className="num shrink-0 text-[12px] text-muted">{r.detail}</span>}
    </li>
  )
  const milestones = requirements.filter((r) => r.key !== 'reps')
  const milestonesDone = milestones.filter((r) => r.done).length
  const status: DayStatus = preview
    ? 'preview'
    : recovery
      ? 'optional'
      : complete
        ? 'complete'
        : c.reps.met
          ? 'reps-met'
          : c.reps.done || learnDone || milestonesDone
            ? 'in-progress'
            : 'not-started'
  const STATUS_LABEL: Record<DayStatus, string> = {
    preview: 'Preview',
    'not-started': 'Not started',
    'in-progress': 'In progress',
    'reps-met': 'Rep target met',
    complete: 'Training complete',
    optional: 'Optional day'
  }
  const statusLine =
    status === 'preview'
      ? 'Training starts Monday, October 26. Explore the lessons now; nothing counts yet.'
      : status === 'complete'
        ? 'Training complete. You did enough today.'
        : status === 'reps-met'
          ? `Rep target complete. ${plural(requirements.length - reqDone, 'required item')} ${requirements.length - reqDone === 1 ? 'remains' : 'remain'}.`
          : status === 'optional'
            ? 'Saturday is optional recovery. Nothing is owed today.'
            : status === 'not-started'
              ? `Nothing done yet. Start with step 1 below.`
              : `${reqDone} of ${requirements.length} requirements complete. Keep going.`

  const repairing = repair.length > 0 || Boolean(failedGate)
  const mood: Mood = complete ? 'golden' : repairing ? 'repair' : placementItems.length || unlabeled || cd.week.number === 14 ? 'cold' : 'dawn'
  const headline = preview
    ? 'Your training starts Monday.'
    : complete
      ? 'Training complete.'
      : repairing
        ? 'Repair first.'
        : placementItems.length
          ? 'Prove what you already know.'
          : recovery
            ? 'Optional recovery day.'
            : unlabeled
              ? 'Solve it on your own.'
              : cd.week.number === 14
                ? 'Interview week.'
                : learningNeeded
                  ? 'Learn first, then train.'
                  : c.reps.met
                    ? `Reps done. ${plural(requirements.length - reqDone, 'item')} left.`
                    : c.reps.done
                      ? `${repsLeft} reps to go.`
                      : 'Time to train.'
  const unitTitle = unlabeled ? 'Independent practice' : units.map((u) => u.title).join(' + ') || 'Continue your course'
  const repairItems = reps.filter((i) => i.kind === 'repair')
  const groups = GROUPS.map((g) => ({ ...g, items: reps.filter((i) => i.kind !== 'repair' && groupOf(i.kind) === g.id) })).filter((g) => g.items.length)
  const trainingDayIndex = weekDates(cd.week.number).filter((d) => d <= today && dayType(d) === 'training').length
  const motivation = complete
    ? 'Good work today. You completed the training contract. This moved the plan forward.'
    : preview
      ? 'This is Day 1 as it will look on Monday. Read ahead if you like; the reps wait for the course.'
      : recovery
        ? 'Saturday is optional. You can close open work here or come back on your next training day.'
        : c.reps.met
          ? 'Ten reps alone do not finish the day: the finish line shows what is left.'
          : c.reps.done
            ? motivate('day-progress', { repsDone: c.reps.done, repsTarget: target }).text
            : 'Follow the steps in order. Each qualifying rep is something you produced.'
  const next = complete ? nextTrainingDay(today) : null

  // Session order. The first open step is "you are here"; done steps fold away.
  const order = [
    ...(repairItems.length ? [{ key: 'repair', done: repairItems.every((i) => i.done), locked: false, repair: false }] : []),
    ...(placementItems.length ? [{ key: 'placement', done: false, locked: false, repair: false }] : []),
    // Learning leads only while it is still what the day needs; once the reps are met it is optional.
    ...(learning.length ? [{ key: 'learn', done: learnDone === learning.length, locked: false, repair: false, optional: !learningNeeded && !preview }] : []),
    ...groups.map((g) => ({ key: g.id, done: g.items.every((i) => i.done), locked: preview, repair: false })),
    ...(c.labs.length ? [{ key: 'build', done: c.labs.every((l) => l.state === 'done'), locked: preview, repair: false }] : []),
    ...(c.gates.length
      ? [
          {
            key: 'gate',
            done: !preview && c.gates.every((g) => g.state === 'cleared' || g.state === 'handled'),
            locked: preview || c.gates.every((g) => g.state === 'locked'),
            repair: c.gates.some((g) => g.state === 'repair')
          }
        ]
      : []),
    ...(c.targets.length ? [{ key: 'target', done: c.targets.every((t) => t.state === 'done'), locked: preview || c.targets.every((t) => t.state === 'locked'), repair: false }] : []),
    { key: 'finish', done: complete, locked: preview, repair: false }
  ]
  const nowKey = complete ? undefined : order.find((o) => !o.done && !o.repair && !o.locked && !('optional' in o && o.optional))?.key
  const step = Object.fromEntries(
    order.map((o, i) => [o.key, { n: i + 1, state: (o.done ? 'done' : o.repair ? 'repair' : o.locked ? 'locked' : o.key === nowKey ? 'now' : 'todo') as StepState }])
  )

  const learnRow = (l: LearnItem) => (
    <li key={l.key}>
      <Link href={l.href} className="rep-row" data-state={l.done ? 'done' : 'todo'} data-next={l.key === learn?.key ? 'true' : undefined}>
        <Check on={l.done} tone="learn" />
        <span className="min-w-0 flex-1">
          {LEARN_LABEL[l.kind]}: {l.title}
        </span>
        {l.thread && <span className={`tag ${l.thread === 'applied' ? 'tag-cold' : 'tag-plain'}`}>{l.thread === 'applied' ? 'Applied' : 'Design'}</span>}
        <span className="hidden items-center gap-1 text-[12px] text-muted sm:inline-flex">
          <IconClock size={12} /> {l.minutes} min
        </span>
        {l.key === learn?.key ? (
          <span className="tag tag-learn">{l.kind === 'lesson' ? 'Start' : l.kind === 'demo' ? 'Watch' : 'Rebuild'}</span>
        ) : l.done ? (
          <span className="tag tag-pass">Done</span>
        ) : null}
      </Link>
    </li>
  )
  const repRow = (i: PlanItem) => (
    <li key={i.key} data-kind={i.kind} data-state={i.done ? 'done' : 'todo'}>
      {i.done ? (
        <span className="rep-row" data-state="done">
          <Check on />
          <span>{unlabeled ? 'Independent practice' : i.title}</span>
        </span>
      ) : preview ? (
        <span className="rep-row text-muted">
          <Check on={false} />
          <span className="min-w-0 flex-1">{i.title}</span>
        </span>
      ) : (
        // Starting from any row opens today's session from that rep, so "Next rep" keeps following today's plan.
        <button
          type="button"
          className="rep-row w-full text-left hover:bg-surface"
          disabled={busy}
          onClick={() => void startReps([i, ...remainingReps.filter((r) => r.key !== i.key)])}
        >
          <Check on={false} />
          <span className="min-w-0 flex-1">{unlabeled ? 'Independent practice' : i.title}</span>
          {i.kind === 'repair' && <span className="tag tag-repair">Repair</span>}
          {(i.kind === 'cold' || i.kind === 'warm') && <span className="tag tag-cold">Cold</span>}
          <IconArrowRight size={13} className="text-faint" />
        </button>
      )}
    </li>
  )
  const cta = (testId: string, extra = '') =>
    main &&
    (main.href ? (
      <Link href={main.href} className={`btn btn-accent btn-lg ${extra}`} data-testid={testId}>
        {main.label}
        <IconArrowRight size={15} />
      </Link>
    ) : (
      <button className={`btn btn-accent btn-lg ${extra}`} onClick={primary} disabled={busy} data-testid={testId}>
        {main.label}
        {!complete && <IconArrowRight size={15} />}
      </button>
    ))

  return (
    <section
      aria-labelledby="today-h"
      data-testid="course-today"
      data-day={preview ? 'preview' : c.type}
      data-complete={complete ? 'true' : 'false'}
      data-status={status}
    >
      <Hero
        mood={mood}
        eyebrow={
          preview ? (
            <>
              <span className="tag tag-learn mr-2 align-middle">Preview</span>Day 1 starts Monday, October 26
            </>
          ) : (
            <>
              {greeting()} {LONG_DAY.format(parseLocal(today))}
            </>
          )
        }
        title={headline}
        titleId="today-h"
        sub={
          <>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] opacity-75" data-testid="day-heading">
              <span data-testid="course-week">
                Week {cd.week.number} · {cd.week.title}
              </span>
              {c.type === 'training' && trainingDayIndex > 0 ? ` · Day ${preview ? 1 : trainingDayIndex}` : ''}
            </p>
            {complete ? (
              <p className="mt-2 text-[18px]" data-testid="day-complete">
                <span className="num font-semibold">
                  {c.reps.done} / {target}
                </span>{' '}
                · You did enough today.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[19px] font-semibold tracking-tight text-ink">
                  {preview ? 'Preview of Day 1: ' : catchingUp && !unlabeled ? 'Catching up: ' : 'Today: '}
                  {catchingUp && !unlabeled ? learningUnits.map((u) => u.title).join(' + ') : unitTitle}
                </p>
                {!unlabeled && (
                  <p className="mt-1" data-testid="unit-focus">
                    {(catchingUp ? learningUnits : units).map((u) => u.purpose).join(' ')}
                  </p>
                )}
                {catchingUp && !unlabeled && (
                  <p className="mt-1.5 text-[13.5px] opacity-80" data-testid="catching-up">
                    Scheduled for today: {unitTitle}. The calendar can slide; the order cannot. It opens once the earlier work clears.
                  </p>
                )}
              </>
            )}
          </>
        }
        aside={<MomentumCard cd={cd} today={today} preview={preview} />}
      />

      <div className="relative mx-auto -mt-20 w-full max-w-[1180px] px-5 sm:px-8 lg:-mt-24">
        <WinstonPerch
          className="pointer-events-none !absolute -top-[61px] right-12 hidden w-[200px] sm:block"
          ground={false}
          mood={complete ? 'celebrate' : repairing ? 'awake' : c.reps.done > 0 ? 'awake' : 'rest'}
          prop={complete || preview ? undefined : repairing ? 'clipboard' : 'dumbbell'}
        />
        <div className={`deck relative p-4 sm:p-6 ${complete ? 'stamp-in' : ''}`} data-testid="today-deck">
          <EarnedMoment events={preview ? [] : cd.events} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Where the day stands, the three kinds of progress, and the one next action. */}
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-[22px] font-semibold tracking-tight">Today&apos;s training</h2>
                <span
                  className={`tag ${status === 'complete' ? 'tag-pass' : status === 'reps-met' ? 'tag-repair' : status === 'in-progress' ? 'tag-flame' : status === 'preview' ? 'tag-learn' : 'tag-plain'}`}
                  data-testid="day-status"
                  data-status={status}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <p className={`mt-1.5 text-[15px] ${status === 'reps-met' ? 'font-semibold text-repair' : status === 'complete' ? 'font-semibold text-green-ink' : 'text-ink-2'}`} data-testid="day-status-line">
                {statusLine}
              </p>

              <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="row-span-2 flex items-center gap-4 sm:row-span-1">
                  <Ring value={c.reps.done} max={target || 1} size={112} stroke={11} color={complete ? 'var(--flame)' : c.reps.met ? 'var(--flame-2)' : 'var(--accent)'}>
                    <span className="num block text-[30px] font-semibold leading-none tracking-tight">{preview ? 0 : c.reps.done}</span>
                    <span className="num block text-[12px] text-muted">of {target}</span>
                  </Ring>
                </div>
                <div className="min-w-0">
                  <p className="label">Qualifying reps</p>
                  <p className="num mt-0.5 text-[19px] font-semibold tracking-tight" data-testid="day-target">
                    {recovery ? (openItems ? 'Open work, if you choose' : target ? `${target} reps would close the week` : 'Week complete') : `${target} reps`}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted">
                    {preview
                      ? 'Counted from Monday.'
                      : recovery
                        ? 'Optional. Each one still counts toward the week.'
                        : c.reps.met
                          ? 'Target met.'
                          : `${repsLeft} to go. Only work you produce counts.`}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-1 sm:grid-cols-1">
                  <div data-testid="learn-meter">
                    <p className="label">Learn first</p>
                    <p className="num mt-0.5 text-[15px] font-semibold">
                      {learning.length ? `${learnDone} / ${learning.length}` : '—'}
                      <span className="ml-1.5 text-[12px] font-normal text-muted">{learning.length ? 'not counted' : 'nothing new today'}</span>
                    </p>
                    {learning.length > 0 && (
                      <span className="bar mt-1 block h-1.5">
                        <span style={{ width: `${(100 * learnDone) / learning.length}%`, background: 'var(--learn)' }} />
                      </span>
                    )}
                  </div>
                  <div data-testid="milestone-meter">
                    <p className="label">Required milestones</p>
                    <p className="num mt-0.5 text-[15px] font-semibold">
                      {milestones.length ? `${milestonesDone} / ${milestones.length}` : preview ? '—' : 'None today'}
                      {milestones.length > 0 && <span className="ml-1.5 text-[12px] font-normal text-muted">labs, checkpoints, targets</span>}
                    </p>
                    {milestones.length > 0 && (
                      <span className="bar mt-1 block h-1.5">
                        <span style={{ width: `${(100 * milestonesDone) / milestones.length}%`, background: 'var(--cold)' }} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {cd.week.number === 14 && !preview && (
                <div
                  className={`mt-5 rounded-2xl px-4 py-3.5 ${mockGate.grade === 'green' ? 'tile-pass' : mockGate.grade === 'yellow' ? 'tile-repair' : 'tile-cold'}`}
                  data-testid="week14-route"
                  data-grade={mockGate.grade}
                >
                  <p className="text-[14.5px] font-semibold">
                    Your interview route: <span className="capitalize">{mockGate.grade}</span>
                  </p>
                  <p className="mt-1 text-[13.5px] text-ink-2">{mockGate.note}</p>
                  <p className="num mt-1 text-[12.5px] text-muted">
                    {mockGate.done} mocks completed · {mockGate.allowed} allowed by your transfer evidence.{' '}
                    <Link className="font-medium text-ink underline underline-offset-2" href={mockGate.allowed > mockGate.done ? '/interview' : '/plan'}>
                      {mockGate.allowed > mockGate.done ? 'Open interview practice' : 'Review transfer and repair work'}
                    </Link>
                  </p>
                </div>
              )}

              <div className="pt-6">
                {complete ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center" data-testid="complete-panel">
                    {stopped ? (
                      <p className="stamp-in font-display text-[24px] font-semibold" data-testid="stopped">
                        Good. See you tomorrow.
                      </p>
                    ) : (
                      <button className="btn btn-accent btn-lg" onClick={() => setStopped(true)} data-testid="stop-today">
                        Stop for today
                      </button>
                    )}
                    <Link href="/progress" className="btn btn-lg btn-ghost">
                      Review what you learned
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2" ref={ctaRef}>
                    {cta('training-start', 'w-full justify-center sm:w-auto sm:self-start')}
                    {main?.why && <p className="text-[13px] text-muted">{main.why}</p>}
                    {!main && !preview && <p className="text-sm text-muted">Finish the prerequisite reps to open the remaining checkpoints and targets.</p>}
                    {!main && preview && (
                      <button className="btn btn-lg w-full justify-center sm:w-auto sm:self-start" disabled data-testid="training-start">
                        Reps open Monday, October 26
                      </button>
                    )}
                  </div>
                )}
                <p className="mt-3 text-[13.5px] text-ink-2" data-testid="motivation" data-tone={complete ? 'celebrate' : 'neutral'}>
                  {motivation}
                </p>
              </div>
            </div>

            {/* The finish line: what must be true before today counts. */}
            <aside className={`rounded-2xl p-5 ${complete ? 'tile-pass' : 'bg-surface'}`} data-testid="finish-line" aria-labelledby="finish-h">
              <p id="finish-h" className="text-[15px] font-semibold">
                {recovery ? 'Open work, all optional' : 'Today’s finish line'}
              </p>
              {preview ? (
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                  From Monday, a day counts when its required work is done: 10 qualifying reps on Day 1, plus any lab or checkpoint due that day. You will see
                  each one here, ticked off as you go.
                </p>
              ) : (
                <>
                  <div className="mt-3 text-[13.5px]" data-testid="today-contract">
                    <ul className="flex flex-col gap-2.5">{requirements.filter((r) => !('carried' in r && r.carried)).map(reqRow)}</ul>
                    {carried.length > 0 && (
                      <details className="mt-3 rounded-xl bg-bg px-3 py-2.5 shadow-[0_0_0_1px_var(--line)]" open={carried.length <= 3}>
                        <summary className="cursor-pointer text-[12.5px] font-medium text-repair">
                          Carried from earlier days · {carried.filter((r) => !r.done).length} open
                        </summary>
                        <ul className="mt-2.5 flex flex-col gap-2.5">{carried.map(reqRow)}</ul>
                      </details>
                    )}
                  </div>
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="num text-[13.5px] font-semibold" data-testid="finish-count">
                      {recovery ? 'Optional today' : `${reqDone} of ${requirements.length} requirements complete`}
                    </p>
                    <span
                      className="bar bar-flame mt-2 block h-2"
                      role="progressbar"
                      aria-label="Today's reps"
                      aria-valuemin={0}
                      aria-valuemax={target || 1}
                      aria-valuenow={Math.min(target || 1, c.reps.done)}
                      data-testid="day-progress"
                    >
                      <span style={{ width: `${requirements.length ? (100 * reqDone) / requirements.length : 0}%` }} />
                    </span>
                    {!recovery && !complete && (
                      <div className="mt-3" data-testid="still-due">
                        <p className="text-[12.5px] text-muted">{c.reps.met ? 'The reps are done. Today counts when the rest is ticked too.' : 'Complete every item to finish today.'}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              <details className="mt-4 text-[12.5px]">
                <summary className="cursor-pointer font-medium text-ink-2">What counts as a qualifying rep?</summary>
                <p className="mt-1.5 leading-relaxed text-muted">{QUALIFYING} Lessons, demos and worked examples prepare you; they are not counted.</p>
              </details>
            </aside>
          </div>
        </div>

        {complete && next && (
          <p className="mt-5 px-1 text-[13.5px] text-muted" data-testid="tomorrow">
            Next training day: <span className="font-medium text-ink-2">{SHORT_DOW.format(parseLocal(next.date))}</span>
            {next.focus ? ` · ${next.focus}` : ''}. Today will be waiting with its first step. Nothing more is needed tonight.
          </p>
        )}
      </div>

      {/* The day's path, in order. */}
      <div className="mx-auto mt-12 w-full max-w-[1180px] px-5 sm:px-8" data-testid="execution-stack">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="section-title">{complete ? 'Today’s path, done' : 'Today’s path'}</h2>
          <p className="text-[13px] text-muted">In order. Finished steps fold away.</p>
        </div>
        <ol className="steps mt-6 max-w-[860px]">
          {repairItems.length > 0 && (
            <Step
              n={step.repair.n}
              state={step.repair.state}
              title="Repair"
              why={failedGate ? `The ${failedGate.title} checkpoint found a weak link. Small, focused reps on exactly that piece, then a fresh checkpoint.` : 'Small, focused reps on the piece that needs it.'}
              tag={<span className="tag tag-repair">Required</span>}
              meta={`${repairItems.filter((i) => i.done).length}/${repairItems.length}`}
              testId="group-repair"
            >
              <ul className="flex flex-col gap-0.5" data-testid="repair-step">
                {repairItems.map(repRow)}
              </ul>
            </Step>
          )}
          {placementItems.length > 0 && (
            <Step
              n={step.placement.n}
              state={step.placement.state}
              title="Prove what you already know"
              why={`Earlier work suggests you know ${placement!.unit.title.toLowerCase()}. Pass a cold checkpoint to skip its teaching. If it needs work, a short repair comes first.`}
              tag={<span className="tag tag-cold">Cold</span>}
            >
              <div data-testid="placement-step">
                <span className="sr-only">Prove what you already know</span>
                <button className="btn btn-sm" disabled={busy} onClick={() => void startReps(placementItems, 'Placement checkpoint')}>
                  Try placement checkpoint
                </button>
              </div>
            </Step>
          )}
          {learning.length > 0 && (
            <Step
              n={step.learn.n}
              state={step.learn.state}
              title="Learn"
              tag={<span className="tag tag-learn">Not counted</span>}
              why={
                learning.some((l) => l.thread)
                  ? 'Understand the idea first: read it, watch it move, rebuild the example, then a short engineering lesson.'
                  : 'Understand the idea first: read it, watch it move, then rebuild a worked example.'
              }
              meta={`${learnDone}/${learning.length}`}
            >
              <ol className="flex flex-col gap-0.5" data-testid="learn-first">
                {learning.map(learnRow)}
              </ol>
              {recall && (
                <Link href={recall.href} className="rep-row mt-1 text-muted" data-testid="applied-recall">
                  <Check on={false} tone="learn" />
                  <span className="min-w-0 flex-1">Recall · {recall.title}</span>
                  <span className="text-[12px]">2 min</span>
                  <span className="tag tag-locked">Optional</span>
                </Link>
              )}
            </Step>
          )}
          <li className="contents" data-testid="today-blocks">
            <ol className="contents" data-testid="training-items">
              {groups.map((g) => {
                const done = g.items.filter((i) => i.done).length
                return (
                  <Step
                    key={g.id}
                    n={step[g.id].n}
                    state={step[g.id].state}
                    title={unlabeled && g.id !== 'retrieve' ? 'Independent transfer' : g.title}
                    why={unlabeled && g.id !== 'retrieve' ? 'Problems without pattern names. Decide the approach, then prove it.' : g.why}
                    meta={`${done}/${g.items.length}`}
                    tag={preview ? <span className="tag tag-locked">Opens Monday</span> : <span className="tag tag-flame">Counts</span>}
                    testId={`group-${g.id}`}
                  >
                    <ul className="flex flex-col gap-0.5" data-group={g.id}>
                      {g.items.map(repRow)}
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
              why="A small, real program: design it, build it, change it, review it. Done or not done; it is not counted as reps."
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
                      Lab · {l.state === 'done' ? 'Done' : preview ? 'Preview' : recovery ? 'Optional recovery' : l.carried ? 'Carried over' : 'Required today'}
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
              title="Prove"
              why="A cold checkpoint: no hints, no lesson panel, no technique named. It proves the prerequisite before the next unit opens."
              tag={<span className="tag tag-cold">Cold checkpoint</span>}
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
                      {g.state === 'open' && !preview ? (
                        <button className="btn btn-sm" disabled={busy} onClick={() => startGate(g.id)}>
                          Start checkpoint
                        </button>
                      ) : g.state === 'locked' || preview ? (
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
                      ) : t.state === 'open' && !preview ? (
                        <Link href={lcUrl(t.lc) ?? '/problems'} className="btn btn-sm">
                          Start target
                        </Link>
                      ) : t.state === 'done' ? (
                        <span className="tag tag-pass">Done</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Step>
          )}
          <Step
            n={step.finish.n}
            state={step.finish.state}
            title="Finish"
            why={
              complete
                ? 'Every requirement is ticked. You did enough today.'
                : recovery
                  ? 'Nothing is required on Saturday. Stop whenever you like.'
                  : 'Today counts when every item on the finish line is ticked. Then stop: tomorrow continues from here.'
            }
            testId="step-finish"
          />
        </ol>
      </div>

      {/* On a phone the next action stays in reach above the tab bar. */}
      {main && !complete && !ctaVisible && (
        <div className="fixed inset-x-0 bottom-[60px] z-20 border-t border-line bg-bg/95 px-4 py-2.5 backdrop-blur-md lg:hidden" data-testid="mobile-next">
          {main.href ? (
            <Link href={main.href} className="btn btn-accent w-full justify-center" data-testid="training-start-mobile">
              <span className="truncate">{main.label}</span>
            </Link>
          ) : (
            <button className="btn btn-accent w-full justify-center" onClick={primary} disabled={busy} data-testid="training-start-mobile">
              <span className="truncate">{main.label}</span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
