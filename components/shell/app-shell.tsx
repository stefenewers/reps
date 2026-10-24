'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import BrandMark from '@/components/brand-mark'
import TrainingFlame from '@/components/course/training-flame'
import { IconBook, IconChart, IconGrid, IconHome, IconLog, IconMic, IconRoad, IconTarget, IconX } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { COURSE_START } from '@/data/course/calendar'
import { INTERVIEW_TARGET } from '@/data/program'
import type { SyncStatus } from '@/lib/storage/types'

/**
 * The Reps 2.0 shell. One training programme, one hierarchy:
 *   Today first, then the Road and the evidence (Progress), then learning and
 *   the interview; the practice library (skills, problems, log) is secondary.
 * Desktop: a dark sidebar. Mobile: a slim top bar and a bottom tab bar.
 * Focus surfaces (a rep, a mock in progress) get a narrow rail and no tab bar.
 */

type Item = { href: string; label: string; short?: string; icon: (p: { size?: number }) => ReactNode; match: (p: string) => boolean }

const PRIMARY: Item[] = [
  { href: '/', label: 'Today', icon: IconHome, match: (p) => p === '/' || p.startsWith('/day') || p.startsWith('/rep') },
  { href: '/plan', label: 'Road to Ready', short: 'Road', icon: IconRoad, match: (p) => p.startsWith('/plan') },
  { href: '/progress', label: 'Progress', icon: IconChart, match: (p) => p.startsWith('/progress') },
  { href: '/learn', label: 'Learn', icon: IconBook, match: (p) => p.startsWith('/learn') || p.startsWith('/example') || p.startsWith('/lab') },
  { href: '/interview', label: 'Interview', icon: IconMic, match: (p) => p.startsWith('/interview') }
]
const LIBRARY: Item[] = [
  { href: '/skills', label: 'Skills', icon: IconTarget, match: (p) => p.startsWith('/skills') },
  { href: '/problems', label: 'Problems', icon: IconGrid, match: (p) => p.startsWith('/problems') },
  { href: '/log', label: 'Solve log', icon: IconLog, match: (p) => p.startsWith('/log') }
]

const SYNC_LABEL: Record<SyncStatus, string> = {
  'local-only': 'Saved on this device',
  'signed-out': 'Sign in to sync',
  syncing: 'Syncing',
  saved: 'Saved',
  offline: 'Offline · saved locally'
}

function SyncIndicator({ dark = false }: { dark?: boolean }) {
  const { status, pending, syncError } = useReps()
  const dot = status === 'saved' ? 'bg-pass' : status === 'syncing' ? 'bg-accent pulse' : status === 'offline' ? 'bg-amber' : 'bg-faint'
  const label = status === 'offline' && pending ? `Offline · ${pending} saved locally` : SYNC_LABEL[status]
  const content = (
    <span
      className={`inline-flex items-center gap-2 text-[12px] ${dark ? 'text-shell-muted hover:text-shell-ink' : 'text-muted hover:text-ink'}`}
      role="status"
      aria-live="polite"
      title={status === 'offline' && syncError ? syncError : undefined}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
  return status === 'signed-out' || status === 'offline' ? <Link href="/sign-in">{content}</Link> : content
}

/** The interview target: what Reps is preparing for. Deliberately without a date. */
function TargetChip({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/interview"
      data-testid="interview-target-chip"
      title={`${INTERVIEW_TARGET.role}: ${INTERVIEW_TARGET.company}, about ${INTERVIEW_TARGET.rounds} rounds of ${INTERVIEW_TARGET.minutes} minutes, in ${INTERVIEW_TARGET.language}`}
      aria-label={`Interview target: ${INTERVIEW_TARGET.role}, ${INTERVIEW_TARGET.company}, about ${INTERVIEW_TARGET.rounds} rounds of ${INTERVIEW_TARGET.minutes} minutes in ${INTERVIEW_TARGET.language}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] ${dark ? 'bg-shell-2 text-shell-ink hover:bg-shell-3' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'}`}
    >
      <span className="font-semibold">{INTERVIEW_TARGET.chip.full[0]}</span>
      <span aria-hidden="true" className="opacity-50">
        ·
      </span>
      <span>{INTERVIEW_TARGET.chip.full[1]}</span>
      <span aria-hidden="true" className="opacity-50">
        ·
      </span>
      <span>{INTERVIEW_TARGET.chip.full[2]}</span>
    </Link>
  )
}

/** The streak and the flame, wherever the shell is: momentum is always one glance away. */
function Momentum({ compact = false }: { compact?: boolean }) {
  const { today, loaded } = useReps()
  const cd = useCourseDay()
  if (!loaded) return <span className="h-9" />
  if (today < COURSE_START)
    return (
      <span className={`flex items-center gap-2 ${compact ? 'text-[12px] text-ink-2' : 'text-[12.5px] text-shell-muted'}`}>
        <TrainingFlame state="unlit" size={compact ? 20 : 26} />
        Starts Mon, Oct 26
      </span>
    )
  return (
    <span className={`flex items-center gap-2 ${compact ? 'text-[12px] text-ink-2' : ''}`} data-testid="shell-momentum">
      <TrainingFlame state={cd.flame} size={compact ? 20 : 28} testId="shell-flame" />
      {compact ? (
        <span className="num font-semibold">{cd.streak}</span>
      ) : (
        <span className="leading-tight">
          <span className="num block text-[13px] font-semibold text-shell-ink">
            {cd.streak} day streak
          </span>
          <span className="block text-[11.5px] text-shell-muted">
            Week {cd.week.number} of 14 · {cd.week.short}
          </span>
        </span>
      )}
    </span>
  )
}

function SideLink({ item, active, rail }: { item: Item; active: boolean; rail: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={rail ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg text-[13.5px] transition-colors ${rail ? 'size-11 justify-center' : 'h-10 px-3'} ${
        active ? 'bg-shell-3 font-medium text-shell-ink' : 'text-shell-muted hover:bg-shell-2 hover:text-shell-ink'
      }`}
    >
      {active && <span aria-hidden="true" className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-accent-bright" />}
      <Icon size={17} />
      <span className={rail ? 'sr-only' : ''}>{item.label}</span>
    </Link>
  )
}

function Sidebar({ pathname, rail }: { pathname: string; rail: boolean }) {
  return (
    <aside
      className={`shell fixed inset-y-0 left-0 z-30 hidden flex-col bg-shell text-shell-ink lg:flex ${rail ? 'w-[72px] items-center px-3' : 'w-[232px] px-5'}`}
      data-rail={rail ? 'true' : 'false'}
    >
      <Link href="/" className={`mt-6 flex items-center gap-2.5 rounded-md ${rail ? '' : 'px-1'}`} aria-label="Reps, today">
        <BrandMark size={26} />
        {!rail && (
          <span className="font-display text-[22px] font-semibold tracking-tight">
            Reps<span className="ml-1.5 rounded bg-accent-bright px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold tracking-normal text-white">2.0</span>
          </span>
        )}
      </Link>
      <nav aria-label="Main" className={`mt-9 flex flex-col gap-1 ${rail ? 'items-center' : ''}`}>
        {PRIMARY.map((n) => (
          <SideLink key={n.href} item={n} active={n.match(pathname)} rail={rail} />
        ))}
        {!rail && <p className="mt-6 mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-shell-faint">Practice library</p>}
        {rail && <span aria-hidden="true" className="my-3 h-px w-8 bg-shell-3" />}
        {LIBRARY.map((n) => (
          <SideLink key={n.href} item={n} active={n.match(pathname)} rail={rail} />
        ))}
      </nav>
      <div className={`mt-auto mb-5 flex flex-col gap-4 ${rail ? 'items-center' : ''}`}>
        {rail ? (
          <Momentum compact />
        ) : (
          <>
            <div className="rounded-xl bg-shell-2 p-3.5">
              <Momentum />
            </div>
            <div className="flex flex-col gap-2.5 px-1">
              <TargetChip dark />
              <SyncIndicator dark />
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function TabBar({ pathname, onMore, moreOpen }: { pathname: string; onMore: () => void; moreOpen: boolean }) {
  const tabs = PRIMARY.filter((t) => t.href !== '/learn')
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] ${active ? 'font-semibold text-accent' : 'text-muted'}`}
              >
                <Icon size={19} />
                {t.short ?? t.label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            aria-expanded={moreOpen}
            className={`flex h-[60px] w-full flex-col items-center justify-center gap-1 text-[11px] ${moreOpen || [...LIBRARY, PRIMARY[3]].some((n) => n.match(pathname)) ? 'font-semibold text-accent' : 'text-muted'}`}
          >
            <IconGrid size={19} />
            More
          </button>
        </li>
      </ul>
    </nav>
  )
}

function MoreSheet({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
      <button type="button" aria-label="Close" className="fade-in absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="sheet-in absolute inset-x-0 bottom-0 rounded-t-2xl bg-bg px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-muted">More</p>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <IconX size={14} />
          </button>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {[PRIMARY[3], ...LIBRARY].map((n) => {
            const Icon = n.icon
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={onClose}
                  aria-current={n.match(pathname) ? 'page' : undefined}
                  className="flex h-14 items-center gap-3 rounded-xl bg-surface px-4 text-[14px] font-medium text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-ink"
                >
                  <Icon size={18} />
                  {n.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <TargetChip />
          <SyncIndicator />
        </div>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const [more, setMore] = useState(false)
  // Close the sheet on navigation.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the sheet follows the route
  useEffect(() => setMore(false), [pathname])
  // The public demo and sign-in have their own minimal chrome.
  if (pathname.startsWith('/demo') || pathname.startsWith('/sign-in')) return <div className="flex flex-1 flex-col">{children}</div>
  // Focus surfaces: the rep workspace and a mock in progress.
  const focus = pathname.startsWith('/rep/') || /^\/interview\/[^/]+/.test(pathname)
  return (
    <div className={`flex min-h-full flex-1 flex-col ${focus ? 'lg:pl-[72px]' : 'lg:pl-[232px]'}`} data-shell={focus ? 'focus' : 'full'}>
      <Sidebar pathname={pathname} rail={focus} />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-display text-[19px] font-semibold tracking-tight" aria-label="Reps, today">
          <BrandMark size={22} />
          Reps
        </Link>
        <span className="ml-auto">
          <Momentum compact />
        </span>
      </header>
      <div className={`flex flex-1 flex-col ${focus ? '' : 'pb-[76px] lg:pb-0'}`}>{children}</div>
      {!focus && <TabBar pathname={pathname} onMore={() => setMore((m) => !m)} moreOpen={more} />}
      {more && <MoreSheet pathname={pathname} onClose={() => setMore(false)} />}
    </div>
  )
}
