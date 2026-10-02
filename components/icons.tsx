import type { SVGProps } from 'react'

/** A small, consistent icon set: 16px grid, 1.6 stroke, round caps. Decorative by default. */

type P = SVGProps<SVGSVGElement> & { size?: number }

function I({ size = 16, children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {children}
    </svg>
  )
}

export const IconCode = (p: P) => (
  <I {...p}>
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
  </I>
)
export const IconBug = (p: P) => (
  <I {...p}>
    <rect x="4.5" y="5" width="7" height="8.5" rx="3.5" />
    <path d="M8 8v5.5M2.5 9h2M11.5 9h2M3 5.5l1.8 1M13 5.5l-1.8 1M3.5 13l1.4-1M12.5 13l-1.4-1M6 3.2 6.6 5M10 3.2 9.4 5" />
  </I>
)
export const IconEye = (p: P) => (
  <I {...p}>
    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
    <circle cx="8" cy="8" r="2" />
  </I>
)
export const IconList = (p: P) => (
  <I {...p}>
    <circle cx="3.5" cy="4.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
    <path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7" />
  </I>
)
export const IconSort = (p: P) => (
  <I {...p}>
    <path d="M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5" />
  </I>
)
export const IconFlag = (p: P) => (
  <I {...p}>
    <path d="M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8" />
  </I>
)
export const IconChat = (p: P) => (
  <I {...p}>
    <path d="M2.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H7l-3 2.5v-2.5h0a2 2 0 0 1-1.5-2Z" />
  </I>
)
export const IconBlank = (p: P) => (
  <I {...p}>
    <path d="M2.5 4.5h4M2.5 8h2.5M9 8h4.5M2.5 11.5h6" />
    <rect x="5.5" y="6.5" width="3" height="3" rx="0.8" strokeDasharray="1.5 1.2" />
  </I>
)
export const IconSnow = (p: P) => (
  <I {...p}>
    <path d="M8 1.5v13M2.4 4.75l11.2 6.5M2.4 11.25l11.2-6.5M6.3 2.6 8 4l1.7-1.4M6.3 13.4 8 12l1.7 1.4" />
  </I>
)
export const IconPlay = (p: P) => (
  <I {...p}>
    <path d="M5 3.3v9.4a.6.6 0 0 0 .9.5l7.3-4.7a.6.6 0 0 0 0-1L5.9 2.8a.6.6 0 0 0-.9.5Z" fill="currentColor" stroke="none" />
  </I>
)
export const IconCheck = (p: P) => (
  <I {...p}>
    <path d="m3 8.5 3.2 3L13 4.5" />
  </I>
)
export const IconX = (p: P) => (
  <I {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </I>
)
export const IconArrowRight = (p: P) => (
  <I {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </I>
)
export const IconArrowLeft = (p: P) => (
  <I {...p}>
    <path d="M13 8H3M7 4 3 8l4 4" />
  </I>
)
export const IconBulb = (p: P) => (
  <I {...p}>
    <path d="M6 12.5h4M6.5 14.5h3M5.5 10.5c-1-1-1.8-2-1.8-3.8a4.3 4.3 0 0 1 8.6 0c0 1.8-.8 2.8-1.8 3.8-.4.4-.5.9-.5 1.5h-4c0-.6-.1-1.1-.5-1.5Z" />
  </I>
)
export const IconRotate = (p: P) => (
  <I {...p}>
    <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v3h3" />
  </I>
)
export const IconSpark = (p: P) => (
  <I {...p}>
    <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.8 3.8l2 2M10.2 10.2l2 2M3.8 12.2l2-2M10.2 5.8l2-2" />
  </I>
)
export const IconClock = (p: P) => (
  <I {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.8V8l2.2 1.4" />
  </I>
)
export const IconDots = (p: P) => (
  <I {...p}>
    <circle cx="3.5" cy="8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="8" r="0.9" fill="currentColor" stroke="none" />
  </I>
)
export const IconFile = (p: P) => (
  <I {...p}>
    <path d="M4 1.8h5.2L12.5 5v9.2H4Z" />
    <path d="M9 1.8V5h3.5" />
  </I>
)
export const IconLock = (p: P) => (
  <I {...p}>
    <rect x="3.5" y="7" width="9" height="7" rx="1.8" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </I>
)
export const IconExternal = (p: P) => (
  <I {...p}>
    <path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" />
  </I>
)
