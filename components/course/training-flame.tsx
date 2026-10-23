import type { Flame } from '@/lib/course/week-status'

const LABEL: Record<Flame, string> = { unlit: 'Not started', ember: 'Ember', burning: 'Burning', blaze: 'Blaze' }

/**
 * The Training Flame: today's momentum, not mastery. It grows with today's
 * qualifying work and blazes when the target is met. Text equivalent always
 * present; it never animates under reduced motion.
 */
export default function TrainingFlame({ state, size = 44, ignite = false }: { state: Flame; size?: number; ignite?: boolean }) {
  const scale = state === 'unlit' ? 0.55 : state === 'ember' ? 0.7 : state === 'burning' ? 0.86 : 1
  const outer = state === 'unlit' ? 'var(--line-strong)' : state === 'blaze' ? 'url(#flame-hot)' : 'url(#flame-warm)'
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Training flame: ${LABEL[state]}`} data-testid="training-flame" data-flame={state}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={`${state !== 'unlit' ? 'flame-live' : ''} ${ignite ? 'flame-ignite' : ''}`}>
        <defs>
          <linearGradient id="flame-warm" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--flame)" />
            <stop offset="1" stopColor="var(--flame-2)" />
          </linearGradient>
          <linearGradient id="flame-hot" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#d9480f" />
            <stop offset="0.55" stopColor="var(--flame)" />
            <stop offset="1" stopColor="#ffc24b" />
          </linearGradient>
        </defs>
        <g transform={`translate(24 44) scale(${scale}) translate(-24 -44)`}>
          <path d="M24 4c3 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 1 4 3 6 5 6-2-6 0-12 2-18Z" fill={outer} />
          {state !== 'unlit' && <path d="M24 22c2 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9Z" fill={state === 'blaze' ? '#fff1c7' : '#ffe2b3'} />}
        </g>
      </svg>
      {ignite && (
        <span aria-hidden="true">
          {[
            [-16, -14],
            [14, -16],
            [-18, 6],
            [18, 4],
            [0, -22],
          ].map(([dx, dy], i) => (
            <span key={i} className="spark" style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animationDelay: `${i * 40}ms` }} />
          ))}
        </span>
      )}
    </span>
  )
}
