import { slidingWindowDemo } from '@/lib/demos/sliding-window'
import { binarySearchDemo } from '@/lib/demos/binary-search'
import { linkedListDemo } from '@/lib/demos/linked-list'
import { recursionDemo } from '@/lib/demos/recursion'
import { treesDemo } from '@/lib/demos/trees'
import { graphsDemo } from '@/lib/demos/graphs'
import { backtrackingDemo } from '@/lib/demos/backtracking'
import { dpDemo } from '@/lib/demos/dynamic-programming'
import { heapDemo } from '@/lib/demos/heaps'
import { intervalsDemo } from '@/lib/demos/intervals'
import type { DemoDefinition } from '@/lib/demos/types'
import { twoPointersDemo } from '@/lib/demos/two-pointers'

/**
 * Every interactive demo, in course order. Views live in components/demos/views
 * and are registered in components/demos/registry.tsx under the same id.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DEMOS: DemoDefinition<any, any>[] = [
  twoPointersDemo,
  slidingWindowDemo,
  binarySearchDemo,
  linkedListDemo,
  recursionDemo,
  treesDemo,
  graphsDemo,
  backtrackingDemo,
  dpDemo,
  heapDemo,
  intervalsDemo
]

export const DEMO_BY_ID = Object.fromEntries(DEMOS.map((d) => [d.id, d]))

/** The demos that teach a concept (data/concepts.ts id). */
export function demosForConcept(conceptId: string) {
  return DEMOS.filter((d) => d.concept === conceptId || (conceptId === 'bfs' && d.id === 'trees'))
}
