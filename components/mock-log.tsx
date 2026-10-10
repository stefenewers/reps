'use client'

import { useMemo, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { shortDate } from '@/lib/dates'
import { MOCKLOG_PREFIX, MOCK_TYPES, RUBRIC, mockSummary, rubricAverage, type MockLogEntry, type MockType, type RubricKey } from '@/lib/mock-log'

/** Log a mock done anywhere (recorded alone, with a partner, on a platform) and see the history. */
export default function MockLog() {
  const { repo, version, today } = useReps()
  const entries = useMemo(
    () => repo.statesWithPrefix<MockLogEntry>(MOCKLOG_PREFIX).sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repo, version],
  )
  const [date, setDate] = useState(today)
  const [type, setType] = useState<MockType>('Self-recorded')
  const [duration, setDuration] = useState('45')
  const [scores, setScores] = useState<Partial<Record<RubricKey, number>>>({})
  const [notes, setNotes] = useState('')
  const summary = mockSummary(entries)

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const id = crypto.randomUUID()
    await repo.setState(`${MOCKLOG_PREFIX}${id}`, { id, date, type, duration: Number(duration) || undefined, scores, notes: notes.trim() || undefined, at: new Date().toISOString() } satisfies MockLogEntry)
    setScores({})
    setNotes('')
  }

  return (
    <section aria-labelledby="mocklog-h" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mocklog-h" className="h2">
          Mock log
        </h2>
        <p className="num text-[12.5px] text-muted">
          {summary.count} logged{summary.average !== null && ` · average ${summary.average.toFixed(1)} of 4`}
        </p>
      </div>
      <p className="mt-1 max-w-[640px] text-[13.5px] text-muted">For mocks done outside this page: recorded alone, with a partner, or on a peer platform. Score each area from 1 (missing) to 4 (strong).</p>

      <form onSubmit={submit} className="panel mt-4 flex flex-col gap-4 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-[12.5px] text-muted">
            Date
            <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[12.5px] text-muted">
            Type
            <select className="input" value={type} onChange={(e) => setType(e.target.value as MockType)}>
              {MOCK_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12.5px] text-muted">
            Duration (min)
            <input className="input" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
        </div>
        <fieldset>
          <legend className="text-[12.5px] text-muted">Rubric</legend>
          <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {RUBRIC.map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] text-ink-2">{k}</span>
                <div role="radiogroup" aria-label={`${k} score`} className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={scores[k] === n}
                      onClick={() => setScores((s) => ({ ...s, [k]: s[k] === n ? undefined : n }))}
                      className={`num size-8 rounded-md text-[13px] transition-colors ${scores[k] === n ? 'bg-ink text-white' : 'bg-surface text-ink-2 hover:bg-surface-2'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-[12.5px] text-muted">
          Notes
          <textarea className="input" rows={2} placeholder="What went well, what to fix next time" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary self-start">
          Log mock
        </button>
      </form>

      {entries.length > 0 ? (
        <ul className="card mt-4 divide-y divide-line px-4 text-[13.5px]">
          {entries.map((e) => {
            const avg = rubricAverage(e)
            return (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                <span className="num w-[58px] shrink-0 text-muted">{shortDate(e.date)}</span>
                <span className="font-medium text-ink">{e.type}</span>
                <span className="text-muted">
                  {e.duration ? `${e.duration} min` : ''}
                  {avg !== null ? `${e.duration ? ' · ' : ''}${avg.toFixed(1)} of 4` : ''}
                </span>
                {e.notes && <span className="min-w-0 flex-1 basis-full text-ink-2 sm:basis-0">{e.notes}</span>}
                <button type="button" onClick={() => void repo.setState(`${MOCKLOG_PREFIX}${e.id}`, {})} className="ml-auto text-[12.5px] text-muted underline underline-offset-4 hover:text-fail">
                  Delete
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[13.5px] text-muted">No mocks logged yet. The plan has none in week 1; record yourself for the first one in week 2.</p>
      )}
    </section>
  )
}
