'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import Markdown from '@/components/markdown'
import CodeView from '@/components/code-view'
import { ChoiceInput, ExplainInput, OutputInput, ReorderInput } from '@/components/rep/answer-inputs'
import { TestResults } from '@/components/rep/results'
import { DAY_BY_DATE, DAY_OF_EXERCISE } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'
import { skillName } from '@/data/skills'
import { firstDifference, hasBlanks, outputMatches } from '@/lib/answers'
import { localDate, shortDate } from '@/lib/dates'
import { REP_TYPE_LABEL, KIND_VERB } from '@/lib/labels'
import { followingExercise, missingPrerequisites, retrievalTypeFor } from '@/lib/progress'
import { getRunner, type RunResult } from '@/lib/python/runner'
import { buildRepairSet, createSession, findExercise, getSession, newId } from '@/lib/sessions'
import {
  CoachError,
  compactMastery,
  getAnotherRep,
  recentMistakes,
  requestDiagnosis,
  requestExplanationCheck,
  requestFollowUp,
  requestHint,
} from '@/lib/coach/client'
import { MISTAKE_LABEL, type Diagnosis } from '@/lib/coach/schemas'
import type { Attempt, Exercise, Mode } from '@/lib/types'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="h-full min-h-[220px] animate-pulse bg-surface" />,
})

function defaultMode(e: Exercise): Mode {
  if (e.repType === 'interview') return 'interview'
  if (['recognize', 'trace', 'complete', 'recall', 'microbuild'].includes(e.stage)) return 'learn'
  return 'practice'
}

/** Deterministic shuffle so a reload shows the same order, never the solved one. */
function shuffledOrder(n: number, seed: string): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (order.every((v, i) => v === i) && n > 1) [order[0], order[1]] = [order[1], order[0]]
  return order
}

function blankStarter(e: Exercise): string {
  if (e.starterCode) return e.starterCode
  return ''
}

type Phase = 'idle' | 'running' | 'passed' | 'failed'

export default function RepWorkspace({ exerciseId, sessionId, fromId, initialMode }: { exerciseId: string; sessionId?: string; fromId?: string; initialMode?: Mode }) {
  const router = useRouter()
  const { repo, attempts, mastery, today, loaded } = useReps()
  const exercise = findExercise(repo, exerciseId)
  const session = getSession(repo, sessionId)

  if (!exercise) {
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 py-16">
        <p className="text-muted">{loaded ? 'That rep does not exist.' : 'Loading…'}</p>
        <Link href="/" className="btn mt-4">
          Back to Today
        </Link>
      </main>
    )
  }
  return <Workspace key={exercise.id} exercise={exercise} session={session} fromId={fromId} initialMode={initialMode} router={router} ctx={{ repo, attempts, mastery, today }} />
}

interface WorkspaceProps {
  exercise: Exercise
  session: ReturnType<typeof getSession>
  fromId?: string
  initialMode?: Mode
  router: ReturnType<typeof useRouter>
  ctx: Pick<ReturnType<typeof useReps>, 'repo' | 'attempts' | 'mastery' | 'today'>
}

function Workspace({ exercise: ex, session, fromId, initialMode, router, ctx }: WorkspaceProps) {
  const { repo, attempts, mastery, today } = ctx
  const dayDate = DAY_OF_EXERCISE[fromId ?? ex.id] ?? today
  const day = DAY_BY_DATE[dayDate]
  const dayList = useMemo(() => day?.sections.flatMap((s) => s.exercises.map((e) => ({ e, s }))) ?? [], [day])
  const position = dayList.findIndex((x) => x.e.id === ex.id)
  const section = position >= 0 ? dayList[position].s : undefined
  const problem = ex.problemId ? PROBLEM_BY_ID[ex.problemId] : undefined

  const [mode, setMode] = useState<Mode>(() => initialMode ?? defaultMode(ex))
  const [runItBack, setRunItBack] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [announce, setAnnounce] = useState('')

  // Answers
  const [code, setCode] = useState(() => repo.draft(ex.id) ?? blankStarter(ex))
  const [choice, setChoice] = useState<number | null>(null)
  const [outputText, setOutputText] = useState('')
  const [order, setOrder] = useState<number[]>(() => shuffledOrder(ex.lines?.length ?? 0, ex.id))
  const [explainText, setExplainText] = useState('')
  const [rubricChecked, setRubricChecked] = useState<boolean[]>(() => (ex.rubric ?? []).map(() => false))
  const [complexityGuess, setComplexityGuess] = useState('')
  const [showComplexity, setShowComplexity] = useState(false)

  // Feedback
  const [result, setResult] = useState<RunResult | null>(null)
  const [submittedResult, setSubmittedResult] = useState(false)
  const [outputFeedback, setOutputFeedback] = useState<string | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [aiHints, setAiHints] = useState<string[]>([])
  const [solutionShown, setSolutionShown] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)

  // Coach
  const [coachBusy, setCoachBusy] = useState<string | null>(null)
  const [coachError, setCoachError] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [followUps, setFollowUps] = useState<string[] | null>(null)
  const [aiMet, setAiMet] = useState<boolean[] | undefined>()
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const [pyStatus, setPyStatus] = useState(() => getRunner().status)
  useEffect(() => getRunner().onStatus(setPyStatus), [])

  const attemptRef = useRef<Attempt | null>(null)
  const startedAt = useRef(new Date())
  const [elapsed, setElapsed] = useState(0)

  const retrievalType = useMemo(
    () => retrievalTypeFor(ex, attempts, { runItBack, review: session?.kind === 'review' }),
    // Classified once per attempt start, not on every new attempt row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ex.id, runItBack, session?.kind],
  )
  const prior = attempts.filter((a) => a.exerciseId === ex.id && a.passed && a.completedAt)
  const missing = ex.repType === 'capstone' ? missingPrerequisites(ex, mastery) : []

  const isCode = ex.kind === 'code'
  const hints = ex.hints ?? []
  const allHints = [...hints.slice(0, hintsShown), ...aiHints]

  // Elapsed timer (shown in Interview mode).
  useEffect(() => {
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current.getTime()) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [])

  // Load Python as soon as a rep that needs it is open.
  useEffect(() => {
    if (ex.kind === 'code' || ex.kind === 'reorder') void getRunner().ensure().catch(() => undefined)
  }, [ex.kind])

  // Drafts: saved locally after a pause in typing, synced later in the background.
  useEffect(() => {
    if (!isCode || phase === 'passed') return
    const t = window.setTimeout(() => void repo.saveDraft(ex.id, code), 800)
    return () => window.clearTimeout(t)
  }, [code, isCode, ex.id, repo, phase])

  // ── attempt bookkeeping ────────────────────────────────────────────────────

  const ensureAttempt = useCallback((): Attempt => {
    if (attemptRef.current) return attemptRef.current
    const now = new Date().toISOString()
    attemptRef.current = {
      id: newId(),
      exerciseId: ex.id,
      date: localDate(),
      skills: ex.skills,
      stage: ex.stage,
      mode,
      passed: false,
      attemptsBeforePass: 0,
      hintsUsed: 0,
      solutionViewed: false,
      runtimeErrors: [],
      startedAt: startedAt.current.toISOString(),
      retrievalType,
      sessionKind: session?.kind,
      updatedAt: now,
    }
    return attemptRef.current
  }, [ex, mode, retrievalType, session?.kind])

  const persist = useCallback(
    (a: Attempt) => {
      attemptRef.current = a
      void repo.recordAttempt(a, ex)
    },
    [repo, ex],
  )

  // ── run & submit ───────────────────────────────────────────────────────────

  const runCode = useCallback(
    async (source: string, includeHidden: boolean) => {
      const tests = (ex.tests ?? []).filter((t) => includeHidden || !t.hidden)
      return getRunner().run(source, tests)
    },
    [ex.tests],
  )

  const onRun = useCallback(async () => {
    if (ex.kind !== 'code' || phase === 'running') return
    setPhase('running')
    setAnnounce('Running…')
    const r = await runCode(code, false)
    setResult(r)
    setSubmittedResult(false)
    setPhase('idle')
    const p = r.tests.filter((t) => t.passed).length
    setAnnounce(r.error ? 'Your code raised an error.' : r.tests.length ? `${p} of ${r.tests.length} visible tests pass.` : 'Ran.')
  }, [ex.kind, phase, runCode, code])

  const finish = useCallback(
    (passed: boolean, detail: { code?: string; answer?: string; error?: string | null }) => {
      const a = ensureAttempt()
      const now = new Date()
      if (passed) {
        const done: Attempt = {
          ...a,
          mode,
          passed: true,
          code: detail.code ?? a.code,
          answer: detail.answer ?? a.answer,
          completedAt: now.toISOString(),
          durationSeconds: Math.round((now.getTime() - startedAt.current.getTime()) / 1000),
          updatedAt: now.toISOString(),
        }
        persist(done)
        setPhase('passed')
        setAnnounce('Rep complete.')
      } else {
        const failed: Attempt = {
          ...a,
          mode,
          code: detail.code ?? a.code,
          answer: detail.answer ?? a.answer,
          attemptsBeforePass: a.attemptsBeforePass + 1,
          runtimeErrors: detail.error ? [...a.runtimeErrors, detail.error].slice(-5) : a.runtimeErrors,
          updatedAt: now.toISOString(),
        }
        persist(failed)
        setPhase('failed')
      }
    },
    [ensureAttempt, mode, persist],
  )

  const onSubmit = useCallback(async () => {
    if (phase === 'running' || phase === 'passed') return
    setCoachError(null)
    switch (ex.kind) {
      case 'choice': {
        if (choice === null) return setAnnounce('Pick an answer first.')
        const ok = choice === ex.answer
        finish(ok, { answer: String(choice) })
        if (!ok) setAnnounce('Not quite. Try again.')
        return
      }
      case 'output': {
        if (!outputText.trim()) return setAnnounce('Type the output first.')
        const ok = outputMatches(outputText, ex.expectedOutput ?? '')
        if (!ok) {
          const d = firstDifference(outputText, ex.expectedOutput ?? '')
          setOutputFeedback(d ? `Line ${d.line} differs. You wrote: ${d.given}` : 'Not quite.')
          setAnnounce('Not quite. Trace it again.')
        } else setOutputFeedback(null)
        finish(ok, { answer: outputText })
        return
      }
      case 'code':
      case 'reorder': {
        const source = ex.kind === 'reorder' ? order.map((i) => ex.lines![i]).join('\n') : code
        if (ex.kind === 'code' && hasBlanks(source)) return setAnnounce('Fill in every ____ first.')
        if (ex.kind === 'code' && !source.trim()) return setAnnounce('Write some code first.')
        setPhase('running')
        setAnnounce('Checking…')
        const r = await runCode(source, true)
        setResult(r)
        setSubmittedResult(true)
        if (r.infraError) {
          setPhase('idle')
          setAnnounce('Python could not run. Try again.')
          return
        }
        const ok = !r.error && !r.timedOut && r.tests.length > 0 && r.tests.every((t) => t.passed)
        const canonical = ex.kind === 'reorder' && order.every((v, i) => v === i)
        finish(ok || canonical, { code: source, error: r.error })
        if (!(ok || canonical)) {
          const p = r.tests.filter((t) => t.passed).length
          setAnnounce(r.error ? 'Your code raised an error.' : `${p} of ${r.tests.length} tests pass.`)
        }
        return
      }
      case 'explain': {
        if (explainText.trim().length < 40) return setAnnounce('Write a fuller explanation first (a few sentences).')
        const covered = rubricChecked.filter(Boolean).length
        const need = Math.ceil((ex.rubric?.length ?? 1) * 0.6)
        finish(covered >= need, { answer: explainText })
        if (covered < need) setAnnounce(`Your explanation should cover at least ${need} of the ${ex.rubric?.length} points. Add the missing ones.`)
        return
      }
    }
  }, [phase, ex, choice, outputText, order, code, runCode, finish, explainText, rubricChecked])

  // Cmd/Ctrl+Enter submits for non-editor reps.
  useEffect(() => {
    if (ex.kind === 'code') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        void onSubmit()
      }
      if (ex.kind === 'choice' && /^[1-9]$/.test(e.key) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLInputElement && e.target.type === 'text')) {
        const i = Number(e.key) - 1
        if (i < (ex.options?.length ?? 0) && phase !== 'passed') setChoice(i)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ex.kind, ex.options, onSubmit, phase])

  // ── hints & solution ───────────────────────────────────────────────────────

  const countHint = useCallback(() => {
    const a = ensureAttempt()
    persist({ ...a, hintsUsed: a.hintsUsed + 1, updatedAt: new Date().toISOString() })
  }, [ensureAttempt, persist])

  const nextHint = async () => {
    if (hintsShown < hints.length) {
      setHintsShown((n) => n + 1)
      countHint()
      return
    }
    // Static hints exhausted: one tailored hint on request.
    setCoachBusy('hint')
    setCoachError(null)
    try {
      const failing = result?.tests.find((t) => !t.passed)
      const { hint } = await requestHint({
        title: ex.title,
        prompt: ex.prompt,
        skills: ex.skills,
        code: ex.kind === 'code' ? code : ex.kind === 'output' ? outputText : '',
        level: Math.min(4, allHints.length + 1),
        previousHints: allHints,
        failure: failing ? `${failing.call}: expected ${failing.expected}, got ${failing.actual ?? failing.error}` : (result?.error ?? undefined),
      })
      setAiHints((h) => [...h, hint])
      countHint()
    } catch (e) {
      setCoachError((e as Error).message)
    } finally {
      setCoachBusy(null)
    }
  }

  const viewSolution = () => {
    setSolutionShown(true)
    setMoreOpen(false)
    const a = ensureAttempt()
    persist({ ...a, solutionViewed: true, updatedAt: new Date().toISOString() })
  }

  // ── run it back ────────────────────────────────────────────────────────────

  const doRunItBack = () => {
    attemptRef.current = null
    startedAt.current = new Date()
    setRunItBack(true)
    setPhase('idle')
    setResult(null)
    setHintsShown(0)
    setAiHints([])
    setSolutionShown(false)
    setDiagnosis(null)
    setFollowUps(null)
    setChoice(null)
    setOutputText('')
    setOutputFeedback(null)
    setOrder(shuffledOrder(ex.lines?.length ?? 0, `${ex.id}-again-${Date.now()}`))
    setExplainText('')
    setRubricChecked((ex.rubric ?? []).map(() => false))
    setCode(blankStarter(ex))
    setConfidence(null)
    setAnnounce('Explanation closed. Run it back from memory.')
  }

  // ── navigation ─────────────────────────────────────────────────────────────

  const nextHref = useMemo(() => {
    if (session) {
      const i = session.exerciseIds.indexOf(ex.id)
      const next = session.exerciseIds[i + 1]
      if (next) return `/rep/${next}?s=${session.id}`
      if (session.returnTo) return `/rep/${session.returnTo}`
      return '/'
    }
    if (day) {
      const nxt = followingExercise(day, fromId ?? ex.id)
      return nxt ? `/rep/${nxt.id}` : `/day/${day.date}/summary`
    }
    return '/'
  }, [session, ex.id, day, fromId])

  // ── coach actions ──────────────────────────────────────────────────────────

  const another = async (kind: 'same' | 'harder' | 'easier') => {
    setMoreOpen(false)
    setCoachBusy(kind)
    setCoachError(null)
    try {
      const delta = kind === 'harder' ? 1 : kind === 'easier' ? -1 : 0
      const type = ex.repType === 'capstone' || ex.repType === 'interview' ? 'pattern' : ex.repType === 'cold' ? 'cold' : ex.repType === 'combine' ? 'combine' : ex.repType === 'pattern' ? 'pattern' : 'foundation'
      const { exercise } = await getAnotherRep(repo, mastery, {
        skills: ex.skills.slice(0, 4),
        type,
        difficulty: ex.difficulty + delta,
        format: ex.kind === 'output' && kind !== 'harder' ? 'output' : 'code',
        basedOn: ex,
        count: kind === 'same' ? 2 : 1,
      })
      const q = new URLSearchParams({ from: fromId ?? ex.id })
      if (session) q.set('s', session.id)
      router.push(`/rep/${exercise.id}?${q}`)
    } catch (e) {
      setCoachError(e instanceof CoachError ? e.message : 'Another rep could not be generated this time.')
    } finally {
      setCoachBusy(null)
    }
  }

  const explainMistake = async () => {
    setMoreOpen(false)
    setCoachBusy('diagnose')
    setCoachError(null)
    try {
      const failing = result?.tests.find((t) => !t.passed)
      const a = attemptRef.current
      const d = await requestDiagnosis({
        exercise: { title: ex.title, prompt: ex.prompt, stage: ex.stage },
        code: ex.kind === 'code' ? code : ex.kind === 'output' ? `# predicted output\n${outputText}\n# for code\n${ex.code}` : ex.kind === 'reorder' ? order.map((i) => ex.lines![i]).join('\n') : '',
        failingTest: failing ? { call: failing.call, expected: failing.expected, actual: failing.actual ?? failing.error } : ex.kind === 'output' ? { call: null, expected: ex.expectedOutput ?? '', actual: outputText } : undefined,
        stderr: result?.error ?? undefined,
        skills: ex.skills,
        mastery: compactMastery(ex.skills, mastery),
        recentMistakes: recentMistakes(repo, ex.skills),
        failedSubmissions: a?.attemptsBeforePass ?? 0,
      })
      setDiagnosis(d)
      if (a) persist({ ...a, mistakeType: d.category, mistakeNote: d.diagnosis.slice(0, 200), updatedAt: new Date().toISOString() })
    } catch (e) {
      setCoachError((e as Error).message)
    } finally {
      setCoachBusy(null)
    }
  }

  const startRepair = async () => {
    setMoreOpen(false)
    // Deterministic: primitives from the diagnosis if we have one, otherwise the weakest skills involved.
    const fromDiagnosis = diagnosis?.repairSkills ?? []
    const weakest = [...ex.skills, ...ex.prerequisites].sort((a, b) => (mastery[a]?.score ?? 0) - (mastery[b]?.score ?? 0)).slice(0, 4)
    const ids = buildRepairSet(fromDiagnosis.length ? fromDiagnosis : weakest, mastery, attempts, today)
    if (!ids.length) {
      setCoachError('No repair reps available for these skills yet.')
      return
    }
    const s = await createSession(repo, 'repair', `Repair Reps · ${ex.title}`, ids, ex.id)
    router.push(`/rep/${ids[0]}?s=${s.id}`)
  }

  const followUp = async () => {
    setMoreOpen(false)
    setCoachBusy('followup')
    setCoachError(null)
    try {
      const r = await requestFollowUp({ title: ex.title, prompt: ex.prompt, code })
      setFollowUps(r.questions)
    } catch (e) {
      setCoachError((e as Error).message)
    } finally {
      setCoachBusy(null)
    }
  }

  const checkExplanation = async () => {
    setCoachBusy('verify')
    setCoachError(null)
    try {
      const r = await requestExplanationCheck({ title: ex.title, prompt: ex.prompt, rubric: ex.rubric ?? [], explanation: explainText })
      setAiMet(r.met)
      setAiFeedback(r.feedback)
    } catch (e) {
      setCoachError((e as Error).message)
    } finally {
      setCoachBusy(null)
    }
  }

  const rate = (n: number) => {
    setConfidence(n)
    const a = attemptRef.current
    if (a?.completedAt) persist({ ...a, confidence: n as Attempt['confidence'], updatedAt: new Date().toISOString() })
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const passed = phase === 'passed'
  const assisted = hintsShown + aiHints.length > 0 || solutionShown
  const locked = passed
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const showHintsAllowed = mode !== 'interview'
  const hasFeedback =
    passed || phase === 'failed' || Boolean(coachError || coachBusy || aiFeedback || result || showComplexity)
  const crumb = session ? session.title : day ? `${shortDate(day.date)} · ${section?.title ?? ''}` : 'Rep'
  const counter = session ? `${session.exerciseIds.indexOf(ex.id) + 1} of ${session.exerciseIds.length}` : position >= 0 ? `Rep ${position + 1} of ${dayList.length}` : ex.generated ? 'Generated rep' : ''

  return (
    <main className="grid flex-1 grid-cols-1 lg:h-[calc(100vh-48px)] lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
      {/* Prompt */}
      <section aria-labelledby="rep-title" className="flex flex-col gap-5 overflow-y-auto border-line px-6 py-6 lg:border-r lg:px-8">
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <Link href={session ? '/' : day ? `/day/${day.date}` : '/'} className="hover:text-ink">
            {crumb}
          </Link>
          {counter && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{counter}</span>
            </>
          )}
        </div>

        <div>
          <p className="label mb-1.5">
            {runItBack ? 'Run it back' : REP_TYPE_LABEL[ex.repType]}
            {retrievalType === 'cold' && !runItBack && ex.repType !== 'cold' ? ' · Cold' : ''}
          </p>
          <h1 id="rep-title" className="text-[22px] font-semibold tracking-tight">
            {ex.title}
          </h1>
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Target skills">
            {ex.skills.map((s) => (
              <li key={s}>
                <Link href={`/skills/${s}`} className="rounded-full border border-line px-2 py-0.5 text-[11.5px] text-muted hover:border-line-strong hover:text-ink">
                  {skillName(s)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {missing.length > 0 && !passed && (
          <p className="rounded-md bg-warn-soft px-3 py-2 text-[13px] text-warn">
            Not yet practiced: {missing.map(skillName).join(', ')}. You can try anyway, or do those reps first.
          </p>
        )}

        <Markdown text={ex.prompt} />
        {ex.code && ex.kind !== 'code' && <CodeView code={ex.code} />}

        {ex.examples && ex.examples.length > 0 && (
          <div className="flex flex-col gap-2">
            {ex.examples.map((x, i) => (
              <div key={i} className="rounded-md border border-line bg-surface px-3 py-2 text-[13px]">
                <p className="mono text-ink-2">
                  <span className="text-faint">in </span>
                  {x.input}
                </p>
                <p className="mono text-ink-2">
                  <span className="text-faint">out </span>
                  {x.output}
                </p>
                {x.note && <p className="mt-1 text-muted">{x.note}</p>}
              </div>
            ))}
          </div>
        )}

        {problem && (
          <p className="text-[13px] text-muted">
            Capstone for{' '}
            <a href={problem.leetcode} target="_blank" rel="noreferrer" className="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink">
              LeetCode {problem.number}: {problem.title} ↗
            </a>
          </p>
        )}

        {ex.note && (mode === 'learn' || showNote) && (
          <div className="rounded-md border-l-2 border-accent bg-accent-soft/60 px-3.5 py-2.5">
            <p className="label mb-1 !text-accent">Reminder</p>
            <Markdown text={ex.note} className="!text-[13.5px]" />
          </div>
        )}
        {ex.note && mode !== 'learn' && !showNote && (
          <button type="button" className="self-start text-[12px] text-muted underline decoration-line-strong underline-offset-2 hover:text-ink" onClick={() => setShowNote(true)}>
            Show concept reminder
          </button>
        )}

        {allHints.length > 0 && (
          <div className="flex flex-col gap-2" aria-live="polite">
            {allHints.map((h, i) => (
              <div key={i} className="rounded-md border border-line px-3.5 py-2.5">
                <p className="label mb-1">Hint {i + 1}</p>
                <Markdown text={h} className="!text-[13.5px]" />
              </div>
            ))}
          </div>
        )}

        {diagnosis && (
          <div className="rounded-md border border-line px-3.5 py-3" aria-live="polite">
            <p className="label mb-1">Mistake · {MISTAKE_LABEL[diagnosis.category]}</p>
            <p className="text-[14px] text-ink-2">{diagnosis.diagnosis}</p>
            {diagnosis.missingPrerequisite && <p className="mt-1.5 text-[13px] text-muted">Likely missing: {skillName(diagnosis.missingPrerequisite)}</p>}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {diagnosis.nextAction === 'retry' ? (
                <span className="text-[13px] text-muted">Recommended: fix it and resubmit.</span>
              ) : (
                <button type="button" className="btn" onClick={startRepair}>
                  {diagnosis.nextAction === 'syntax-reps' ? 'Repair Reps (syntax)' : diagnosis.nextAction === 'pattern-reps' ? 'Repair Reps (pattern)' : 'Edge-case reps'}
                </button>
              )}
            </div>
          </div>
        )}

        {followUps && (
          <div className="rounded-md border border-line px-3.5 py-3">
            <p className="label mb-1.5">Interview follow-up</p>
            <ol className="list-decimal pl-5 text-[14px] text-ink-2">
              {followUps.map((q, i) => (
                <li key={i} className="mb-1">
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}

        {(passed || solutionShown) && ex.explanation && !runItBack && (
          <div className="rounded-md border border-line bg-surface px-3.5 py-3">
            <p className="label mb-1">Why it works</p>
            <Markdown text={ex.explanation} className="!text-[13.5px]" />
            {ex.complexity && (
              <p className="mono mt-2 text-[12.5px] text-muted">
                time {ex.complexity.time} · space {ex.complexity.space}
              </p>
            )}
          </div>
        )}

        {solutionShown && ex.solution && !passed && (
          <div>
            <p className="label mb-1">Solution</p>
            <CodeView code={ex.solution} />
            <p className="mt-2 text-[12.5px] text-muted">Read it, close it, then write it yourself. This rep now earns reduced credit.</p>
          </div>
        )}
        {solutionShown && ex.kind === 'output' && !passed && (
          <div>
            <p className="label mb-1">Output</p>
            <pre className="code-view">{ex.expectedOutput}</pre>
          </div>
        )}
        {solutionShown && ex.kind === 'choice' && !passed && ex.options && ex.answer !== undefined && (
          <p className="text-[13.5px]">
            Answer: <span className="font-medium">{ex.options[ex.answer]}</span>
          </p>
        )}
      </section>

      {/* Answer */}
      <section aria-label="Answer" className="flex min-h-0 flex-col bg-bg">
        <div className="flex h-11 shrink-0 items-center gap-3 border-b border-line px-4">
          <span className="text-[13px] font-medium">{KIND_VERB[ex.kind]}</span>
          {mode === 'interview' && (
            <span className="mono text-[12px] tabular-nums text-muted" aria-label={`Elapsed ${mm} minutes ${ss} seconds`}>
              {mm}:{ss}
            </span>
          )}
          {prior.length > 0 && !passed && <span className="text-[12px] text-faint">Done {prior.length}× before</span>}
          {(ex.kind === 'code' || ex.kind === 'reorder') && (pyStatus === 'loading' || pyStatus === 'error') && (
            <span className="text-[12px] text-faint" role="status">
              {pyStatus === 'loading' ? 'Loading Python…' : 'Python unavailable, retrying on next run'}
            </span>
          )}
          <div role="radiogroup" aria-label="Mode" className="ml-auto flex rounded-md border border-line p-0.5">
            {(['learn', 'practice', 'interview'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`rounded px-2 py-0.5 text-[12px] capitalize ${mode === m ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={`min-h-0 flex-1 ${isCode ? '' : 'overflow-y-auto px-5 py-5'}`}>
          {ex.kind === 'code' && (
            <CodeEditor
              value={code}
              onChange={setCode}
              onRun={onRun}
              onSubmit={onSubmit}
              assist={mode !== 'interview'}
              readOnly={locked}
              autoFocus
              placeholder={runItBack ? 'From memory…' : 'Write your solution…'}
            />
          )}
          {ex.kind === 'choice' && <ChoiceInput options={ex.options ?? []} value={choice} onChange={setChoice} locked={locked} correct={passed ? ex.answer : undefined} />}
          {ex.kind === 'output' && <OutputInput value={outputText} onChange={setOutputText} locked={locked} onSubmit={onSubmit} />}
          {ex.kind === 'reorder' && <ReorderInput lines={ex.lines ?? []} order={order} onChange={setOrder} locked={locked} />}
          {ex.kind === 'explain' && (
            <ExplainInput
              value={explainText}
              onChange={setExplainText}
              rubric={ex.rubric ?? []}
              checked={rubricChecked}
              onCheck={(i, v) => setRubricChecked((r) => r.map((x, j) => (j === i ? v : x)))}
              locked={locked}
              aiMet={aiMet}
            />
          )}
        </div>

        {/* Feedback */}
        <p className="sr-only" role="status" aria-live="polite">
          {announce}
        </p>
        <div className={`max-h-[42vh] shrink-0 overflow-y-auto border-t border-line px-4 py-3 ${hasFeedback ? '' : 'hidden'}`}>
          {coachError && <p className="mb-2 text-[13px] text-warn">{coachError}</p>}
          {coachBusy && ['same', 'harder', 'easier'].includes(coachBusy) && <p className="mb-2 text-[13px] text-muted">Getting another rep and checking it runs…</p>}
          {passed && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-[14px] font-medium text-pass">✓ Rep complete{runItBack ? ' · reconstructed' : ''}</p>
              {assisted && !runItBack && <p className="text-[13px] text-muted">You used help. Close the explanation and run it back from memory.</p>}
              <div className="ml-auto flex items-center gap-1 text-[12px] text-muted" role="group" aria-label="How confident do you feel?">
                <span className="mr-1">Confidence</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => rate(n)} aria-pressed={confidence === n} className={`size-6 rounded border text-[11px] ${confidence === n ? 'border-ink bg-ink text-white' : 'border-line hover:border-line-strong'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          {phase === 'failed' && ex.kind === 'choice' && <p className="text-[13.5px] text-fail">✗ Not quite. Try again.</p>}
          {phase === 'failed' && ex.kind === 'output' && <p className="text-[13.5px] text-fail">✗ {outputFeedback ?? 'Not quite.'}</p>}
          {phase === 'failed' && ex.kind === 'explain' && <p className="text-[13.5px] text-fail">✗ {announce}</p>}
          {passed && ex.kind === 'output' && <pre className="code-view !py-2">{ex.expectedOutput}</pre>}
          {aiFeedback && <p className="mt-2 text-[13.5px] text-ink-2">{aiFeedback}</p>}
          {result && (isCode || ex.kind === 'reorder') && <TestResults result={result} mode={mode} submitted={submittedResult} />}
          {showComplexity && ex.complexity && (
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-[13px] text-muted" htmlFor="cx">
                Your complexity, before you look
              </label>
              <input id="cx" className="input mono !text-[13px]" value={complexityGuess} onChange={(e) => setComplexityGuess(e.target.value)} placeholder="time O(?) · space O(?)" />
              {complexityGuess.trim().length > 3 && (
                <p className="mono text-[12.5px] text-muted">
                  Reference: time {ex.complexity.time} · space {ex.complexity.space}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Actions */}
        {/* Right padding leaves Winston's spot at the end of the bar clear. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line py-2.5 pl-4 pr-24">
          {!passed ? (
            <>
              {ex.kind === 'code' && (
                <button type="button" className="btn" onClick={onRun} disabled={phase === 'running'}>
                  Run <span className="kbd">⌘↵</span>
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={phase === 'running'} data-testid="submit">
                {phase === 'running' ? 'Running…' : 'Submit'} <span className="kbd !border-white/30 !bg-transparent !text-white/70">{ex.kind === 'code' ? '⇧⌘↵' : '⌘↵'}</span>
              </button>
              {showHintsAllowed && (
                <button type="button" className="btn btn-ghost" onClick={nextHint} disabled={coachBusy !== null}>
                  {coachBusy === 'hint' ? 'Thinking…' : hintsShown < hints.length ? `Hint${hints.length ? ` ${hintsShown + 1}/${hints.length}` : ''}` : 'Hint'}
                </button>
              )}
              {phase === 'failed' && (
                <button type="button" className="btn btn-ghost" onClick={explainMistake} disabled={coachBusy !== null}>
                  {coachBusy === 'diagnose' ? 'Diagnosing…' : 'Explain mistake'}
                </button>
              )}
              {ex.kind === 'explain' && explainText.trim().length > 40 && (
                <button type="button" className="btn btn-ghost" onClick={checkExplanation} disabled={coachBusy !== null}>
                  {coachBusy === 'verify' ? 'Checking…' : 'Check explanation'}
                </button>
              )}
            </>
          ) : (
            <>
              <Link href={nextHref} className="btn btn-primary" data-testid="next-rep" autoFocus>
                {nextHref.endsWith('/summary') ? 'Finish the day' : session && session.exerciseIds.indexOf(ex.id) === session.exerciseIds.length - 1 && session.returnTo ? 'Retry capstone' : 'Next rep'} →
              </Link>
              <button type="button" className="btn" onClick={() => another('same')} disabled={coachBusy !== null}>
                {coachBusy === 'same' ? 'Finding…' : 'Another rep'}
              </button>
              <button type="button" className={`btn ${assisted ? 'btn-primary !bg-accent !border-accent' : ''}`} onClick={doRunItBack}>
                Run it back
              </button>
            </>
          )}

          <div className="relative ml-auto">
            <button type="button" className="btn btn-ghost" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
              More
            </button>
            {moreOpen && (
              <div role="menu" className="absolute bottom-full right-0 z-20 mb-1 flex w-56 flex-col rounded-lg border border-line bg-bg p-1 shadow-[0_8px_30px_rgba(0,0,0,0.08)]" onKeyDown={(e) => e.key === 'Escape' && setMoreOpen(false)}>
                <MenuItem onClick={() => another('easier')} disabled={coachBusy !== null}>
                  Easier rep
                </MenuItem>
                <MenuItem onClick={() => another('harder')} disabled={coachBusy !== null}>
                  Harder rep
                </MenuItem>
                {!passed && <MenuItem onClick={() => another('same')} disabled={coachBusy !== null}>Another rep</MenuItem>}
                {mode === 'interview' && !passed && <MenuItem onClick={() => { setMoreOpen(false); void nextHint() }}>Hint</MenuItem>}
                <MenuItem onClick={startRepair}>Repair Reps</MenuItem>
                {(ex.repType === 'capstone' || ex.repType === 'pattern' || ex.repType === 'interview') && isCode && (
                  <MenuItem onClick={followUp} disabled={coachBusy !== null}>
                    Interview follow-up
                  </MenuItem>
                )}
                {ex.complexity && <MenuItem onClick={() => { setShowComplexity(true); setMoreOpen(false) }}>Complexity</MenuItem>}
                {isCode && !passed && <MenuItem onClick={() => { setCode(blankStarter(ex)); setMoreOpen(false) }}>Reset code</MenuItem>}
                {!passed && !solutionShown && <MenuItem onClick={viewSolution}>Show solution</MenuItem>}
                <MenuItem onClick={() => { setMoreOpen(false); router.push(nextHref) }}>Skip for now</MenuItem>
              </div>
            )}
          </div>
        </div>

      </section>
    </main>
  )
}

function MenuItem({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled} className="rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-surface-2 disabled:opacity-40">
      {children}
    </button>
  )
}
