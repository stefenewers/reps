'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useReps } from '@/components/reps-provider'
import { INTERVIEW_DATE } from '@/data/curriculum'
import { daysBetween, localDate } from '@/lib/dates'
import type { SyncStatus } from '@/lib/storage/types'

const NAV = [
  { href: '/', label: 'Today', match: (p: string) => p === '/' || p.startsWith('/day') || p.startsWith('/rep') },
  { href: '/skills', label: 'Skills', match: (p: string) => p.startsWith('/skills') },
  { href: '/problems', label: 'Problems', match: (p: string) => p.startsWith('/problems') },
  { href: '/interview', label: 'Interview', match: (p: string) => p.startsWith('/interview') },
]

const SYNC_LABEL: Record<SyncStatus, string> = {
  'local-only': 'Saved locally',
  'signed-out': 'Saved locally · Sign in to sync',
  syncing: 'Syncing',
  saved: 'Saved',
  offline: 'Offline · saved locally',
}

function SyncIndicator() {
  const { status, pending, syncError } = useReps()
  const dot = status === 'saved' ? 'bg-pass' : status === 'syncing' ? 'bg-accent' : status === 'offline' ? 'bg-warn' : 'bg-faint'
  const label = status === 'offline' && pending ? `Offline · ${pending} saved locally` : SYNC_LABEL[status]
  const content = (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted" role="status" aria-live="polite" title={status === 'offline' && syncError ? syncError : undefined}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
  return status === 'signed-out' ? (
    <Link href="/sign-in" className="hover:text-ink">
      {content}
    </Link>
  ) : (
    content
  )
}

export default function Header() {
  const pathname = usePathname() ?? '/'
  const days = Math.max(0, daysBetween(localDate(), INTERVIEW_DATE))
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="flex h-12 items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Reps
        </Link>
        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          {NAV.map((n) => {
            const active = n.match(pathname)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-1.5 py-1.5 text-[13px] transition-colors sm:px-2.5 ${active ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-5">
          <span className="hidden sm:inline">
            <SyncIndicator />
          </span>
          <span className="text-[12px] text-muted tabular-nums">
            <span className="hidden md:inline">Oct 12 · Google · </span>
            <span className="text-ink" suppressHydrationWarning>{days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`}</span>
          </span>
        </div>
      </div>
    </header>
  )
}
