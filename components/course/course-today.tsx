'use client'

import Link from 'next/link'
import { useMockGate } from '@/components/use-mock-gate'
import EarnedMoment from '@/components/course/earned-moment'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useReps } from '@/components/reps-provider'
import TrainingFlame from '@/components/course/training-flame'
import WeekStrip from '@/components/course/week-strip'
import type { useCourseDay } from '@/components/use-course-day'
import type { useTodayPlan } from '@/components/use-today-plan'
import { trainingKey, type useTraining } from '@/components/use-training'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { COURSE_END } from '@/data/course/calendar'
import { LESSON_BY_ID, WORKED_EXAMPLE_BY_ID } from '@/data/course/lessons'
import { DAY_PLAN } from '@/data/course/schedule'
import { UNIT_BY_ID } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { practiceUrl } from '@/data/problem-urls'
import { demosForConcept } from '@/lib/demos'
import { createSession } from '@/lib/sessions'
import type { PlanItem } from '@/lib/today-plan'

type CourseDayState = ReturnType<typeof useCourseDay>
type Plan = ReturnType<typeof useTodayPlan>
type Training = ReturnType<typeof useTraining>

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
        .sort((a, b) => ['LEARN', 'WATCH IT MOVE', 'REBUILD'].indexOf(a.label) - ['LEARN', 'WATCH IT MOVE', 'REBUILD'].indexOf(b.label))
  const learn = learning.find((l) => !repo.state(l.key))
  const reps = plan.items.filter((i) => i.exerciseId && i.kind !== 'gate' && i.kind !== 'problem')
  const remainingReps = reps.filter((i) => !i.done)
  const repair = remainingReps.filter((i) => i.kind === 'repair')
  const lab = c.labs.find((l) => l.state !== 'done')
  const gate = c.gates.find((g) => g.state === 'open')
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
      <section className="panel mt-8 p-6 sm:p-8" data-testid="course-finished">
        <p className="eyebrow text-muted">February checkpoint</p>
        <h2 className="mt-2 text-2xl font-semibold">
          {cd.finalDecision === 'ready' ? 'Ready' : cd.finalDecision === 'ready-with-gaps' ? 'Ready with gaps' : 'Not yet ready'}
        </h2>
        <p className="mt-3 text-ink-2">Your next work follows the evidence recorded across the course.</p>
        <Link href="/progress" className="btn btn-accent mt-5">
          Review your readiness and next steps
        </Link>
      </section>
    )
  if (c.type === 'rest')
    return (
      <section className="panel mt-8 bg-rest-soft p-6 sm:p-8" data-testid="course-today" data-day="rest">
        <p className="eyebrow text-rest">
          {cd.day.holiday ?? 'Sunday'} · Week {cd.week.number}
        </p>
        <h2 className="mt-2 text-[30px] font-semibold" data-testid="rest-title">
          Rest day
        </h2>
        <p className="mt-2 text-ink-2" data-testid="motivation">
          Nothing is due. Your plan is intact.
        </p>
        <p className="mt-3 text-sm text-muted">Rest day, streak protected.</p>
        <div className="mt-6 max-w-[420px]">
          <WeekStrip week={cd.week.number} today={today} credits={cd.credits} contracts={cd.contracts} />
        </div>
      </section>
    )

  return (
    <section
      aria-labelledby="today-h"
      className="panel mt-8 overflow-hidden"
      data-testid="course-today"
      data-day={c.type}
      data-complete={complete ? 'true' : 'false'}
    >
      <div className={`p-6 sm:p-8 ${complete ? 'bg-flame-soft' : ''}`}>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
          <span data-testid="streak">{cd.streak ? `🔥 ${cd.streak} training day${cd.streak === 1 ? '' : 's'} in a row` : 'Streak starts with today'}</span>
          <span data-testid="course-week">
            Week {cd.week.number} · {cd.week.title}
          </span>
        </div>
        <div className="mt-5 flex items-start gap-4">
          <TrainingFlame state={cd.flame} size={56} />
          <div className="min-w-0">
            <p className="eyebrow text-muted">{recovery ? 'Saturday · optional recovery' : 'Today'}</p>
            {complete ? (
              <div data-testid="day-complete">
                <h2 id="today-h" className="text-[30px] font-semibold">
                  Day complete
                </h2>
                <p>
                  {c.reps.done} / {target} · You did enough.
                </p>
              </div>
            ) : (
              <>
                <h2 id="today-h" className="text-[28px] font-semibold leading-tight tracking-tight">
                  {unlabeled ? 'Independent practice' : units.map((u) => u.title).join(' + ') || 'Continue your course'}
                </h2>
                <p className="num mt-1 font-medium" data-testid="day-target">
                  {recovery ? (openItems ? 'Open work, if you choose' : target ? `${target} reps would close the week` : 'Week complete') : `${target} reps`}
                </p>
              </>
            )}
          </div>
        </div>
        {!unlabeled && !complete && (
          <p className="mt-4 text-[14px] leading-relaxed text-ink-2" data-testid="unit-focus">
            {units.map((u) => u.purpose).join(' ')}
          </p>
        )}
        <EarnedMoment events={cd.events} />
        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-surface p-4 text-sm sm:grid-cols-4" data-testid="today-contract">
          <div>
            <dt className="label">Qualifying reps</dt>
            <dd className="num mt-1 font-semibold">
              {c.reps.done} / {target}
            </dd>
          </div>
          <div>
            <dt className="label">Labs</dt>
            <dd className="num mt-1">
              {c.labs.filter((l) => l.state === 'done').length} / {c.labs.length}
            </dd>
          </div>
          <div>
            <dt className="label">Checkpoints</dt>
            <dd className="num mt-1">
              {c.gates.filter((g) => g.state === 'cleared' || g.state === 'handled').length} / {c.gates.length}
            </dd>
          </div>
          <div>
            <dt className="label">Targets</dt>
            <dd className="num mt-1">
              {c.targets.filter((t) => t.state === 'done').length} / {c.targets.length}
            </dd>
          </div>
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
        <p className="mt-4 text-sm text-ink-2" data-testid="motivation" data-tone={complete ? 'celebrate' : 'neutral'}>
          {complete
            ? 'Good work today. You completed the training contract. This moved the plan forward.'
            : recovery
              ? 'Saturday is optional. You can close open work here or come back on your next training day.'
              : c.reps.met
                ? 'The rep target is met. Finish the open items below to complete the day.'
                : 'Follow the steps below. Each qualifying rep is something you produced.'}
        </p>
        {main &&
          !complete &&
          (main.href ? (
            <Link href={main.href} className="btn btn-accent btn-lg mt-5" data-testid="training-start">
              {main.label}
            </Link>
          ) : (
            <button className="btn btn-accent btn-lg mt-5" onClick={primary} disabled={busy} data-testid="training-start">
              {main.label}
            </button>
          ))}
        {!main && !complete && <p className="mt-4 text-sm text-muted">Finish the prerequisite reps to open the remaining checkpoints and targets.</p>}
      </div>
      {!complete && (
        <div className="border-t border-line p-6 sm:px-8" data-testid="execution-stack">
          {cd.week.number === 14 && (
            <div className="mb-5 rounded-xl bg-surface p-4" data-testid="week14-route" data-grade={mockGate.grade}>
              <p className="eyebrow text-muted">Interview route · {mockGate.grade}</p>
              <p className="mt-2 text-sm">{mockGate.note}</p>
              <p className="mt-1 text-sm text-muted">
                {mockGate.done} mocks completed · {mockGate.allowed} allowed by your transfer evidence.
              </p>
              <Link className="btn btn-sm mt-3" href={mockGate.allowed > mockGate.done ? '/interview' : '/plan'}>
                {mockGate.allowed > mockGate.done ? 'Open interview practice' : 'Review transfer and repair work'}
              </Link>
            </div>
          )}
          {placementItems.length > 0 && (
            <div className="mb-5 rounded-xl bg-cold-soft p-4" data-testid="placement-step">
              <p className="eyebrow text-cold">Prove what you already know</p>
              <p className="mt-2 text-sm">
                Earlier work suggests you know {placement!.unit.title.toLowerCase()}. Pass a cold checkpoint to skip its teaching. If it needs work, a short
                repair comes first.
              </p>
              <button className="btn btn-sm mt-3" disabled={busy} onClick={() => void startReps(placementItems, 'Placement checkpoint')}>
                Try placement checkpoint
              </button>
            </div>
          )}
          {repair.length > 0 && (
            <div className="mb-5 rounded-xl bg-surface p-4" data-testid="repair-step">
              <p className="eyebrow text-repair">Repair first</p>
              <p className="mt-1 text-sm">{repair.length} focused reps before a fresh checkpoint.</p>
              <button className="btn btn-sm mt-2" onClick={() => void startReps(repair)}>
                Start repair
              </button>
            </div>
          )}
          {learning.length > 0 && (
            <ol className="mb-5 flex flex-col gap-3" data-testid="learn-first">
              {learning.map((l) => (
                <li key={l.key} className="rounded-xl bg-learn-soft p-4">
                  <p className="eyebrow text-learn">
                    {l.label} {repo.state(l.key) ? '· Done' : '· Recommended'}
                  </p>
                  <Link href={l.href} className="mt-1 inline-block text-sm font-medium hover:underline">
                    {l.label === 'LEARN' ? 'Lesson: ' : l.label === 'REBUILD' ? 'Worked example: ' : ''}
                    {l.title}
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <div data-testid="today-blocks">
            <ol className="flex flex-col gap-4" data-testid="training-items">
              {['drill', 'combine', 'retrieve'].map((group) => {
                const items = reps.filter((i) =>
                  group === 'retrieve'
                    ? ['cold', 'warm', 'redo', 'resolve'].includes(i.kind)
                    : group === 'combine'
                      ? ['combine', 'prove', 'transfer'].includes(i.kind)
                      : !['cold', 'warm', 'redo', 'resolve', 'combine', 'prove', 'transfer'].includes(i.kind)
                )
                return items.length ? (
                  <li key={group} data-group={group}>
                    <p className="eyebrow text-muted">
                      {group} · {items.filter((i) => i.done).length}/{items.length}
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {items.map((i) => (
                        <li key={i.key} className="text-sm" data-kind={i.kind} data-state={i.done ? 'done' : 'todo'}>
                          {i.done ? (
                            <span className="text-muted">✓ {unlabeled ? 'Independent practice' : i.title}</span>
                          ) : (
                            <Link href={`/rep/${i.exerciseId}`} className="hover:underline">
                              {unlabeled ? 'Independent practice' : i.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : null
              })}
            </ol>
          </div>
          <ol className="mt-5 flex flex-col gap-3">
            {c.labs.map((l) => (
              <li key={l.id} className="rounded-xl border border-line p-4" data-testid="today-lab" data-state={l.state}>
                <p className="eyebrow text-learn">
                  Lab · {l.state === 'done' ? 'Done' : recovery ? 'Optional recovery' : l.carried ? 'Carried over' : 'Required today'}
                </p>
                <Link href={`/lab/${l.id}`} className="mt-1 inline-block text-sm font-medium hover:underline">
                  {l.title}
                </Link>
              </li>
            ))}
            {c.gates.map((g) => (
              <li key={g.id} className="rounded-xl border border-line p-4" data-testid="today-gate" data-state={g.state}>
                <p className="eyebrow text-cold">Checkpoint · {g.state}</p>
                <p className="mt-1 text-sm font-medium">{g.title}</p>
                {g.state === 'open' ? (
                  <button className="btn btn-sm mt-2" disabled={busy} onClick={() => startGate(g.id)}>
                    Start checkpoint
                  </button>
                ) : g.state === 'locked' ? (
                  <p className="mt-1 text-sm text-muted">Finish the prerequisite reps first.</p>
                ) : g.state === 'repair' ? (
                  <p className="mt-1 text-sm text-repair">Do the repair reps first.</p>
                ) : g.state === 'handled' ? (
                  <p className="mt-1 text-sm text-muted">Repair done. A fresh checkpoint opens next training day.</p>
                ) : null}
              </li>
            ))}
            {c.targets.map((t) => (
              <li key={t.lc} className="rounded-xl border border-line p-4" data-testid="today-target" data-state={t.state}>
                <p className="eyebrow text-cold">Target · {t.state}</p>
                <p className="mt-1 text-sm font-medium">
                  LC {t.lc} · {t.title}
                </p>
                {t.state === 'locked' ? (
                  <p className="mt-1 text-sm text-muted">Opens after checkpoint.</p>
                ) : t.state === 'open' ? (
                  <Link href={lcUrl(t.lc) ?? '/problems'} className="btn btn-sm mt-2">
                    Start target
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
          {!recovery && (
            <div className="mt-6 rounded-xl bg-surface p-4" data-testid="still-due">
              <p className="label">Done for today when</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-2">
                {c.remaining.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {complete && (
        <div className="border-t border-line p-6 sm:px-8" data-testid="complete-panel">
          <p className="text-sm text-ink-2">
            Week {cd.week.number} · {cd.weekContract.output.done} / {cd.weekContract.output.target} qualifying reps
          </p>
          <p className="mt-2 text-sm text-muted">
            {cd.weekContract.gates.filter((g) => g.cleared).length} checkpoints cleared · {cd.weekContract.labs.filter((l) => l.done && !l.optional).length}{' '}
            builds completed this week.
          </p>
          {cd.weekContract.complete && (
            <p className="mt-3 font-semibold text-green-ink" data-testid="week-complete">
              Week {cd.week.number} complete. You met the output, build, checkpoint and target requirements.
            </p>
          )}
          <Link href="/progress" className="mt-3 inline-block text-sm underline underline-offset-2">
            See what changed and what comes next
          </Link>
          {stopped ? (
            <p className="mt-4 font-medium" data-testid="stopped">
              Good. See you tomorrow.
            </p>
          ) : (
            <button className="btn btn-accent mt-4" onClick={() => setStopped(true)} data-testid="stop-today">
              Stop for today
            </button>
          )}
        </div>
      )}
    </section>
  )
}
