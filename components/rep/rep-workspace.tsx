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
import { DAY_BY_DATE, DAY_OF_EXERCISE, DAYS } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'
import { skillName } from '@/data/skills'
import { firstDifference, hasBlanks, outputMatches } from '@/lib/answers'
import { localDate, shortDate } from '@/lib/dates'
import { KIND_VERB } from '@/lib/labels'
import { kindOf } from '@/components/rep-kind'
import { RepsBars } from '@/components/motif'
import BasicsPanel from '@/components/rep/basics-panel'
import { primersFor } from '@/data/primers'
import { movesFor } from '@/data/primers/moves'
import { BRIEFS } from '@/data/briefs'
import { walkthroughFor } from '@/data/walkthroughs'
import { IconArrowRight, IconBug, IconBulb, IconClock, IconDots, IconExternal, IconPlay, IconRotate, IconSpark, IconX } from '@/components/icons'
import { followingExercise, lockedByGate, missingPrerequisites, nextInOrder, passedSet, retrievalTypeFor } from '@/lib/progress'
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
import type { Attempt, Exercise, Mode, Section } from '@/lib/types'

const SPLIT_DEFAULT = 38
const SPLIT_MIN = 26
const SPLIT_MAX = 56

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[220px] flex-col gap-2.5 p-5" aria-hidden="true">
      <div className="skeleton h-3.5 w-48" />
      <div className="skeleton h-3.5 w-32" />
      <div className="skeleton h-3.5 w-40" />
    </div>
  ),
})

function defaultMode(e: Exercise): Mode {
  if (e.repType === 'interview') return 'interview'
  if (e.style === 'debug') return 'practice'
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

const DRAFT_KEY = (id: string) => `reps-draft:${id}`
function localDraft(id: string): string | undefined {
  try {
    return window.localStorage.getItem(DRAFT_KEY(id)) ?? undefined
  } catch {
    return undefined // private mode, storage disabled, or not in a browser
  }
}
function saveLocalDraft(id: string, code: string) {
  try {
    window.localStorage.setItem(DRAFT_KEY(id), code)
  } catch {
    /* the synced draft still saves */
  }
}

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
  const lockDay = DAY_BY_DATE[DAY_OF_EXERCISE[exercise.id]]
  const gate = !session && lockDay ? lockedByGate(lockDay, exercise.id, attempts) : undefined
  if (gate) return <GateLock gate={gate} attempts={attempts} exercise={exercise} />
  return <Workspace key={exercise.id} exercise={exercise} session={session} fromId={fromId} initialMode={initialMode} router={router} ctx={{ repo, attempts, mastery, today }} />
}

/** Behind an uncleared mastery check: no way round it, only through it. */
function GateLock({ gate, attempts, exercise }: { gate: Section; attempts: Attempt[]; exercise: Exercise }) {
  const passed = passedSet(attempts)
  // A check can span two days: count every part of it.
  const left = DAYS.flatMap((d) => d.sections.filter((s) => s.gate && s.id === gate.id).flatMap((s) => s.exercises)).filter((e) => !passed.has(e.id))
  const total = DAYS.flatMap((d) => d.sections.filter((s) => s.gate && s.id === gate.id).flatMap((s) => s.exercises)).length
  const preview = exercise.repType === 'capstone'
  return (
    <main className="mx-auto w-full max-w-[620px] px-5 py-16">
      <p className="eyebrow text-faint">Locked</p>
      <h1 className="h1 mt-2">Pass the {gate.title} first</h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
        Everything after it builds on dictionaries. Each rep in the check has to be passed <span className="font-medium text-ink">without opening the solution</span>. Hints and Basics are fine.
      </p>
      <p className="mt-6 label">Still to clear · {left.length} of {total}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {left.map((e) => (
          <li key={e.id}>
            <Link href={`/rep/${e.id}`} className="block rounded-lg px-3 py-2 text-[14px] text-ink-2 hover:bg-surface">
              {e.title}
            </Link>
          </li>
        ))}
      </ul>
      {left[0] && (
        <Link href={`/rep/${left[0].id}`} className="btn btn-accent btn-lg mt-6">
          Continue the check <IconArrowRight size={15} />
        </Link>
      )}
      {preview && (
        <section aria-labelledby="preview-h" data-testid="locked-preview" className="mt-10 rounded-2xl bg-bg p-6 shadow-[0_0_0_1px_var(--line)]">
          <p className="eyebrow text-muted">Preview · where this ladder is heading</p>
          <h2 id="preview-h" className="h2 mt-1.5">
            {exercise.title}
          </h2>
          <Markdown text={exercise.prompt} className="mt-3 !text-[14.5px]" />
          {exercise.examples && exercise.examples.length > 0 && (
            <div className="well mt-4 divide-y divide-line overflow-hidden">
              {exercise.examples.map((x, i) => (
                <div key={i} className="grid grid-cols-[34px_1fr] gap-x-3 gap-y-1 px-4 py-3 text-[13px]">
                  <span className="mono text-muted">in</span>
                  <span className="mono break-all text-ink-2">{x.input}</span>
                  <span className="mono text-muted">out</span>
                  <span className="mono break-all font-medium text-ink">{x.output}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-[13px] text-muted">You can read it now. The editor opens when the check is cleared.</p>
        </section>
      )}
    </main>
  )
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
  const dayList = useMemo(() => day?.sections.filter((s) => !s.optional).flatMap((s) => s.exercises.map((e) => ({ e, s }))) ?? [], [day])
  const position = dayList.findIndex((x) => x.e.id === ex.id)
  const section = position >= 0 ? dayList[position].s : day?.sections.find((s) => s.exercises.some((e) => e.id === ex.id))
  const isExtra = position < 0 && Boolean(section?.optional)
  const problem = ex.problemId ? PROBLEM_BY_ID[ex.problemId] : undefined

  const [mode, setMode] = useState<Mode>(() => initialMode ?? defaultMode(ex))
  const [runItBack, setRunItBack] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [announce, setAnnounce] = useState('')

  // Answers
  const [code, setCode] = useState(() => repo.draft(ex.id) ?? localDraft(ex.id) ?? blankStarter(ex))
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
  const [showBasics, setShowBasics] = useState(false)
  const basicsCounted = useRef(false)
  const [confidence, setConfidence] = useState<number | null>(null)

  // Coach
  const [coachBusy, setCoachBusy] = useState<string | null>(null)
  const [coachError, setCoachError] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [followUps, setFollowUps] = useState<string[] | null>(null)
  const [aiMet, setAiMet] = useState<boolean[] | undefined>()
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const [focusToken, setFocusToken] = useState(0)
  const [modeHint, setModeHint] = useState(false)
  const [debugFailing, setDebugFailing] = useState<number | null>(null)

  // Draggable split between instructions and workspace, remembered per browser.
  const splitHost = useRef<HTMLDivElement>(null)
  const [split, setSplit] = useState(SPLIT_DEFAULT)
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem('reps-split'))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of a stored preference
      if (v >= SPLIT_MIN && v <= SPLIT_MAX) setSplit(v)
    } catch {
      /* storage blocked */
    }
  }, [])
  const setSplitPersist = (v: number) => {
    const c = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, v))
    setSplit(c)
    try {
      window.localStorage.setItem('reps-split', String(Math.round(c)))
    } catch {
      /* storage blocked */
    }
  }
  const startDrag = (e: React.PointerEvent) => {
    const host = splitHost.current
    if (!host) return
    e.preventDefault()
    setDragging(true)
    const rect = host.getBoundingClientRect()
    const move = (ev: PointerEvent) => setSplitPersist(((ev.clientX - rect.left) / rect.width) * 100)
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const changeMode = (m: Mode) => {
    setMode(m)
    setModeHint(true)
  }
  useEffect(() => {
    if (!modeHint) return
    const t = window.setTimeout(() => setModeHint(false), 2400)
    return () => window.clearTimeout(t)
  }, [modeHint, mode])

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
  const primers = useMemo(() => primersFor(ex.skills), [ex.skills])
  const moves = useMemo(() => movesFor(ex.skills), [ex.skills])
  const walk = walkthroughFor(ex, section?.id)
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

  // Debug Reps: once Python is ready, show how many tests the broken code fails.
  useEffect(() => {
    if (ex.style !== 'debug' || pyStatus !== 'ready' || debugFailing !== null) return
    let live = true
    void getRunner()
      .run(blankStarter(ex), (ex.tests ?? []).filter((t) => !t.hidden))
      .then((r) => live && setDebugFailing(r.tests.filter((t) => !t.passed).length || (r.error ? 1 : 0)))
    return () => {
      live = false
    }
  }, [ex, pyStatus, debugFailing])

  // Drafts: saved locally after a pause in typing, synced later in the background.
  useEffect(() => {
    if (!isCode || phase === 'passed') return
    // Kept per rep on this device straight away (survives a closed tab), then synced after a short pause.
    saveLocalDraft(ex.id, code)
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

  // Run my code: your own call, separate from the tests. Nothing here is graded or recorded.
  const [customOpen, setCustomOpen] = useState(false)
  const [customCall, setCustomCall] = useState('')
  const [customOut, setCustomOut] = useState<{ text: string; error: boolean } | null>(null)
  const [customBusy, setCustomBusy] = useState(false)
  const runCustom = async () => {
    if (!customCall.trim() || customBusy) return
    setCustomBusy(true)
    const r = await getRunner().run(`${code}\n\n__reps_out = (${customCall.trim()})\nprint(repr(__reps_out))\n`, [])
    setCustomOut(r.infraError ? { text: `Python could not run: ${r.infraError}`, error: true } : r.error ? { text: `${r.stdout}${r.error}`, error: true } : { text: r.stdout.replace(/\n$/, '') || '(nothing printed)', error: false })
    setCustomBusy(false)
  }

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

  // Basics: free on first exposure; on a cold rep, opening it counts once as help.
  const openBasics = () => {
    setShowBasics((v) => !v)
    if (!showBasics && retrievalType === 'cold' && !basicsCounted.current) {
      basicsCounted.current = true
      countHint()
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
    setShowBasics(false)
    basicsCounted.current = false
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
    // The queue just continues: the next rep in the order of the work, whatever day it was first planned for.
    const inOrder = nextInOrder(fromId ?? ex.id)
    if (inOrder) return `/rep/${inOrder.id}`
    if (day) {
      const nxt = followingExercise(day, fromId ?? ex.id)
      if (nxt) return `/rep/${nxt.id}`
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
  // Suggest a call to the rep's own function, e.g. `two_sum(...)`.
  const customPlaceholder = `${/def\s+([A-Za-z_]\w*)\s*\(/.exec(code)?.[1] ?? 'my_function'}(...)`
  /** A check rep passed with the solution open: it does not count until it is run back clean. */
  const checkUncleared = passed && Boolean(ex.cleanPass) && !session && solutionShown
  const assisted = hintsShown + aiHints.length > 0 || solutionShown
  const locked = passed
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const interview = mode === 'interview'
  const isDebug = ex.style === 'debug'
  const kind = kindOf(ex)
  const crumbDay = day ? shortDate(day.date) : null
  const crumbTitle = session ? session.title : (section?.title ?? (ex.generated ? 'Generated rep' : 'Rep'))
  // Outside a session, show where you are in the section: days are a gauge now, not a container.
  const inSection = !session && section ? section.exercises.findIndex((e) => e.id === ex.id) : -1
  const total = session ? session.exerciseIds.length : inSection >= 0 ? section!.exercises.length : dayList.length
  const index = session ? session.exerciseIds.indexOf(ex.id) + 1 : inSection >= 0 ? inSection + 1 : position + 1
  const progressPct = total > 0 && index > 0 ? (index / total) * 100 : 0
  const runnable = ex.kind === 'code' || ex.kind === 'reorder'
  const testsPassed = result?.tests.filter((t) => t.passed).length ?? 0
  const testsTotal = result?.tests.length ?? 0
  const hasFeedback = Boolean(coachError || (coachBusy && ['same', 'harder', 'easier'].includes(coachBusy)) || aiFeedback || result || showComplexity || (phase === 'failed' && !runnable))
  const evidence = ex.skills.map(skillName)
  const runLabel = isDebug ? 'Run tests' : 'Run'
  const submitLabel = isDebug ? 'Submit fix' : 'Submit'

  return (
    <main data-mode={mode} className="flex flex-1 flex-col bg-canvas lg:h-[calc(100dvh-56px)] lg:flex-none lg:overflow-hidden">
      {/* Rep bar: where am I, how far, which mode */}
      <div className="relative flex h-12 shrink-0 items-center gap-4 bg-bg px-4 sm:px-6" style={{ boxShadow: '0 1px 0 var(--hairline)' }}>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {crumbDay && !session && (
            <>
              <Link href={`/day/${day!.date}`} className="shrink-0 text-muted hover:text-ink">
                {crumbDay}
              </Link>
              <span aria-hidden="true" className="text-faint">
                /
              </span>
            </>
          )}
          <span className="truncate font-medium text-ink">{crumbTitle}</span>
        </nav>
        {isExtra && !session && <span className="eyebrow text-faint">Extra rep</span>}
        {ex.cleanPass && !session && section?.gate && <span className="eyebrow text-accent-ink">Mastery check</span>}
        {total > 0 && index > 0 && (
          <div className="hidden items-center gap-3 sm:flex">
            <span className="flex items-baseline gap-1.5">
              <span className="eyebrow text-ink">Rep {index}</span>
              <span className="num text-[12px] text-faint">of {total}{session ? '' : ' in this section'}</span>
            </span>
            <span className="bar bar-thin w-32" aria-hidden="true">
              <span style={{ width: `${progressPct}%`, background: 'var(--accent)' }} />
            </span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          {interview && (
            <span className="mono num inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[14px] font-medium text-ink" aria-label={`Elapsed ${mm} minutes ${ss} seconds`}>
              <IconClock size={14} className="text-muted" />
              {mm}:{ss}
            </span>
          )}
          <div className="relative">
            <div role="radiogroup" aria-label="Mode" className="seg">
              {(['learn', 'practice', 'interview'] as Mode[]).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => changeMode(m)} className="capitalize">
                  {m}
                </button>
              ))}
            </div>
            {modeHint && (
              <p role="status" className="fade-in absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[12px] text-white shadow-lg">
                {MODE_HINT[mode]}
              </p>
            )}
          </div>
        </div>
      </div>

      <div ref={splitHost} className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Instructions */}
        <section
          aria-labelledby="rep-title"
          className="flex min-w-0 shrink-0 flex-col overflow-y-auto bg-bg lg:basis-[var(--split)]"
          style={{ '--split': `${split}%` } as React.CSSProperties}
        >
          {kind.key === 'capstone' && <span aria-hidden="true" className="h-[3px] shrink-0 bg-ink" />}
          <div className="rep-in flex flex-col gap-6 px-6 py-7 lg:px-8">
            {isDebug && !passed && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-[inset_0_0_0_1px_var(--line-strong)]">
                <IconBug size={18} className="shrink-0 text-amber" />
                <div className="min-w-0">
                  <p className="eyebrow text-ink">Bug found</p>
                  <p className="text-[13.5px] text-muted">
                    {debugFailing === null ? 'Checking the broken code…' : `${debugFailing} test${debugFailing === 1 ? '' : 's'} failing. Read it, run it, fix it.`}
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={kind.badgeClass}>
                  <kind.Icon size={13} />
                  {runItBack ? 'Run it back' : kind.badge}
                </span>
                {retrievalType === 'cold' && !runItBack && kind.badge !== 'Cold Rep' && <span className="badge">Cold</span>}
                {!interview && <span className="text-[12px] text-faint">~{Math.round(ex.minutes)} min</span>}
                {prior.length > 0 && !passed && <span className="text-[12px] text-faint">· done {prior.length}× before</span>}
                {!interview && primers.length > 0 && (
                  <button
                    type="button"
                    onClick={openBasics}
                    aria-expanded={showBasics}
                    className={`ml-auto inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors ${
                      showBasics ? 'bg-ink text-white' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                    }`}
                    title={`The basics behind this rep: ${primers.map((x) => x.title).join(', ')}. Concepts only, never the answer.`}
                  >
                    <RepsBars width={11} bar={1.6} gap={1.2} /> Basics
                  </button>
                )}
              </div>
              <h1 id="rep-title" className="h1">
                {ex.title}
              </h1>
            </div>

            {missing.length > 0 && !passed && !interview && (
              <p className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-warn">
                Not practiced yet: {missing.slice(0, 5).map(skillName).join(', ')}
                {missing.length > 5 ? ` +${missing.length - 5}` : ''}. Try it anyway, or do those reps first.
              </p>
            )}

            <Markdown text={ex.prompt} />
            {ex.code && ex.kind !== 'code' && <CodeView code={ex.code} />}

            {ex.examples && ex.examples.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="label">Examples</p>
                <div className="well divide-y divide-line overflow-hidden">
                  {ex.examples.map((x, i) => (
                    <div key={i} className="grid grid-cols-[34px_1fr] gap-x-3 gap-y-1 px-4 py-3 text-[13px]">
                      <span className="mono text-faint">in</span>
                      <span className="mono break-all text-ink-2">{x.input}</span>
                      <span className="mono text-faint">out</span>
                      <span className="mono break-all font-medium text-ink">{x.output}</span>
                      {x.note && <span className="col-start-2 text-[12.5px] text-muted">{x.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {walk && !interview && (
              <a
                href={walk.url}
                target="_blank"
                rel="noreferrer"
                data-testid="walkthrough"
                className="group flex items-start gap-3 rounded-xl bg-surface px-4 py-3 shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:bg-surface-2"
              >
                <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-white">
                  <IconPlay size={11} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-1.5 text-[13.5px] font-medium text-ink">
                    {ex.repType === 'capstone' ? 'New to this? Watch the walkthrough' : 'Building toward'} · {walk.label}
                    <IconExternal size={12} className="text-muted" />
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">
                    {walk.channel} on YouTube. Watch the explanation, pause when the code starts, write it yourself here, then finish the video to compare.
                  </span>
                </span>
              </a>
            )}

            {showBasics && <BasicsPanel brief={BRIEFS[ex.id]} moves={moves} primers={primers} onClose={() => setShowBasics(false)} />}

            {ex.note && !interview && (mode === 'learn' || showNote) && (
              <div className="rise-in rounded-xl bg-surface px-4 py-3 shadow-[inset_2px_0_0_var(--ink)]">
                <p className="label mb-1 !text-ink-2">Reminder</p>
                <Markdown text={ex.note} className="!text-[13.5px]" />
              </div>
            )}
            {ex.note && mode === 'practice' && !showNote && (
              <button type="button" className="self-start text-[12.5px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink" onClick={() => setShowNote(true)}>
                Show concept reminder
              </button>
            )}

            {allHints.length > 0 && (
              <section aria-label="Hints" aria-live="polite" className="flex flex-col gap-2">
                {allHints.map((h, i) => (
                  <div key={i} className="rise-in rounded-xl px-4 py-3" style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
                    <p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-muted">
                      <IconBulb size={13} /> Hint {i + 1}
                      {i >= hints.length && <span className="text-faint">· tailored</span>}
                    </p>
                    <Markdown text={h} className="!text-[14px]" />
                  </div>
                ))}
                {!passed && (
                  <button type="button" className="btn btn-ghost btn-sm self-start" onClick={nextHint} disabled={coachBusy !== null}>
                    {coachBusy === 'hint' ? 'Thinking…' : hintsShown < hints.length ? 'Next hint' : 'Ask for a tailored hint'}
                  </button>
                )}
              </section>
            )}

            {diagnosis && (
              <section className="rise-in rounded-xl px-4 py-3.5" style={{ boxShadow: '0 0 0 1px var(--hairline), var(--shadow-sm)' }} aria-live="polite">
                <p className="label mb-1.5">Mistake · {MISTAKE_LABEL[diagnosis.category]}</p>
                <p className="text-[14px] leading-relaxed text-ink-2">{diagnosis.diagnosis}</p>
                {diagnosis.missingPrerequisite && <p className="mt-1.5 text-[13px] text-muted">Likely missing: {skillName(diagnosis.missingPrerequisite)}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {diagnosis.nextAction === 'retry' ? (
                    <button type="button" className="btn btn-sm" onClick={() => setFocusToken((n) => n + 1)}>
                      Back to code
                    </button>
                  ) : (
                    <button type="button" className="btn btn-sm" onClick={startRepair}>
                      {diagnosis.nextAction === 'syntax-reps' ? 'Repair Reps · syntax' : diagnosis.nextAction === 'pattern-reps' ? 'Repair Reps · pattern' : 'Edge-case reps'}
                    </button>
                  )}
                </div>
              </section>
            )}

            {followUps && (
              <section className="rise-in rounded-xl bg-surface px-4 py-3.5">
                <p className="label mb-2">Interview follow-up</p>
                <ol className="list-decimal pl-5 text-[14px] leading-relaxed text-ink-2">
                  {followUps.map((q, i) => (
                    <li key={i} className="mb-1">
                      {q}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {(passed || solutionShown) && ex.explanation && !runItBack && (
              <section className="rise-in rounded-xl bg-surface px-4 py-3.5">
                <p className="label mb-1.5">Why it works</p>
                <Markdown text={ex.explanation} className="!text-[14px]" />
                {ex.complexity && (
                  <p className="mono mt-2.5 text-[12.5px] text-muted">
                    time {ex.complexity.time} · space {ex.complexity.space}
                  </p>
                )}
              </section>
            )}

            {solutionShown && !passed && (
              <section className="rise-in flex flex-col gap-2">
                <p className="label">Solution</p>
                {ex.solution && ex.kind !== 'choice' && ex.kind !== 'output' && <CodeView code={ex.solution} />}
                {ex.kind === 'output' && <pre className="code-view">{ex.expectedOutput}</pre>}
                {ex.kind === 'choice' && ex.options && ex.answer !== undefined && <p className="text-[14px] font-medium">{ex.options[ex.answer]}</p>}
                <p className="text-[12.5px] text-muted">
                  {ex.cleanPass && !session
                    ? 'Read it, close it, then write it yourself. This is a check rep: a pass with the solution open does not count. Run it back clean to clear it.'
                    : 'Read it, close it, then write it yourself. This rep now earns reduced credit.'}
                </p>
              </section>
            )}

            {!interview && (
              <footer className="mt-auto flex flex-col gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5" aria-label="Skills this rep trains">
                  <span className="mr-1 text-[12px] text-faint">Trains</span>
                  {ex.skills.map((s) => (
                    <Link key={s} href={`/skills/${s}`} className="chip">
                      {skillName(s)}
                    </Link>
                  ))}
                </div>
                {problem && (
                  <a href={problem.leetcode} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start text-[13px] text-muted hover:text-ink">
                    LeetCode {problem.number}: {problem.title} <IconExternal size={13} />
                  </a>
                )}
              </footer>
            )}
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize instructions and editor"
          aria-valuenow={Math.round(split)}
          aria-valuemin={SPLIT_MIN}
          aria-valuemax={SPLIT_MAX}
          tabIndex={0}
          className="splitter hidden shrink-0 lg:block"
          data-active={dragging}
          onPointerDown={startDrag}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setSplitPersist(split - 2)
            if (e.key === 'ArrowRight') setSplitPersist(split + 2)
          }}
        />

        {/* Workspace */}
        <section aria-label="Workspace" className="flex min-h-[520px] min-w-0 flex-1 flex-col p-3 lg:min-h-0 lg:p-4">
          <div className="rep-in panel flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Editor chrome */}
            <div className="flex h-11 shrink-0 items-center gap-3 px-4" style={{ boxShadow: '0 1px 0 var(--line)' }}>
              {ex.kind === 'code' ? (
                <>
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <PyMark /> main.py
                  </span>
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium capitalize text-muted">{mode}</span>
                </>
              ) : (
                <span className="text-[13px] font-medium text-ink">{KIND_VERB[ex.kind]}</span>
              )}
              {runnable && <PyStatusDot status={phase === 'running' ? 'running' : pyStatus} />}
              <div className="ml-auto flex items-center gap-2">
                {ex.kind === 'code' && !passed && (
                  <button type="button" className="icon-btn" onClick={() => setCode(blankStarter(ex))} aria-label="Reset code" title="Reset code">
                    <IconRotate size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className={`min-h-0 flex-1 ${ex.kind === 'code' ? 'bg-editor' : 'overflow-y-auto px-5 py-5 sm:px-6'}`}>
              {ex.kind === 'code' && (
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  onRun={onRun}
                  onSubmit={onSubmit}
                  assist={!interview}
                  readOnly={locked}
                  autoFocus
                  focusToken={focusToken}
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

            {ex.kind === 'code' && !interview && (
              <div className="shrink-0 bg-bg px-4 py-2" style={{ boxShadow: '0 -1px 0 var(--line)' }} data-testid="custom-run">
                {customOpen ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="custom-call" className="text-[12.5px] text-muted">
                        Run my code with
                      </label>
                      <input
                        id="custom-call"
                        className="input mono !h-8 min-w-0 flex-1 !text-[12.5px]"
                        value={customCall}
                        placeholder={customPlaceholder}
                        onChange={(e) => setCustomCall(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && void runCustom()}
                      />
                      <button type="button" className="btn btn-sm" onClick={() => void runCustom()} disabled={customBusy || !customCall.trim()}>
                        <IconPlay size={10} /> {customBusy ? 'Running…' : 'Run my code'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCustomOpen(false)}>
                        Hide
                      </button>
                    </div>
                    {customOut ? (
                      <pre className={`code-view max-h-32 overflow-auto !py-2 !text-[12.5px] ${customOut.error ? '!text-fail' : ''}`} aria-live="polite">
                        {customOut.text}
                      </pre>
                    ) : (
                      <p className="text-[12px] text-muted">Type a call to your function. It runs your current code and prints what comes back. The tests are not involved.</p>
                    )}
                  </div>
                ) : (
                  <button type="button" className="text-[12.5px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink" onClick={() => setCustomOpen(true)}>
                    Try my own input
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            <p className="sr-only" role="status" aria-live="polite">
              {announce}
            </p>
            {hasFeedback && (
              <div className="fade-in max-h-[44%] shrink-0 overflow-y-auto bg-bg px-4 py-3" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
                {coachError && <p className="mb-2 text-[13px] text-warn">{coachError}</p>}
                {coachBusy && ['same', 'harder', 'easier'].includes(coachBusy) && <p className="mb-2 text-[13px] text-muted">Getting another rep and checking it runs…</p>}
                {phase === 'failed' && ex.kind === 'choice' && <FailLine>Not quite. Try another option.</FailLine>}
                {phase === 'failed' && ex.kind === 'output' && <FailLine>{outputFeedback ?? 'Not quite. Trace it again.'}</FailLine>}
                {phase === 'failed' && ex.kind === 'explain' && <FailLine>{announce}</FailLine>}
                {passed && ex.kind === 'output' && <pre className="code-view !py-2">{ex.expectedOutput}</pre>}
                {aiFeedback && <p className="mt-2 text-[13.5px] text-ink-2">{aiFeedback}</p>}
                {result && runnable && (
                  <TestResults
                    result={result}
                    mode={mode}
                    submitted={submittedResult}
                    onBackToCode={phase === 'failed' && ex.kind === 'code' ? () => setFocusToken((n) => n + 1) : undefined}
                  />
                )}
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
            )}

            {/* Actions */}
            {passed ? (
              <div className="success-in relative flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden bg-surface py-3.5 pl-4 pr-4 max-lg:sticky max-lg:bottom-0 max-lg:z-10 lg:pr-24" style={{ boxShadow: '0 -1px 0 var(--line)' }} data-testid="rep-complete">
                <span aria-hidden="true" className="success-wash pointer-events-none absolute inset-0" />
                <div className="flex min-w-0 items-center gap-3">
                  <span className="pop-in grid size-8 shrink-0 place-items-center rounded-full bg-pass text-white shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="draw" style={{ '--len': 16 } as React.CSSProperties} />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                      Rep complete{runItBack ? ' · reconstructed' : ''}
                      <span className="pop-in inline-flex items-center gap-1 rounded-full bg-ink px-2 py-px text-[11px] font-semibold text-white [animation-delay:160ms]">
                        <RepsBars width={9} bar={1.5} gap={1} color="#fff" /> +1 rep
                      </span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                      {runnable && testsTotal ? <span className="mr-1 font-medium">{testsTotal}/{testsTotal} tests</span> : null}
                      {evidence.slice(0, 3).map((name, i) => (
                        <span key={name} className="evidence-in rounded-full bg-bg px-2 py-0.5 text-[11.5px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ animationDelay: `${220 + i * 70}ms` }}>
                          + {name}
                        </span>
                      ))}
                      {evidence.length > 3 && <span className="text-[11.5px]">+{evidence.length - 3}</span>}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className="mr-1 hidden items-center gap-0.5 xl:flex" role="group" aria-label="How solid did that feel?">
                    <span className="mr-1.5 text-[12px] text-muted">How solid?</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => rate(n)}
                        aria-pressed={confidence === n}
                        title={n === 1 ? 'Shaky' : n === 5 ? 'Automatic' : undefined}
                        className={`num size-7 rounded-md text-[12px] transition-colors ${confidence === n ? 'bg-ink text-white' : 'text-muted hover:bg-bg hover:text-ink'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button type="button" className={`btn ${(assisted && !runItBack) || checkUncleared ? 'btn-accent' : ''}`} onClick={doRunItBack} title="Reset the editor and write it again from memory">
                    <RepsBars width={13} bar={2} gap={1.5} /> Run it back
                  </button>
                  <button type="button" className="btn" onClick={() => another('same')} disabled={coachBusy !== null}>
                    {coachBusy === 'same' ? 'Finding…' : 'Another rep'}
                  </button>
                  <Link href={nextHref} className={`cta-in btn btn-lg ${checkUncleared ? '' : 'btn-accent'}`} data-testid="next-rep" autoFocus={!checkUncleared}>
                    {nextHref.endsWith('/summary') ? 'Finish the day' : session && session.exerciseIds.indexOf(ex.id) === session.exerciseIds.length - 1 && session.returnTo ? 'Retry capstone' : 'Next rep'}
                    <IconArrowRight size={15} />
                  </Link>
                </div>
                {checkUncleared ? (
                  <p className="w-full text-[12.5px] text-accent-ink">Not cleared yet: the solution was open. Run it back from memory to clear this check rep.</p>
                ) : (
                  assisted && !runItBack && <p className="w-full text-[12.5px] text-accent-ink">You used help. Close the explanation and run it back from memory.</p>
                )}
              </div>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center gap-2 bg-bg py-3 pl-3 pr-3 max-lg:sticky max-lg:bottom-0 max-lg:z-10 lg:pr-24" data-testid="action-bar" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
                {!interview && (
                  <button type="button" className="btn btn-ghost" onClick={nextHint} disabled={coachBusy !== null}>
                    <IconBulb size={14} />
                    {coachBusy === 'hint' ? 'Thinking…' : hints.length && hintsShown < hints.length ? `Hint ${hintsShown + 1}/${hints.length}` : 'Hint'}
                  </button>
                )}
                {phase === 'failed' && (
                  <button type="button" className="btn btn-ghost" onClick={explainMistake} disabled={coachBusy !== null}>
                    <IconSpark size={14} />
                    {coachBusy === 'diagnose' ? 'Diagnosing…' : 'Explain mistake'}
                  </button>
                )}
                {ex.kind === 'explain' && explainText.trim().length > 40 && (
                  <button type="button" className="btn btn-ghost" onClick={checkExplanation} disabled={coachBusy !== null}>
                    {coachBusy === 'verify' ? 'Checking…' : 'Check explanation'}
                  </button>
                )}
                <div className="relative">
                  <button type="button" className="btn btn-ghost !px-2.5" aria-haspopup="menu" aria-expanded={moreOpen} aria-label="More actions" onClick={() => setMoreOpen((v) => !v)}>
                    <IconDots size={16} />
                  </button>
                  {moreOpen && (
                    <div
                      role="menu"
                      className="fade-in absolute bottom-full left-0 z-20 mb-2 flex w-56 flex-col rounded-xl bg-bg p-1.5 shadow-lg"
                      style={{ boxShadow: '0 0 0 1px var(--hairline), var(--shadow-lg)' }}
                      onKeyDown={(e) => e.key === 'Escape' && setMoreOpen(false)}
                    >
                      <MenuItem onClick={() => another('same')} disabled={coachBusy !== null}>
                        Another rep
                      </MenuItem>
                      <MenuItem onClick={() => another('easier')} disabled={coachBusy !== null}>
                        Easier rep
                      </MenuItem>
                      <MenuItem onClick={() => another('harder')} disabled={coachBusy !== null}>
                        Harder rep
                      </MenuItem>
                      {interview && <MenuItem onClick={() => (setMoreOpen(false), void nextHint())}>Hint</MenuItem>}
                      <MenuItem onClick={startRepair}>Repair Reps</MenuItem>
                      {(ex.repType === 'capstone' || ex.repType === 'pattern' || ex.repType === 'interview') && ex.kind === 'code' && (
                        <MenuItem onClick={followUp} disabled={coachBusy !== null}>
                          Interview follow-up
                        </MenuItem>
                      )}
                      {ex.complexity && <MenuItem onClick={() => (setShowComplexity(true), setMoreOpen(false))}>Complexity</MenuItem>}
                      <div className="my-1 h-px bg-line" />
                      {!solutionShown && <MenuItem onClick={viewSolution}>{ex.cleanPass && !session ? 'Show solution (won’t count)' : 'Show solution'}</MenuItem>}
                      <MenuItem onClick={() => (setMoreOpen(false), router.push(nextHref))}>Skip for now</MenuItem>
                    </div>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {phase === 'failed' && runnable && testsTotal > 0 && (
                    <span className="num mr-1 hidden text-[12.5px] text-muted md:inline">
                      {testsPassed}/{testsTotal} passed
                    </span>
                  )}
                  {ex.kind === 'code' && (
                    <button type="button" className="btn" onClick={onRun} disabled={phase === 'running'}>
                      <IconPlay size={12} /> {runLabel} <span className="kbd">⌘↵</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={phase === 'running'} data-testid="submit">
                    {phase === 'running' ? 'Running…' : phase === 'failed' && !runnable ? 'Try again' : submitLabel}
                    <span className="kbd">{ex.kind === 'code' ? '⇧⌘↵' : '⌘↵'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

const MODE_HINT: Record<Mode, string> = {
  learn: 'Reminders, hints and detailed test feedback',
  practice: 'Tests available · hints on request',
  interview: 'Timer · plain editor · no hints unless you ask',
}

/** A tiny monochrome Python mark for the editor tab. */
function PyMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="text-ink-2">
      <path d="M7.9 1.5c-3.3 0-3.1 1.4-3.1 1.4v1.5H8v.5H3.5S1.5 4.7 1.5 8s1.8 3.2 1.8 3.2h1.1V9.6s-.1-1.8 1.8-1.8h3.1s1.7 0 1.7-1.7V3.3s.3-1.8-3.1-1.8Zm-1.7 1a.6.6 0 1 1 0 1.1.6.6 0 0 1 0-1.1Z" fill="currentColor" />
      <path d="M8.1 14.5c3.3 0 3.1-1.4 3.1-1.4v-1.5H8v-.5h4.5s2 .2 2-3.1-1.8-3.2-1.8-3.2h-1.1v1.6s.1 1.8-1.8 1.8H6.7S5 8.2 5 9.9v2.8s-.3 1.8 3.1 1.8Zm1.7-1a.6.6 0 1 1 0-1.1.6.6 0 0 1 0 1.1Z" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

function FailLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[13.5px] text-fail">
      <IconX size={14} /> {children}
    </p>
  )
}

function PyStatusDot({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    idle: ['text-faint', 'Python'],
    loading: ['text-accent pulse', 'Loading Python…'],
    ready: ['text-pass', 'Ready'],
    running: ['text-accent pulse', 'Running…'],
    error: ['text-warn', 'Python unavailable · retries on run'],
  }
  const [cls, label] = map[status] ?? map.idle
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted" role="status">
      <span className={`dot !size-1.5 ${cls}`} aria-hidden="true" />
      {label}
    </span>
  )
}

function MenuItem({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled} className="rounded-lg px-2.5 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-40">
      {children}
    </button>
  )
}
