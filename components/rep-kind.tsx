import type { ComponentType } from 'react'
import type { Exercise } from '@/lib/types'
import { bucketOf, engagementOf, type Bucket } from '@/lib/curriculum-audit'
import { IconBlank, IconBug, IconChat, IconCode, IconEye, IconFlag, IconList, IconSnow, IconSort } from '@/components/icons'

/** How a rep presents itself: one source of truth for labels, icons and badges. */

export interface KindDisplay {
  bucket: Bucket
  /** Short noun for lists: Write, Debug, Trace… */
  short: string
  /** Header badge: "Debug Rep", "Cold Rep"… */
  badge: string
  badgeClass: string
  Icon: ComponentType<{ size?: number; className?: string }>
}

const SHORT: Record<Bucket, string> = {
  choice: 'Choose',
  output: 'Trace',
  fill: 'Fill',
  reorder: 'Order',
  write: 'Write',
  debug: 'Debug',
  capstone: 'Capstone',
  explain: 'Explain',
}

const ICON: Record<Bucket, KindDisplay['Icon']> = {
  choice: IconList,
  output: IconEye,
  fill: IconBlank,
  reorder: IconSort,
  write: IconCode,
  debug: IconBug,
  capstone: IconFlag,
  explain: IconChat,
}

export function kindOf(e: Exercise): KindDisplay {
  const bucket = bucketOf(e)
  const cold = e.repType === 'cold' || e.stage === 'retrieval'
  let badge = 'Rep'
  let badgeClass = 'badge'
  if (bucket === 'debug') {
    badge = 'Debug Rep'
    badgeClass = 'badge badge-debug'
  } else if (bucket === 'capstone') {
    badge = 'Capstone'
    badgeClass = 'badge badge-capstone'
  } else if (cold) {
    badge = 'Cold Rep'
    badgeClass = 'badge badge-cold'
  } else if (e.repType === 'interview' || bucket === 'explain') badge = 'Interview Rep'
  else if (bucket === 'output' || bucket === 'choice') badge = 'Learn'
  else if (e.repType === 'pattern') badge = 'Pattern Rep'
  else if (e.repType === 'combine' || e.stage === 'combine') badge = 'Combination Rep'
  else if (bucket === 'fill' || bucket === 'reorder') badge = 'Guided Rep'
  else badge = 'Foundation Rep'
  return { bucket, short: cold && bucket === 'write' ? 'Cold' : SHORT[bucket], badge, badgeClass, Icon: cold && bucket === 'write' ? IconSnow : ICON[bucket] }
}

/** Composition of a block of reps: "8 code · 3 debug · 2 guided · 1 trace". */
export function composition(list: Exercise[]): { code: number; debug: number; guided: number; passive: number } {
  const c = { code: 0, debug: 0, guided: 0, passive: 0 }
  for (const e of list) {
    const b = bucketOf(e)
    if (b === 'debug') c.debug++
    else if (engagementOf(e) === 'active') c.code++
    else if (engagementOf(e) === 'guided') c.guided++
    else c.passive++
  }
  return c
}

export function compositionText(list: Exercise[]): string {
  const c = composition(list)
  return [c.code && `${c.code} code`, c.debug && `${c.debug} debug`, c.guided && `${c.guided} guided`, c.passive && `${c.passive} recall`].filter(Boolean).join(' · ')
}
