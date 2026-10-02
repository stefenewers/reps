import { createElement, type ComponentType, type SVGProps } from 'react'
import { IconBug, IconFlag, IconSnow } from '@/components/icons'

/**
 * Concept glyphs: one per idea, same 16px grid and 1.6 stroke as the rest of the
 * icon set. Mapped from section, day and skill-group names so the product reads
 * less like a wall of text.
 */

type P = SVGProps<SVGSVGElement> & { size?: number }

function I({ size = 16, children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {children}
    </svg>
  )
}

export const GlyphBraces = (p: P) => (
  <I {...p}>
    <path d="M5.5 2.5c-1.5 0-2 .7-2 2v1.5c0 .8-.5 1.5-1.5 1.5v1c1 0 1.5.7 1.5 1.5v1.5c0 1.3.5 2 2 2M10.5 2.5c1.5 0 2 .7 2 2v1.5c0 .8.5 1.5 1.5 1.5v1c-1 0-1.5.7-1.5 1.5v1.5c0 1.3-.5 2-2 2" />
  </I>
)
export const GlyphLoop = (p: P) => (
  <I {...p}>
    <path d="M12.5 6.5A4.8 4.8 0 0 0 4 4.7M3.5 9.5A4.8 4.8 0 0 0 12 11.3M3.8 2.5v2.4h2.4M12.2 13.5v-2.4H9.8" />
  </I>
)
export const GlyphKeyValue = (p: P) => (
  <I {...p}>
    <circle cx="5" cy="8" r="2.8" />
    <path d="M7.8 8h6.2M11.5 8v2.2M13.5 8v1.6" />
  </I>
)
export const GlyphSets = (p: P) => (
  <I {...p}>
    <circle cx="6" cy="8" r="4" />
    <circle cx="10" cy="8" r="4" />
  </I>
)
export const GlyphPointers = (p: P) => (
  <I {...p}>
    <path d="M2 5.5h11M10.5 3l2.5 2.5L10.5 8M14 10.5H3M5.5 8 3 10.5 5.5 13" />
  </I>
)
export const GlyphWindow = (p: P) => (
  <I {...p}>
    <path d="M1.5 8h13" strokeDasharray="1.4 1.6" />
    <rect x="5" y="4.5" width="6" height="7" rx="1.5" />
  </I>
)
export const GlyphStack = (p: P) => (
  <I {...p}>
    <rect x="3" y="10.5" width="10" height="3" rx="1" />
    <rect x="3" y="6.5" width="10" height="3" rx="1" />
    <rect x="4.5" y="2.5" width="7" height="3" rx="1" />
  </I>
)
export const GlyphTree = (p: P) => (
  <I {...p}>
    <circle cx="8" cy="3.2" r="1.7" />
    <circle cx="4" cy="12.5" r="1.7" />
    <circle cx="12" cy="12.5" r="1.7" />
    <path d="M7 4.6 4.8 10.9M9 4.6l2.2 6.3" />
  </I>
)
export const GlyphGraph = (p: P) => (
  <I {...p}>
    <circle cx="3.5" cy="4.5" r="1.6" />
    <circle cx="12.5" cy="3.5" r="1.6" />
    <circle cx="11" cy="12.5" r="1.6" />
    <circle cx="4" cy="11.5" r="1.6" />
    <path d="M5 4.3l5.9-.6M12.2 5.1l-.9 5.8M9.4 12.3 5.6 11.7M3.7 6.1l.2 3.8M4.8 5.8l5 5.4" />
  </I>
)
export const GlyphHeap = (p: P) => (
  <I {...p}>
    <path d="M8 2.5 14 13.5H2Z" />
    <path d="M5 8.5h6" />
  </I>
)
export const GlyphChain = (p: P) => (
  <I {...p}>
    <rect x="1.5" y="6" width="4" height="4" rx="1" />
    <rect x="10.5" y="6" width="4" height="4" rx="1" />
    <path d="M5.5 8h5M8.7 6.3 10.5 8l-1.8 1.7" />
  </I>
)
export const GlyphSearch = (p: P) => (
  <I {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.3 10.3 3.7 3.7M7 4.5v5" />
  </I>
)
export const GlyphGrid = (p: P) => (
  <I {...p}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M6 2v12M10 2v12M2 6h12M2 10h12" />
  </I>
)
export const GlyphBranch = (p: P) => (
  <I {...p}>
    <circle cx="4" cy="3.5" r="1.5" />
    <circle cx="4" cy="12.5" r="1.5" />
    <circle cx="12" cy="6" r="1.5" />
    <path d="M4 5v6M4 9.5c0-2.5 6.5-1 8-2" />
  </I>
)
export const GlyphSteps = (p: P) => (
  <I {...p}>
    <path d="M2 13.5h3.5V10H9V6.5h3.5V3H14" />
  </I>
)
export const GlyphText = (p: P) => (
  <I {...p}>
    <path d="M2 12.5 5 3.5l3 9M3 9.5h4M10.5 8.5c.4-.8 1.1-1.2 2-1.2 1.2 0 1.8.7 1.8 1.8v3.4M14.3 10.5c-.9-.3-3.8-.4-3.8 1 0 1.3 2.6 1.2 3.8 0" />
  </I>
)
export const GlyphSort = (p: P) => (
  <I {...p}>
    <path d="M3 13V9M6.5 13V6.5M10 13V4.5M13.5 13V2.5" />
  </I>
)
export const GlyphTimer = (p: P) => (
  <I {...p}>
    <circle cx="8" cy="9" r="5.2" />
    <path d="M8 6.2V9l1.8 1.2M6.5 1.8h3" />
  </I>
)
export const GlyphTerminal = (p: P) => (
  <I {...p}>
    <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="2" />
    <path d="m4.5 6.5 2 1.8-2 1.8M8.5 10.2h3" />
  </I>
)
export const GlyphIntervals = (p: P) => (
  <I {...p}>
    <path d="M2 5h6M6 8h7M3 11h5" strokeWidth={2.2} />
  </I>
)

type Glyph = ComponentType<{ size?: number; className?: string }>

const RULES: [RegExp, Glyph][] = [
  [/cold|retriev/i, IconSnow],
  [/debug|bug|fix/i, IconBug],
  [/contains duplicate|valid anagram|two sum|palindrome|stock|parenthes|binary search$|reverse|merge two|max depth|same tree|invert|level order|islands|path exists|provinces|course schedule|top k|kth|merge intervals|subsets|climbing|house robber|capstone/i, IconFlag],
  [/interview|mock|say it|speed/i, GlyphTimer],
  [/edge case|complexity/i, GlyphTerminal],
  [/enumerate|loop|range|for /i, GlyphLoop],
  [/hash set|\bsets?\b/i, GlyphSets],
  [/\.get|dict|index map|frequency|complement|hash/i, GlyphKeyValue],
  [/running|min\b|max\b/i, GlyphSort],
  [/string|slic|char/i, GlyphText],
  [/pointer|two sum ii/i, GlyphPointers],
  [/window|substring/i, GlyphWindow],
  [/stack|bracket|matching/i, GlyphStack],
  [/binary search|search/i, GlyphSearch],
  [/linked|listnode|dummy|rewir/i, GlyphChain],
  [/tree|dfs|recurs/i, GlyphTree],
  [/grid|neighbo|island/i, GlyphGrid],
  [/bfs|deque|queue|level/i, GlyphTree],
  [/graph|adjacen|component|cycle|province|course/i, GlyphGraph],
  [/heap|top-k|top k/i, GlyphHeap],
  [/sort|key/i, GlyphSort],
  [/interval/i, GlyphIntervals],
  [/backtrack|subset|decision|path state|permut/i, GlyphBranch],
  [/memo|dp|recurrence|rolling|bottom-up|stairs/i, GlyphSteps],
  [/python|recall|list|foundation|warm/i, GlyphBraces],
]

/** Best-fit glyph for a section/day/group name. */
export function conceptGlyph(name: string): Glyph {
  for (const [re, g] of RULES) if (re.test(name)) return g
  return GlyphBraces
}

/** Day-level glyphs (the plan strip). */
export const DAY_GLYPH: Record<string, Glyph> = {
  '2026-10-02': GlyphKeyValue,
  '2026-10-03': GlyphPointers,
  '2026-10-04': GlyphWindow,
  '2026-10-05': GlyphSearch,
  '2026-10-06': GlyphTree,
  '2026-10-07': GlyphGrid,
  '2026-10-08': GlyphGraph,
  '2026-10-09': GlyphHeap,
  '2026-10-10': GlyphBranch,
  '2026-10-11': GlyphTimer,
}

/** Skill-group glyphs. */
export const GROUP_GLYPH: Record<string, Glyph> = {
  'Python foundations': GlyphBraces,
  Hashing: GlyphKeyValue,
  'Strings & pointers': GlyphPointers,
  'Windows & stacks': GlyphWindow,
  'Search & linked lists': GlyphChain,
  'Recursion & trees': GlyphTree,
  'BFS & grids': GlyphGrid,
  Graphs: GlyphGraph,
  'Heaps, sorting & intervals': GlyphHeap,
  'Backtracking & DP': GlyphBranch,
  'Interview craft': GlyphTerminal,
}

/** Kind of section for path styling. */
export function sectionKind(title: string, exercises: { repType: string; stage: string }[]): 'capstone' | 'cold' | 'normal' {
  if (exercises.some((e) => e.repType === 'capstone')) return 'capstone'
  if (/cold/i.test(title) || (exercises.length > 0 && exercises.every((e) => e.repType === 'cold' || e.stage === 'retrieval'))) return 'cold'
  return 'normal'
}

/** Render the best-fit glyph for a name. */
export function ConceptGlyph({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  return createElement(conceptGlyph(name), { size, className })
}
