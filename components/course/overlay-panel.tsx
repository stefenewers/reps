'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { useSolveLog } from '@/components/use-solve-log'
import { SECTION_BY_ID } from '@/data/course'
import { doubleDaysFrom, phaseOf } from '@/data/course/calendar'
import { LAB_BY_ID, LABS, LESSON_BY_ID } from '@/data/course/lessons'
import { BIG_TECH_LABEL, SPRINT_END } from '@/data/course/sprint'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { labKey, type LabState } from '@/lib/course/labs'
import { prepDayOn, storyKey, TIMED_MINUTES } from '@/lib/course/prep-plan'
import { sprintPlanAsOf } from '@/lib/course/sprint-day'
import { shortDate } from '@/lib/dates'

/**
 * Today from Nov 16: the Sprint's numbers (target, review block, behind-by, when it ends) or Prep's template
 * (timed problems, format practice, the AI ramp, a story prompt, 1D DP, review). Everything derived.
 */
export default function OverlayPanel() {
  const { attempts, mastery, reviews, repo, today, version } = useReps()
  const { entries } = useSolveLog()
  const phase = phaseOf(today)
  const input = useMemo(() => {
    void version
    return {
      attempts,
      entries,
      mastery,
      review: reviews,
      labStates: Object.fromEntries(LABS.map((l) => [l.id, repo.state<LabState>(labKey(l.id))])),
      exercises: EXERCISE_BY_ID,
      sections: SECTION_BY_ID,
      doubleDays: doubleDaysFrom(repo.statesWithPrefix<{ date?: string; on?: boolean }>('double:')),
      state: (k: string) => repo.state(k)
    }
  }, [attempts, entries, mastery, reviews, repo, version])
  const sprint = useMemo(() => (phase === 'sprint' ? sprintPlanAsOf(today, input) : undefined), [phase, today, input])
  const prep = useMemo(() => (phase === 'prep' ? prepDayOn(today, input) : undefined), [phase, today, input])
  const [story, setStory] = useState<string | null>(null)
  if (phase === 'course') return null
  const title = (id: string) => EXERCISE_BY_ID[id]?.title ?? id

  if (sprint) {
    const day = sprint.days.find((d) => d.date === today)
    return (
      <section className="mt-5 rounded-2xl bg-surface px-4 py-3.5" data-testid="sprint-panel" data-behind={sprint.behindBy}>
        <p className="text-[14.5px] font-semibold">
          Sprint to Nov 30: <span className="num">{sprint.remaining}</span> must-know reps left
          {sprint.endsOn ? <> · on plan to finish {shortDate(sprint.endsOn)}</> : null}
        </p>
        {sprint.behindBy > 0 && (
          <p className="mt-1 text-[13.5px] font-semibold text-repair" data-testid="sprint-behind">
            Behind by {sprint.behindBy}: even 24 a day cannot hold it all, so the lowest-priority work (linked lists, then binary search) moves to Dec 1–5.
          </p>
        )}
        {day && day.review.length > 0 && (
          <p className="mt-1 text-[13px] text-ink-2" data-testid="sprint-review">
            Review first ({day.review.length}): {day.review.map((r) => `${title(r.exerciseId)}${r.why === 'shaky' ? ' (shaky)' : ''}`).join(' · ')}
            {day.redo ? ` · Saturday redo: LC ${day.redo.lc} ${day.redo.title}, unaided` : ''}
          </p>
        )}
        {day && (
          <p className="num mt-1 text-[12.5px] text-muted">
            About {Math.round(day.minutes.low / 6) / 10}–{Math.round(day.minutes.high / 6) / 10} h today. Through {shortDate(SPRINT_END)}. The {BIG_TECH_LABEL.toLowerCase()} stays open as optional practice.
          </p>
        )}
      </section>
    )
  }

  if (!prep) return null
  const saved = prep.story ? (repo.state<{ answer: string }>(storyKey(prep.story.id))?.answer ?? '') : ''
  return (
    <section className="mt-5 flex flex-col gap-3 rounded-2xl bg-surface px-4 py-3.5" data-testid="prep-panel">
      <p className="text-[14.5px] font-semibold">Prep: interview practice from ready units</p>
      {prep.carry && (
        <p className="text-[13.5px] font-semibold text-repair" data-testid="prep-carry">
          Sprint carry-over first: {prep.carry.newReps.length + prep.carry.gates.length} items ({prep.carry.theme.replace('Sprint carry-over: ', '')}).
        </p>
      )}
      <div data-testid="prep-timed">
        <p className="label">1 · Timed, {TIMED_MINUTES} min each, unlabeled</p>
        <ul className="mt-1 flex flex-col gap-1">
          {prep.timed.map((id, i) => (
            <li key={id}>
              <Link className="text-[14px] font-medium underline underline-offset-2" href={`/rep/${id}`}>
                Problem {i + 1}
              </Link>
            </li>
          ))}
          {!prep.timed.length && <li className="text-[13px] text-muted">No ready unit has a problem left to time today.</li>}
        </ul>
      </div>
      {prep.format && (
        <div data-testid="prep-format" data-kind={prep.format.kind}>
          <p className="label">
            2 · {prep.format.title} ({prep.format.minutes} min)
          </p>
          <p className="text-[13px] text-ink-2">{prep.format.note}</p>
          {prep.format.labId && (
            <Link className="text-[14px] font-medium underline underline-offset-2" href={`/lab/${prep.format.labId}`}>
              {LAB_BY_ID[prep.format.labId]?.title}
            </Link>
          )}
          {prep.format.exerciseId && (
            <Link className="text-[14px] font-medium underline underline-offset-2" href={`/rep/${prep.format.exerciseId}`}>
              {title(prep.format.exerciseId)}
            </Link>
          )}
          {prep.format.checklist && (
            <div className="mt-1">
              <p className="text-[13px] font-medium">{prep.format.checklist.title} · outside the app</p>
              <ul className="ml-4 list-disc text-[13px] text-ink-2">
                {prep.format.checklist.items.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {prep.ai && (
        <div data-testid="prep-ai">
          <p className="label">3 · AI project ramp: {prep.ai.title}</p>
          <p className="text-[13px] text-ink-2">
            {prep.ai.lessonId && LESSON_BY_ID[prep.ai.lessonId] && (
              <Link className="underline underline-offset-2" href={`/learn/${prep.ai.lessonId}`}>
                {LESSON_BY_ID[prep.ai.lessonId].title}
              </Link>
            )}
            {prep.ai.labId && LAB_BY_ID[prep.ai.labId] && (
              <>
                {' · '}
                <Link className="underline underline-offset-2" href={`/lab/${prep.ai.labId}`}>
                  {LAB_BY_ID[prep.ai.labId].title}
                </Link>
              </>
            )}
            {prep.ai.outside && ' · needs a real model call: build it outside the app with the same scaffold.'}
          </p>
        </div>
      )}
      {prep.story && (
        <div data-testid="prep-story">
          <p className="label">4 · {prep.story.kind === 'star' ? 'Behavioral (STAR)' : 'Project deep-dive'}</p>
          <p className="text-[14px] font-medium">{prep.story.prompt}</p>
          <ul className="ml-4 list-disc text-[12.5px] text-muted">
            {prep.story.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <textarea className="input mt-1.5 min-h-[80px] !text-[14px]" value={story ?? saved} onChange={(e) => setStory(e.target.value)} data-testid="story-answer" />
          <button
            type="button"
            className="btn mt-1.5"
            disabled={!(story ?? saved).trim()}
            // Merge: the story:<id> namespace is shared with the Interview stories checklist (its {status} must survive).
            onClick={() => void repo.setState(storyKey(prep.story!.id), { ...(repo.state<object>(storyKey(prep.story!.id)) ?? {}), answer: (story ?? saved).trim(), savedOn: today })}
          >
            Save the story
          </button>
        </div>
      )}
      {prep.dp.length > 0 && (
        <p className="text-[13px] text-ink-2" data-testid="prep-dp">
          5 · 1D DP: {prep.dp.map(title).join(' · ')}
        </p>
      )}
      {prep.review.length > 0 && (
        <p className="text-[13px] text-ink-2" data-testid="prep-review">
          6 · Review: {prep.review.map((r) => title(r.exerciseId)).join(' · ')}
        </p>
      )}
    </section>
  )
}
