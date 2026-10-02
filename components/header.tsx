'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useReps } from '@/components/reps-provider'
import { DAYS } from '@/data/curriculum'
import { INTERVIEW_TARGET } from '@/data/program'
import { programProgress } from '@/lib/progress'
import ProgramProgress from '@/components/program-progress'
import { useCallback, useMemo } from 'react'
import type { SyncStatus } from '@/lib/storage/types'

const NAV = [
  { href: '/', label: 'Today', match: (p: string) => p === '/' || p.startsWith('/day') || p.startsWith('/rep') },
  { href: '/skills', label: 'Skills', match: (p: string) => p.startsWith('/skills') },
  { href: '/problems', label: 'Problems', match: (p: string) => p.startsWith('/problems') },
  { href: '/interview', label: 'Interview', match: (p: string) => p.startsWith('/interview') },
]

const SYNC_LABEL: Record<SyncStatus, string> = {
  'local-only': 'Saved on this device',
  'signed-out': 'Sign in to sync',
  syncing: 'Syncing',
  saved: 'Saved',
  offline: 'Offline · saved locally',
}

function SyncIndicator() {
  const { status, pending, syncError } = useReps()
  const dot = status === 'saved' ? 'text-pass' : status === 'syncing' ? 'text-accent pulse' : status === 'offline' ? 'text-warn' : 'text-faint'
  const label = status === 'offline' && pending ? `Offline · ${pending} saved locally` : SYNC_LABEL[status]
  const content = (
    <span
      className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-muted transition-colors hover:bg-surface-2"
      role="status"
      aria-live="polite"
      title={status === 'offline' && syncError ? syncError : undefined}
    >
      <span aria-hidden="true" className={`dot !size-1.5 ${dot}`} />
      {label}
    </span>
  )
  return status === 'signed-out' || status === 'offline' ? <Link href="/sign-in">{content}</Link> : content
}

/** The Reps mark: three stacked bars, one per rep. */
function Mark() {
  return (
    <span aria-hidden="true" className="grid size-6 place-items-center rounded-[7px] bg-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <rect x="1" y="2" width="10" height="2" rx="1" fill="white" />
        <rect x="1" y="5" width="7" height="2" rx="1" fill="white" opacity="0.75" />
        <rect x="1" y="8" width="4" height="2" rx="1" fill="white" opacity="0.5" />
      </svg>
    </span>
  )
}

export default function Header() {
  const pathname = usePathname() ?? '/'
  const { attempts, loaded, repo } = useReps()
  // The whole-program finish line: canonical curriculum reps only.
  const program = useMemo(() => programProgress(DAYS, attempts), [attempts])
  const lastLocal = useCallback(() => repo.lastLocalCompletionAt, [repo])
  const pct = Math.round(program.fraction * 100)
  return (
    <header className="site-header sticky top-0 z-30 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="flex h-14 items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight">
          <Mark />
          <span className="hidden sm:inline">Reps</span>
        </Link>
        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5">
          {NAV.map((n) => {
            const active = n.match(pathname)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-lg px-2 py-1.5 text-[13.5px] transition-colors sm:px-3 ${
                  active ? 'bg-surface-2 font-medium text-ink' : 'text-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden md:inline">
            <SyncIndicator />
          </span>
          <span className={`num hidden px-1 text-[12px] font-medium transition-opacity sm:inline ${loaded ? 'text-muted' : 'text-transparent'}`} title={`${program.completed} of ${program.total} reps in the whole program`}>
            {pct}%<span className="sr-only"> of the whole program complete</span>
          </span>
          <Link
            href="/interview"
            data-testid="interview-target-chip"
            title={`${INTERVIEW_TARGET.company} ${INTERVIEW_TARGET.role}: ${INTERVIEW_TARGET.rounds} technical interviews, ${INTERVIEW_TARGET.minutes} minutes each, in ${INTERVIEW_TARGET.language}`}
            aria-label={`Interview target: ${INTERVIEW_TARGET.company} ${INTERVIEW_TARGET.role}, ${INTERVIEW_TARGET.rounds} × ${INTERVIEW_TARGET.minutes} minute technical interviews in ${INTERVIEW_TARGET.language}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-[12px] text-ink-2 transition-colors hover:bg-surface-3"
          >
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="font-medium text-ink">{INTERVIEW_TARGET.chip.full[0]}</span>
              <span aria-hidden="true" className="text-faint">·</span>
              <span className="num">{INTERVIEW_TARGET.chip.full[1]}</span>
              <span aria-hidden="true" className="hidden text-faint md:inline">·</span>
              <span className="hidden md:inline">{INTERVIEW_TARGET.chip.full[2]}</span>
            </span>
            <span className="num font-medium sm:hidden">{INTERVIEW_TARGET.chip.compact}</span>
          </Link>
        </div>
      </div>
      <ProgramProgress progress={program} loaded={loaded} lastLocalCompletionAt={lastLocal} />
    </header>
  )
}
