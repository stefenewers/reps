import type { MasteryStatus } from '@/lib/mastery'

/** Status as text plus a shape, never color alone. */
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

export function StatusLabel({ status, compact = false }: { status: MasteryStatus; compact?: boolean }) {
  const tone =
    status === 'weak'
      ? 'bg-fail-soft text-fail'
      : status === 'fluent'
        ? 'bg-ink text-white'
        : status === 'competent'
          ? 'bg-pass-soft text-pass'
          : status === 'unseen'
            ? 'text-faint'
            : 'bg-surface-2 text-muted'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${compact ? 'px-1.5 text-[11px]' : 'px-2 py-0.5 text-[11.5px]'} ${tone}`}>
      <span aria-hidden="true">{MARK[status]}</span>
      {LABEL[status]}
    </span>
  )
}

export function ScoreBar({ score, className = '' }: { score: number; className?: string }) {
  return (
    <span className={`bar inline-block w-20 align-middle ${className}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={`Mastery ${score}`}>
      <span style={{ width: `${score}%` }} />
    </span>
  )
}
