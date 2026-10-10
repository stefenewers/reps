/**
 * The Reps mark: three rising bars, light to deep blue, the middle one short.
 * Redrawn as SVG from the brand board (public/Reps Minimalist Brand Identity Board.png).
 * `mono` draws it in the current text color.
 */
export const BRAND_BLUES = ['#3B7BFF', '#1C58EC', '#0B2FD0'] as const

export default function BrandMark({ size = 22, mono = false, className = '' }: { size?: number; mono?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g transform="skewY(-14)">
        <rect x="8" y="19" width="48" height="12.5" rx="3.2" fill={mono ? 'currentColor' : BRAND_BLUES[0]} />
        <rect x="8" y="35.5" width="39" height="12.5" rx="3.2" fill={mono ? 'currentColor' : BRAND_BLUES[1]} />
        <rect x="8" y="52" width="47" height="12.5" rx="3.2" fill={mono ? 'currentColor' : BRAND_BLUES[2]} />
      </g>
    </svg>
  )
}
