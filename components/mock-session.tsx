'use client'

import '@/components/rep/focus.css'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { useMockGate } from '@/components/use-mock-gate'
import Markdown from '@/components/markdown'
import PageHero from '@/components/page-hero'
import { TestResults } from '@/components/rep/results'
import { MOCKS } from '@/data/mocks'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { skillName } from '@/data/skills'
import { localDate } from '@/lib/dates'
import { getRunner, type RunResult } from '@/lib/python/runner'
import { newId } from '@/lib/sessions'
import { requestInterviewReview } from '@/lib/coach/client'
import { IconCheck, IconClock, IconFile, IconPlay, IconX } from '@/components/icons'
import type { Attempt, MockResult } from '@/lib/types'

const CodeEditor = dynamic(() => import('@/components/code-editor'), { ssr: false, loading: () => <div className="h-full min-h-[280px] bg-[#0f1a2a]" /> })

/** Neutral interviewer prompts. No hints, no AI, unless asked for after the session. */
const NUDGES = ['What are you optimizing?', 'What’s the invariant?', 'What edge case could break this?', 'What’s the time complexity?', 'What’s the space complexity?', 'Can you walk through an example?']

interface ProblemState {
  code: string
  custom: string
  complexity: string
  explanation: string
  result: RunResult | null
  customResult: string | null
  passed: boolean
  testsPassed: number
  testsTotal: number
  submitted: boolean
  failures: number
}

export default function MockSession({ mockId }: { mockId: string }) {
  const mock = MOCKS.find((m) => m.id === mockId)
  if (!mock) return <main className="mx-auto max-w-[720px] flex-1 px-5 py-16 text-muted">Unknown mock.</main>
  return <GatedMock mock={mock} />
}

/** The same gate as the interview page: a direct link cannot skip it. */
function GatedMock({ mock }: { mock: (typeof MOCKS)[number] }) {
  const gate = useMockGate()
  if (!gate.canStart(mock.id))
    return (
      <main className="flex-1 bg-canvas" data-testid="mock-locked-page">
        <PageHero mood="night" eyebrow={mock.title} title="Not yet" sub="The scaffolding comes off when your transfer evidence says a mock will be useful." deck />
        <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 sm:px-8">
          <div className="deck flex flex-col gap-4 p-6 sm:p-8">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              Transfer grade: <span className={`tag ${gate.grade === 'green' ? 'tag-pass' : gate.grade === 'yellow' ? 'tag-repair' : 'tag-cold'}`}>{gate.grade}</span>
            </p>
            <p className="max-w-[680px] text-[15px] leading-relaxed text-ink-2">
              Mocks open with the evidence, not the calendar. Transfer grade: {gate.grade}. {gate.note}
            </p>
            <Link href="/" className="btn btn-accent self-start">
              Back to today&apos;s transfer and repair work
            </Link>
          </div>
        </div>
      </main>
    )
  return <MockRunner mock={mock} />
}

function MockRunner({ mock }: { mock: (typeof MOCKS)[number] }) {
  const { repo } = useReps()
  const mockId = mock.id
  const problems = mock.exerciseIds.map((id) => EXERCISE_BY_ID[id]).filter(Boolean)
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready')
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [active, setActive] = useState(0)
  const [scratch, setScratch] = useState('')
  const [state, setState] = useState<ProblemState[]>(() =>
    problems.map((p) => ({ code: p.starterCode ?? '', custom: '', complexity: '', explanation: '', result: null, customResult: null, passed: false, testsPassed: 0, testsTotal: p.tests?.length ?? 0, submitted: false, failures: 0 })),
  )
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState<{ summary: string; strengths: string[]; improvements: string[]; nextReps: string[] } | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const resultId = useRef(newId())

  const total = mock.minutes * 60
  const used = startedAt ? Math.floor((now - startedAt.getTime()) / 1000) : 0
  const left = Math.max(0, total - used)


  useEffect(() => {
    if (phase === 'running') void getRunner().ensure().catch(() => undefined)
  }, [phase])

  const patch = (i: number, p: Partial<ProblemState>) => setState((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const cur = state[active]
  const ex = problems[active]

  const runCustom = async () => {
    if (!cur.custom.trim()) return
    setBusy(true)
    const r = await getRunner().run(cur.code, [{ call: cur.custom.trim(), expected: 'None', name: 'your test' }])
    const t = r.tests[0]
    patch(active, { customResult: r.error ? r.error : t?.error ? t.error : `→ ${t?.actual}${t?.stdout ? `\n${t.stdout}` : ''}`, result: r.stdout ? { ...r, tests: [] } : null })
    setBusy(false)
  }

  const runExamples = async () => {
    setBusy(true)
    const r = await getRunner().run(cur.code, (ex.tests ?? []).filter((t) => !t.hidden))
    patch(active, { result: r, submitted: false })
    setBusy(false)
  }

  const submit = async () => {
    setBusy(true)
    const r = await getRunner().run(cur.code, ex.tests ?? [])
    const passed = !r.error && r.tests.length > 0 && r.tests.every((t) => t.passed)
    patch(active, { result: r, submitted: true, passed, testsPassed: r.tests.filter((t) => t.passed).length, testsTotal: r.tests.length, failures: passed ? cur.failures : cur.failures + 1 })
    setBusy(false)
  }

  const finish = async () => {
    const end = new Date()
    setPhase('done')
    // Each problem becomes an interview-mode attempt: real evidence for mastery.
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i]
      const s = state[i]
      if (!s.code.trim() || s.code === p.starterCode) continue
      const a: Attempt = {
        id: newId(),
        exerciseId: p.id,
        date: localDate(),
        skills: p.skills,
        stage: p.stage,
        mode: 'interview',
        code: s.code,
        passed: s.passed,
        attemptsBeforePass: s.passed ? s.failures : Math.max(1, s.failures),
        hintsUsed: 0,
        solutionViewed: false,
        runtimeErrors: s.result?.error ? [s.result.error] : [],
        startedAt: startedAt!.toISOString(),
        completedAt: end.toISOString(),
        durationSeconds: used,
        retrievalType: 'cold',
        updatedAt: end.toISOString(),
      }
      void repo.recordAttempt(a, p)
    }
    const result: MockResult = {
      id: resultId.current,
      mockId,
      startedAt: startedAt!.toISOString(),
      completedAt: end.toISOString(),
      problems: problems.map((p, i) => ({
        exerciseId: p.id,
        code: state[i].code,
        passed: state[i].passed,
        testsPassed: state[i].testsPassed,
        testsTotal: state[i].testsTotal,
        complexity: state[i].complexity,
        explanation: state[i].explanation,
      })),
      scratchpad: scratch,
    }
    await repo.setState(`mock:${mockId}:${resultId.current}`, result, { flushDelayMs: 1000 })
  }



  // The clock: when time is up, the interview ends.
  const onTick = useEffectEvent(() => {
    const t = Date.now()
    setNow(t)
    if (startedAt && t - startedAt.getTime() >= total * 1000) void finish()
  })
  useEffect(() => {
    if (phase !== 'running') return
    const t = window.setInterval(onTick, 1000)
    return () => window.clearInterval(t)
  }, [phase])

  const askReview = async () => {
    setBusy(true)
    setReviewError(null)
    try {
      const r = await requestInterviewReview({
        problems: problems.map((p, i) => ({ title: p.title, code: state[i].code, passed: state[i].passed, testsPassed: state[i].testsPassed, testsTotal: state[i].testsTotal, complexity: state[i].complexity, explanation: state[i].explanation })),
        scratchpad: scratch,
        minutesUsed: Math.round(used / 60),
      })
      setReview(r)
      const prev = repo.state<MockResult>(`mock:${mockId}:${resultId.current}`)
      if (prev) await repo.setState(`mock:${mockId}:${resultId.current}`, { ...prev, review: JSON.stringify(r) })
    } catch (e) {
      setReviewError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'ready') {
    return (
      <main className="flex-1 bg-canvas">
        <PageHero
          mood="night"
          eyebrow={
            <Link href="/interview" className="hover:underline">
              ← Interview Reps
            </Link>
          }
          title={mock.title}
          sub={mock.note}
          deck
        />
        <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 pb-28 sm:px-8">
          <div className="deck p-6 sm:p-8">
            <p className="label">Mock interview · {mock.minutes} minutes</p>
            <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink-2">
              When the clock starts, the training room goes away: no lessons, no hints, no technique names. The problem, a plain editor, your own tests, and a
              scratchpad. Review comes afterward.
            </p>
            <ul className="mt-6 grid gap-3 text-[14px] text-ink-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [`${problems.length} problems`, 'Switch between them any time.'],
                ['Plain editor', 'No autocomplete, no hints, no AI.'],
                ['Your own tests', 'Run any call. Submit runs the hidden tests.'],
                ['Say it in writing', 'Complexity and approach, like you would out loud.'],
              ].map(([t, d]) => (
                <li key={t} className="rounded-xl bg-surface px-4 py-3">
                  <p className="font-medium text-ink">{t}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{d}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary btn-lg mt-8 !bg-shell !text-white"
              onClick={() => {
                void repo.setState(`mock-start:${mockId}`, { mockId, startedAt: new Date().toISOString() })
                setStartedAt(new Date())
                setNow(Date.now())
                setPhase('running')
              }}
            >
              <IconClock size={15} /> Start the clock
            </button>
          </div>
        </div>
      </main>
    )
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const nudge = NUDGES[Math.floor(used / 300) % NUDGES.length]

  if (phase === 'done') {
    return (
      <main className="flex-1 bg-canvas">
        <PageHero mood="night" eyebrow={mock.title} title="Interview Rep complete" sub="Now the review, while it is fresh: what went well, and what to repair." deck />
        <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 pb-28 sm:px-8">
          <div className="deck p-6 sm:p-8">
            <p className="label">{mock.title}</p>
            <h2 className="section-title mt-2">How it went</h2>
            <p className="mt-2 text-[14px] text-muted">{Math.round(used / 60)} of {mock.minutes} minutes used.</p>
            <ul className="mt-6 flex flex-col gap-2 text-[14px]">
              {problems.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
                  <span className="font-medium">{p.title}</span>
                  <span className={`inline-flex items-center gap-1.5 ${state[i].passed ? 'text-pass' : 'text-muted'}`}>
                    {state[i].submitted ? (
                      <>
                        {state[i].passed ? <IconCheck size={14} /> : <IconX size={14} />} {state[i].testsPassed}/{state[i].testsTotal} tests
                      </>
                    ) : (
                      'Not submitted'
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {!review && (
              <div className="mt-6 flex items-center gap-3">
                <button type="button" className="btn btn-primary" onClick={askReview} disabled={busy}>
                  {busy ? 'Reviewing…' : 'Review'}
                </button>
                <span className="text-[12.5px] text-muted">An interviewer-style read of your code, complexity and explanation.</span>
              </div>
            )}
            {reviewError && <p className="mt-3 text-[13px] text-warn">{reviewError}</p>}
            {review && (
              <section className="rise-in mt-6 flex flex-col gap-4 text-[14px] leading-relaxed">
                <p className="text-ink-2">{review.summary}</p>
                <div>
                  <p className="label mb-1.5">Strengths</p>
                  <ul className="flex flex-col gap-1 text-ink-2">{review.strengths.map((s, i) => <li key={i}>– {s}</li>)}</ul>
                </div>
                <div>
                  <p className="label mb-1.5">Improve</p>
                  <ul className="flex flex-col gap-1 text-ink-2">{review.improvements.map((s, i) => <li key={i}>– {s}</li>)}</ul>
                </div>
                {review.nextReps.length > 0 && <p className="text-muted">Next reps: {review.nextReps.map(skillName).join(', ')}</p>}
              </section>
            )}
          </div>
          <Link href="/interview" className="btn btn-ghost mt-6">
            Back to Interview Reps
          </Link>
        </div>
      </main>
    )
  }

  // The running interview is a focused room: it covers the app chrome.
  return (
    <main data-mode="interview" className="mock-room fixed inset-0 z-40 flex flex-col" aria-label={`Mock interview: ${mock.title}`}>
      <div className="mock-bar flex h-16 shrink-0 items-center gap-4 px-4 sm:px-6">
        <div role="tablist" aria-label="Problems" className="seg">
          {problems.map((p, i) => (
            <button key={p.id} role="tab" aria-selected={i === active} type="button" onClick={() => setActive(i)} aria-label={`Problem ${i + 1}`}>
              <span className="sm:hidden">P{i + 1}</span>
              <span className="hidden sm:inline">Problem {i + 1}</span>
              {state[i].passed && <IconCheck size={12} className="ml-1 inline text-pass" />}
            </button>
          ))}
        </div>
        <span
          className="mock-clock mono num mx-auto font-medium"
          data-low={left < 300 ? 'true' : 'false'}
          role="timer"
          aria-label={`${mm} minutes ${ss} seconds left`}
        >
          {mm}:{ss}
        </span>
        <button type="button" className="btn mock-end" onClick={() => void finish()}>
          End interview
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="mock-problem flex flex-col gap-5 overflow-y-auto px-6 py-6 lg:w-[38%] lg:shrink-0 lg:px-8">
          <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight">{ex.title}</h1>
          <Markdown text={ex.prompt} />
          {ex.examples && ex.examples.length > 0 && (
            <ol className="flex flex-col gap-2">
              {ex.examples.map((x, i) => (
                <li key={i} className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-bg px-4 py-3 text-[13px] shadow-[inset_0_0_0_1px_var(--line)]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Input</span>
                  <span className="mono break-all">{x.input}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Output</span>
                  <span className="mono break-all font-semibold">{x.output}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-[13.5px] italic text-muted" aria-live="off">
            {nudge}
          </p>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-muted">
            Scratchpad
            <textarea className="input mono !text-[13px] font-normal" rows={6} value={scratch} onChange={(e) => setScratch(e.target.value)} placeholder="Examples, invariants, plan…" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-muted">
            Complexity
            <input className="input mono !text-[13px] font-normal" value={cur.complexity} onChange={(e) => patch(active, { complexity: e.target.value })} placeholder="time O(?) · space O(?)" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-muted">
            Explanation
            <textarea className="input !text-[13.5px] font-normal" rows={4} value={cur.explanation} onChange={(e) => patch(active, { explanation: e.target.value })} placeholder="Approach and why it works." />
          </label>
        </section>

        <section className="flex min-h-0 flex-1 flex-col p-3 lg:p-4">
          <div className="mock-editor-card flex min-h-0 flex-1 flex-col">
            <div className="flex h-11 shrink-0 items-center gap-3 bg-[#0b1422] px-4 text-[#e6ecf5]" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}>
              <span className="flex items-center gap-1.5 text-[13px] font-medium">
                <IconFile size={14} className="opacity-70" /> main.py
              </span>
              <span className="text-[12px] text-[#a3b0c2]">Python · plain editor</span>
            </div>
            <div className="min-h-0 flex-1 bg-[#0f1a2a]">
              <CodeEditor key={ex.id} value={cur.code} onChange={(v) => patch(active, { code: v })} onRun={runExamples} onSubmit={submit} assist={false} ariaLabel="Interview editor" minHeight={280} />
            </div>
            {(cur.customResult || cur.result) && (
              <div className="mock-results fade-in max-h-[38%] shrink-0 overflow-y-auto px-4 py-3" aria-live="polite">
                {cur.customResult && <pre className="code-view mb-3 !py-2 text-[12.5px]">{cur.customResult}</pre>}
                {cur.result && <TestResults result={cur.result} mode="interview" submitted={cur.submitted} />}
              </div>
            )}
            <div className="mock-tools flex shrink-0 flex-wrap items-center gap-2 px-3 py-3">
              <input
                className="input mono !h-[34px] min-w-[200px] flex-1 !py-1 !text-[12.5px] sm:max-w-[340px]"
                value={cur.custom}
                onChange={(e) => patch(active, { custom: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && void runCustom()}
                placeholder="Your test, e.g. f([1, 2, 3])"
                aria-label="Custom test call"
              />
              <button type="button" className="btn" onClick={runCustom} disabled={busy}>
                Run test
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" className="btn" onClick={runExamples} disabled={busy}>
                  <IconPlay size={12} /> Run examples
                </button>
                <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
