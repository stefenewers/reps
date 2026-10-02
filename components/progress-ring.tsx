/** A compact circular progress indicator. Value is always also given as text. */
export default function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  tone = 'ink',
  children,
  label,
}: {
  value: number // 0–100
  size?: number
  stroke?: number
  tone?: 'ink' | 'pass' | 'accent'
  children?: React.ReactNode
  label?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  const color = tone === 'pass' ? 'var(--pass)' : tone === 'accent' ? 'var(--accent)' : 'var(--ink)'
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v)}% complete`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 520ms var(--ease-out)' }}
        />
      </svg>
      {children && <span className="absolute inset-0 grid place-items-center">{children}</span>}
    </span>
  )
}
