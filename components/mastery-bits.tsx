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

export function StatusLabel({ status }: { status: MasteryStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] ${status === 'weak' ? 'font-medium text-fail' : status === 'fluent' ? 'text-ink' : 'text-muted'}`}>
      <span aria-hidden="true" className="w-3 text-center">
        {MARK[status]}
      </span>
      {status}
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
