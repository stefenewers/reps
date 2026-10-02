import type { MasteryStatus } from '@/lib/mastery'

/** Status as text plus a shape, never color alone. Color only helps scanning. */
const MARK: Record<MasteryStatus, string> = {
  unseen: '○',
  introduced: '◔',
  practicing: '◑',
  competent: '◕',
  fluent: '●',
  weak: '!',
}

const LABEL: Record<MasteryStatus, string> = {
  unseen: 'Unseen',
  introduced: 'Introduced',
  practicing: 'Practicing',
  competent: 'Competent',
  fluent: 'Fluent',
  weak: 'Needs reps',
}

/** Neutral by default; weight and shape separate the states. Only "needs reps" carries a warm mark. */
const TONE: Record<MasteryStatus, string> = {
  weak: 'bg-surface-2 text-ink [&>span]:text-amber',
  introduced: 'bg-surface-2 text-muted',
  practicing: 'bg-surface-2 text-ink-2',
  competent: 'bg-bg text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]',
  fluent: 'bg-ink text-white',
  unseen: 'text-faint',
}

export const STATUS_COLOR: Record<MasteryStatus, string> = {
  weak: 'var(--amber)',
  introduced: '#b9b8b3',
  practicing: '#6f6e6a',
  competent: 'var(--ink-2)',
  fluent: 'var(--ink)',
  unseen: 'var(--surface-3)',
}

export function StatusLabel({ status, compact = false }: { status: MasteryStatus; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${compact ? 'px-1.5 text-[11px]' : 'px-2 py-0.5 text-[11.5px]'} ${TONE[status]}`}>
      <span aria-hidden="true">{MARK[status]}</span>
      {LABEL[status]}
    </span>
  )
}

export function ScoreBar({ score, status, className = '' }: { score: number; status?: MasteryStatus; className?: string }) {
  return (
    <span className={`bar inline-block w-20 align-middle ${className}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={`Mastery ${score}`}>
      <span style={{ width: `${score}%`, background: status ? STATUS_COLOR[status] : undefined }} />
    </span>
  )
}
