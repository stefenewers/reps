import Link from 'next/link'
import type { ReactNode } from 'react'
import '@/components/demos/learning.css'

/**
 * The top of every learning surface: a blueprint band (learn-blue; warm for
 * labs, which are building), the trail back, what kind of step this is, and a
 * serif title. The figure in the corner is decorative.
 */
export type LearnKind = 'Lesson' | 'Concept' | 'Worked example' | 'Watch it move' | 'Lab'

export default function LearnHero({
  kind,
  crumbs,
  title,
  sub,
  meta,
  aside
}: {
  kind: LearnKind
  crumbs: { href: string; label: string }[]
  title: ReactNode
  sub?: ReactNode
  meta?: ReactNode
  aside?: ReactNode
}) {
  const build = kind === 'Lab'
  return (
    <div className="learn-hero" data-tone={build ? 'build' : 'learn'}>
      <Mark kind={kind} />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-5 pt-7 pb-12 sm:px-8 sm:pt-10 sm:pb-14 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[720px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-2">
            {crumbs.map((c, i) => (
              <span key={c.href + c.label} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden="true" className="text-faint">
                    /
                  </span>
                )}
                <Link href={c.href} className="hover:text-ink hover:underline">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className={`tag mt-4 ${build ? 'tag-flame' : 'tag-learn'}`}>{kind}</p>
          <h1 className="headline mt-2">{title}</h1>
          {sub && <div className="mt-3 max-w-[640px] text-[16.5px] leading-relaxed text-ink-2">{sub}</div>}
          {meta && <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">{meta}</div>}
        </div>
        {aside}
      </div>
    </div>
  )
}

/** A light drawing of the kind of thinking the page asks for. */
function Mark({ kind }: { kind: LearnKind }) {
  const stroke = kind === 'Lab' ? 'rgba(168,106,18,0.35)' : 'rgba(47,111,219,0.35)'
  const fill = kind === 'Lab' ? 'rgba(234,106,16,0.10)' : 'rgba(47,111,219,0.08)'
  return (
    <svg className="learn-hero-mark" width="360" height="220" viewBox="0 0 360 220" aria-hidden="true">
      {kind === 'Watch it move' ? (
        <g fill={fill} stroke={stroke} strokeWidth="1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={30 + i * 50} y={120} width="42" height="42" rx="10" />
          ))}
          <rect x={76} y={112} width="146" height="58" rx="14" fill="none" strokeDasharray="5 5" />
          <path d="M97 92v18M197 92v18" />
          <circle cx="97" cy="86" r="6" />
          <circle cx="197" cy="86" r="6" />
        </g>
      ) : kind === 'Lab' ? (
        <g fill={fill} stroke={stroke} strokeWidth="1.5">
          <rect x="60" y="40" width="120" height="70" rx="12" />
          <rect x="200" y="40" width="120" height="70" rx="12" />
          <rect x="130" y="135" width="120" height="60" rx="12" />
          <path d="M180 75h20M120 110l40 25M260 110l-30 25" fill="none" />
        </g>
      ) : (
        <g fill={fill} stroke={stroke} strokeWidth="1.5">
          <circle cx="180" cy="40" r="20" />
          <circle cx="110" cy="110" r="20" />
          <circle cx="250" cy="110" r="20" />
          <circle cx="70" cy="180" r="20" />
          <circle cx="150" cy="180" r="20" />
          <circle cx="290" cy="180" r="20" />
          <path d="M166 54l-42 42M194 54l42 42M98 126l-18 38M122 126l18 38M262 126l18 38" fill="none" />
        </g>
      )}
    </svg>
  )
}
