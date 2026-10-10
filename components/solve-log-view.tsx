'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useReps } from '@/components/reps-provider'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { DAYS, EXERCISE_BY_ID } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'
import { shortDate } from '@/lib/dates'
import { nextReview, redoQueue, resolveQueue, unaidedRate, type SolveEntry, type SolveResult } from '@/lib/solve-log'

/**
 * Every problem solved: LeetCode problems from the plan (logged from Today),
 * capstones passed inside Reps, and anything logged by hand. Plus what is
 * coming back next, and a form to add or annotate a solve.
 */

const RESULT_LABEL: Record<SolveResult, string> = { unaided: 'Unaided', hinted: 'Hinted', failed: 'Failed' }
const RESULT_TONE: Record<SolveResult, string> = { unaided: 'text-pass', hinted: 'text-amber', failed: 'text-fail' }
const KIND_LABEL: Record<string, string> = { new: 'New', review1: 'Re-solve 1', review2: 'Re-solve 2', review3: 'Re-solve 3', redo: 'Redo', outside: 'Outside the plan', reps: 'Reps capstone' }

interface Row {
  id: string
  problem: string
  url?: string
  date: string
  minutes?: number
  result: SolveResult
  kind: string
  approach?: string
  complexity?: string
  mistake?: string
  next: string | null
  editable: boolean
}

const blank = (today: string) => ({ id: '', lc: '', title: '', date: today, minutes: '', result: 'unaided' as SolveResult, approach: '', complexity: '', mistake: '' })

export default function SolveLogView() {
  const { attempts } = useReps()
  const { entries, save, remove, today } = useSolveLog()
  const editId = useSearchParams().get('edit')
  const editing = entries.find((e) => e.id === editId)
  const [form, setForm] = useState(() => (editing ? fromEntry(editing) : blank(today)))
  const [loadedFor, setLoadedFor] = useState(editing?.id ?? '')
  // The entry arrives after the synced state loads: fill the form once it does.
  if (editing && loadedFor !== editing.id) {
    setLoadedFor(editing.id)
    setForm(fromEntry(editing))
  }
  const [saved, setSaved] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const logged: Row[] = entries.map((e) => ({
      id: e.id,
      problem: e.lc ? `LC ${e.lc} · ${e.title}` : e.title,
      url: e.lc ? lcMeta(e.lc)?.url : undefined,
      date: e.date,
      minutes: e.minutes,
      result: e.result,
      kind: e.kind,
      approach: e.approach,
      complexity: e.complexity,
      mistake: e.mistake,
      next: nextReview(e, entries, DAYS),
      editable: true,
    }))
    // Capstones passed inside Reps: the first solve of that LeetCode problem.
    const seen = new Set<string>()
    const reps: Row[] = attempts
      .filter((a) => a.completedAt && a.passed && EXERCISE_BY_ID[a.exerciseId]?.repType === 'capstone')
      .sort((a, b) => (a.completedAt! < b.completedAt! ? -1 : 1))
      .flatMap((a) => {
        if (seen.has(a.exerciseId)) return []
        seen.add(a.exerciseId)
        const ex = EXERCISE_BY_ID[a.exerciseId]
        const p = ex.problemId ? PROBLEM_BY_ID[ex.problemId] : undefined
        const date = a.date
        const lc = p?.number
        return [
          {
            id: `reps:${a.exerciseId}`,
            problem: p ? `LC ${p.number} · ${p.title}` : ex.title,
            url: `/rep/${a.exerciseId}`,
            date,
            minutes: a.durationSeconds ? Math.round(a.durationSeconds / 60) : undefined,
            result: (a.solutionViewed ? 'failed' : a.hintsUsed > 0 ? 'hinted' : 'unaided') as SolveResult,
            kind: 'reps',
            next: lc ? (DAYS.find((d) => d.date > date && d.leetcode?.some((x) => x.lc === lc && x.type !== 'new'))?.date ?? null) : null,
            editable: false,
          },
        ]
      })
    return [...logged, ...reps].sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, attempts])

  const rate = unaidedRate(entries)
  const queue = resolveQueue(entries, DAYS, today, 10)
  const redos = redoQueue(entries, DAYS)

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.title.trim()) return
    const lc = Number(form.lc) || undefined
    const base = editing ?? { id: `out:${crypto.randomUUID()}`, kind: 'outside' as const }
    await save({
      ...base,
      lc: editing ? editing.lc : lc,
      title: form.title.trim(),
      date: form.date,
      result: form.result,
      minutes: form.minutes === '' ? undefined : Math.max(0, Number(form.minutes) || 0),
      approach: form.approach.trim() || undefined,
      complexity: form.complexity.trim() || undefined,
      mistake: form.mistake.trim() || undefined,
    })
    setSaved(true)
    if (!editing) setForm(blank(today))
  }
  const field = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (setSaved(false), setForm((f) => ({ ...f, [k]: e.target.value }))) })

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1040px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Solve log</h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-relaxed text-ink-2">Every problem you have solved, how it went, and when it comes back. Log LeetCode problems from Today; add notes or outside problems here.</p>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label="Problems logged" value={String(rows.length)} />
          <Stat label="Re-solves unaided" value={rate.rate === null ? '—' : `${Math.round(rate.rate * 100)}%`} sub={rate.total ? `${rate.unaided} of ${rate.total}` : 'none logged yet'} />
          <Stat label="Redos waiting" value={String(redos.length)} sub={redos[0] ? `next ${shortDate(redos[0].due)}` : 'none'} />
          <Stat label="Next re-solve" value={queue[0] ? shortDate(queue[0].date) : '—'} sub={queue[0] ? `LC ${queue[0].lc}` : 'nothing scheduled'} />
        </dl>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <section aria-labelledby="queue-h" className="panel p-6">
            <h2 id="queue-h" className="h2">
              Re-solve queue
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">What comes back next: redos first, then the plan’s re-solves you have not logged.</p>
            {queue.length ? (
              <ul className="mt-4 flex flex-col divide-y divide-line">
                {queue.map((q) => (
                  <li key={`${q.date}:${q.lc}:${q.type}`} className="flex items-center gap-3 py-2.5 text-[14px]">
                    <span className={`num w-[58px] shrink-0 text-[12.5px] ${q.overdue ? 'font-medium text-fail' : 'text-muted'}`}>{shortDate(q.date)}</span>
                    <a href={lcMeta(q.lc)?.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-ink hover:underline">
                      <span className="num text-muted">LC {q.lc}</span> {q.title}
                    </a>
                    <span className="shrink-0 text-[12.5px] text-muted">
                      {KIND_LABEL[q.type]}
                      {q.overdue ? ' · overdue' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[14px] text-muted">
                Nothing is waiting. <Link href="/" className="text-ink underline underline-offset-4">Go to Today</Link> for the next problem.
              </p>
            )}
          </section>

          <section aria-labelledby="form-h" className="panel p-6">
            <h2 id="form-h" className="h2">
              {editing ? 'Add notes' : 'Log a problem'}
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">{editing ? `LC ${editing.lc} · ${editing.title}` : 'For a problem outside the plan: an online assessment, a mock, anything else you solved.'}</p>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
              {!editing && (
                <div className="grid grid-cols-[92px_1fr] gap-3">
                  <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                    LC number
                    <input className="input" inputMode="numeric" placeholder="optional" {...field('lc')} />
                  </label>
                  <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                    Problem
                    <input className="input" required placeholder="Title" {...field('title')} />
                  </label>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                  Date
                  <input className="input" type="date" required {...field('date')} />
                </label>
                <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                  Minutes
                  <input className="input" inputMode="numeric" placeholder="e.g. 25" {...field('minutes')} />
                </label>
                <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                  Result
                  <select className="input" {...field('result')}>
                    <option value="unaided">Unaided</option>
                    <option value="hinted">Hinted</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                Approach
                <input className="input" placeholder="e.g. one pass, dict of value → index" {...field('approach')} />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                Complexity
                <input className="input" placeholder="e.g. O(n) time, O(n) space" {...field('complexity')} />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] text-muted">
                Mistake note
                <textarea className="input" rows={2} placeholder="The cue you missed, in one line" {...field('mistake')} />
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Save notes' : 'Log it'}
                </button>
                {editing && (
                  <Link href="/log" className="btn btn-ghost">
                    Done
                  </Link>
                )}
                <span role="status" className="text-[12.5px] text-muted">
                  {saved ? 'Saved.' : ''}
                </span>
              </div>
            </form>
          </section>
        </div>

        <section aria-labelledby="hist-h" className="mt-8">
          <h2 id="hist-h" className="h2">
            History
          </h2>
          {rows.length ? (
            <div className="mt-4 overflow-x-auto rounded-2xl bg-bg shadow-[0_0_0_1px_var(--line)]">
              <table className="w-full min-w-[820px] text-left text-[13.5px]">
                <thead className="text-[12px] text-muted">
                  <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:font-medium">
                    <th>Problem</th>
                    <th>Date</th>
                    <th className="text-right">Min</th>
                    <th>Result</th>
                    <th>Approach · complexity</th>
                    <th>Mistake note</th>
                    <th>Next review</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id} className="align-top [&>td]:px-4 [&>td]:py-2.5">
                      <td className="max-w-[240px]">
                        {r.url ? (
                          <a href={r.url} target={r.url.startsWith('/') ? undefined : '_blank'} rel="noreferrer" className="font-medium text-ink hover:underline">
                            {r.problem}
                          </a>
                        ) : (
                          <span className="font-medium text-ink">{r.problem}</span>
                        )}
                        <span className="block text-[12px] text-muted">{KIND_LABEL[r.kind]}</span>
                      </td>
                      <td className="num whitespace-nowrap text-ink-2">{shortDate(r.date)}</td>
                      <td className="num text-right text-ink-2">{r.minutes ?? '—'}</td>
                      <td className={`font-medium ${RESULT_TONE[r.result]}`}>{RESULT_LABEL[r.result]}</td>
                      <td className="max-w-[220px] text-ink-2">{[r.approach, r.complexity].filter(Boolean).join(' · ') || <span className="text-faint">—</span>}</td>
                      <td className="max-w-[200px] text-ink-2">{r.mistake || <span className="text-faint">—</span>}</td>
                      <td className="num whitespace-nowrap text-ink-2">{r.next ? shortDate(r.next) : '—'}</td>
                      <td className="whitespace-nowrap text-right">
                        {r.editable && (
                          <>
                            <Link href={`/log?edit=${encodeURIComponent(r.id)}`} className="text-[12.5px] text-muted underline underline-offset-4 hover:text-ink">
                              Edit
                            </Link>
                            <button type="button" onClick={() => void remove(r.id)} className="ml-3 text-[12.5px] text-muted underline underline-offset-4 hover:text-fail">
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-muted">
              Nothing logged yet. Solve today’s first problem, then tap Unaided or Needed help on <Link href="/" className="text-ink underline underline-offset-4">Today</Link>.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

function fromEntry(e: SolveEntry) {
  return { id: e.id, lc: e.lc ? String(e.lc) : '', title: e.title, date: e.date, minutes: e.minutes === undefined ? '' : String(e.minutes), result: e.result, approach: e.approach ?? '', complexity: e.complexity ?? '', mistake: e.mistake ?? '' }
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="num mt-0.5 text-[22px] font-semibold tracking-tight text-ink">{value}</dd>
      {sub && <dd className="text-[12.5px] text-muted">{sub}</dd>}
    </div>
  )
}
