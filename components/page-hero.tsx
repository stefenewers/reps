import type { ReactNode } from 'react'
import Scene, { type Mood } from '@/components/scene'

/**
 * The top of a Reps page: the landscape, a serif title, and room for a deck to
 * overlap its foot (pass `deck` when the page's first section rises into it).
 */
export default function PageHero({
  title,
  sub,
  aside,
  eyebrow,
  mood = 'dawn',
  deck = false
}: {
  title: ReactNode
  sub?: ReactNode
  aside?: ReactNode
  eyebrow?: ReactNode
  mood?: Mood
  deck?: boolean
}) {
  const dark = mood === 'dusk' || mood === 'night'
  return (
    <div className="hero" data-mood={mood}>
      <Scene mood={mood} />
      <div className="hero-veil" />
      <div
        className={`mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-5 pt-8 sm:px-8 sm:pt-12 lg:flex-row lg:items-start lg:justify-between ${deck ? 'pb-36' : 'pb-16 sm:pb-20'}`}
      >
        <div className="max-w-[660px]">
          {eyebrow && <p className={`text-[14px] font-medium ${dark ? 'text-white/80' : 'text-ink-2'}`}>{eyebrow}</p>}
          <h1 className="headline mt-1">{title}</h1>
          {sub && <div className={`mt-3 max-w-[600px] text-[16px] leading-relaxed ${dark ? 'text-white/85' : 'text-ink-2'}`}>{sub}</div>}
        </div>
        {aside}
      </div>
    </div>
  )
}
