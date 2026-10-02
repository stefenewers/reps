'use client'

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { SKILLS } from '@/data/skills'
import { DAY_BY_DATE, FIRST_DAY, LAST_DAY } from '@/data/curriculum'
import { computeAllMastery, type SkillMastery } from '@/lib/mastery'
import { clampDate, localDate } from '@/lib/dates'
import { createLocalStore } from '@/lib/storage/local'
import { SupabaseRemoteStore } from '@/lib/storage/remote'
import { SyncEngine } from '@/lib/storage/sync'
import { RepsRepository } from '@/lib/storage/repository'
import type { SyncStatus } from '@/lib/storage/types'
import { getSupabase } from '@/lib/supabase'
import type { Attempt, ReviewItem } from '@/lib/types'

/**
 * Boots persistence once per tab and exposes derived state.
 * Rendering never waits on the network: the local cache loads first, Supabase
 * reconciles in the background.
 */

interface RepsContextValue {
  repo: RepsRepository
  version: number
  loaded: boolean
  status: SyncStatus
  pending: number
  syncError: string | null
  attempts: Attempt[]
  reviews: ReviewItem[]
  mastery: Record<string, SkillMastery>
  today: string
  userEmail: string | null
}

const RepsContext = createContext<RepsContextValue | null>(null)

const SKILL_IDS = SKILLS.map((s) => s.id)

function createRepository(): RepsRepository {
  const sb = getSupabase()
  const engine = new SyncEngine(createLocalStore(), sb ? new SupabaseRemoteStore(sb) : null, {
    flushDelayMs: { attempts: 300, study_state: 15_000 },
  })
  return new RepsRepository(engine, { skillIds: SKILL_IDS, dayFor: (d) => DAY_BY_DATE[d], lastDay: LAST_DAY })
}

let singleton: RepsRepository | null = null
function getRepository(): RepsRepository {
  if (!singleton) singleton = createRepository()
  return singleton
}

/** The study day: the real local date, held inside Oct 2 – Oct 11. */
export function studyToday(now = new Date()): string {
  return clampDate(localDate(now), FIRST_DAY, LAST_DAY)
}

export function RepsProvider({ children }: { children: ReactNode }) {
  const [repo] = useState(getRepository)
  const engine = repo.engine
  const version = useSyncExternalStore(
    (fn) => engine.subscribe(fn),
    () => engine.version,
    () => 0,
  )
  const [today, setToday] = useState(() => studyToday())
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    void engine.start()
    const sb = getSupabase()
    const sub = sb?.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user.email ?? null)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void engine.pullRemote()
      if (event === 'SIGNED_OUT') void engine.flush()
    })
    const onOnline = () => void engine.flush()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void engine.flush()
      else {
        setToday(studyToday())
        void engine.pullRemote()
      }
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    const tick = window.setInterval(() => setToday(studyToday()), 60_000)
    return () => {
      sub?.data.subscription.unsubscribe()
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(tick)
    }
  }, [engine])

  const attempts = repo.attempts()
  const reviews = repo.reviews()
  // Mastery is derived from the canonical attempt history, never stored opinion.
  const mastery = useMemo(() => computeAllMastery(SKILL_IDS, attempts), [attempts])

  const value: RepsContextValue = {
    repo,
    version,
    loaded: engine.loaded,
    status: engine.status,
    pending: engine.pendingCount(),
    syncError: engine.lastError,
    attempts,
    reviews,
    mastery,
    today,
    userEmail,
  }
  return <RepsContext.Provider value={value}>{children}</RepsContext.Provider>
}

export function useReps(): RepsContextValue {
  const ctx = useContext(RepsContext)
  if (!ctx) throw new Error('useReps must be used inside RepsProvider')
  return ctx
}
