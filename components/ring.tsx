/** A progress ring. Value and max are shown by the caller; the ring itself is decorative. */
export default function Ring({
  value,
  max,
  size = 96,
  stroke = 9,
  color = 'var(--accent)',
  children,
  className = ''
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  color?: string
  children?: React.ReactNode
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring absolute inset-0 -rotate-90" aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        {p > 0 && (
          <circle className="ring-arc" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={color} strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
        )}
      </svg>
      <span className="relative text-center">{children}</span>
    </span>
  )
}
