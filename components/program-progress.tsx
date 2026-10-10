'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProgramProgress as Progress } from '@/lib/progress'
import { parseLocal, shortDate } from '@/lib/dates'

/**
 * The whole-program rail under the header: how far through the calendar
 * (the October sprint, then the 90-day ladder plan).
 *
 * It animates only for genuine progress made in this tab (a rep completed
 * moments ago). Hydration from the local cache and reconciliation from Supabase
 * snap into place silently: history from another device is not a celebration.
 * All motion is CSS (transform + opacity) and switches off under reduced motion.
 */

const ADVANCE_MS = 900
const TOAST_MS = 2600
const GENUINE_WINDOW_MS = 2500

export default function ProgramProgress({ progress, loaded, lastLocalCompletionAt }: { progress: Progress; loaded: boolean; lastLocalCompletionAt: () => number }) {
  const [shown, setShown] = useState(0)
  const [ready, setReady] = useState(false)
  const [snap, setSnap] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [finale, setFinale] = useState(false)
  const [justDone, setJustDone] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; at: number } | null>(null)
  const doneDays = useRef<Set<string>>(new Set())
  const timers = useRef<number[]>([])

  const target = progress.fraction
  const completeDays = progress.days.filter((d) => d.complete).map((d) => d.date).join(',')

  useEffect(() => {
    if (!loaded) return
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
    const nowDone = new Set(completeDays ? completeDays.split(',') : [])

    // First real value: take it as-is, no animation.
    if (!ready) {
      doneDays.current = nowDone
      /* eslint-disable react-hooks/set-state-in-effect -- orchestrating a one-off animation from external progress */
      setSnap(true)
      setShown(target)
      setReady(true)
      /* eslint-enable react-hooks/set-state-in-effect */
      requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)))
      return
    }
    if (target === shown) return

    const genuine = target > shown && Date.now() - lastLocalCompletionAt() < GENUINE_WINDOW_MS
    const newlyDone = [...nowDone].filter((d) => !doneDays.current.has(d))
    doneDays.current = nowDone

    if (!genuine) {
      // Sync, import or undo: move without ceremony.
      setSnap(true)
      setShown(target)
      requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)))
      return
    }

    setShown(target)
    setAdvancing(true)
    later(() => setAdvancing(false), ADVANCE_MS)

    if (target >= 1) {
      setFinale(true)
      setToast({ text: 'Every rep in the plan is done.', at: 1 })
      later(() => setFinale(false), 1600)
      later(() => setToast(null), TOAST_MS + 1200)
    } else if (newlyDone.length) {
      const date = newlyDone[newlyDone.length - 1]
      const day = progress.days.find((d) => d.date === date)!
      setJustDone(date)
      setToast({ text: `${shortDate(day.date)} complete · ${day.short}`, at: day.end })
      later(() => setJustDone(null), 700)
      later(() => setToast(null), TOAST_MS)
    }
  }, [loaded, target, completeDays, ready, shown, lastLocalCompletionAt, progress.days])

  useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  const pct = Math.round(progress.fraction * 100)
  const current = progress.days.find((d) => !d.complete)
  return (
    <div className="pp" data-ready={ready} data-advancing={advancing} data-finale={finale} data-snap={snap}>
      <div
        className="pp-track"
        role="progressbar"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
        aria-valuetext={`${progress.completed} of ${progress.total} reps, ${pct}%`}
        aria-label={`Overall Reps curriculum progress: ${progress.completed} of ${progress.total} complete`}
      >
        <div className="pp-clip">
          <div className="pp-fill" style={{ transform: `translateX(${(shown - 1) * 100}%)` }}>
            <span className="pp-comet" />
          </div>
        </div>

        {progress.days.map((d, i) => {
          const last = i === progress.days.length - 1
          // With ~100 days a marker per day is noise: mark week ends (Saturdays) and the finish.
          // No marker at the very end: at the edge of the screen it reads as a stray dot.
          const mark = !last && (progress.days.length <= 20 || parseLocal(d.date).getDay() === 6)
          if (d.total === 0 && !last) return null
          return (
            <span key={d.date} aria-hidden="true">
              <span className={`pp-seg ${i === 0 ? 'pp-seg-first' : ''} ${last ? 'pp-seg-last' : ''}`} style={{ left: `${d.start * 100}%`, width: `${(d.end - d.start) * 100}%` }}>
                <span className="pp-tip">
                  <b>{shortDate(d.date)}</b> · {d.short} · {d.completed}/{d.total}
                  <span className="pp-tip-sub">
                    {Math.round(d.end * progress.total)} of {progress.total} reps by end of day
                  </span>
                </span>
              </span>
              {mark && (
                <span
                  className={`pp-mark ${last ? 'pp-mark-end' : ''}`}
                  data-done={d.complete}
                  data-pop={justDone === d.date || (last && finale)}
                  style={{ left: `${d.end * 100}%` }}
                />
              )}
            </span>
          )
        })}

        {/* Keyboard focus shows the summary the hover tips give per day. */}
        <span className="pp-focus-tip" aria-hidden="true">
          <b>{pct}%</b> of Reps · {progress.completed}/{progress.total} reps{current ? ` · now ${shortDate(current.date)} · ${current.short}` : ' · plan complete'}
        </span>
      </div>

      {toast && (
        <p key={toast.text} className="pp-toast" role="status" style={{ left: `clamp(110px, ${toast.at * 100}%, calc(100% - 110px))` }}>
          {toast.text}
        </p>
      )}
    </div>
  )
}
