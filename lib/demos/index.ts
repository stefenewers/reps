import type { DemoDefinition } from '@/lib/demos/types'
import { twoPointersDemo } from '@/lib/demos/two-pointers'

/**
 * Every interactive demo, in course order. Views live in components/demos/views
 * and are registered in components/demos/registry.tsx under the same id.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DEMOS: DemoDefinition<any, any>[] = [twoPointersDemo]

export const DEMO_BY_ID = Object.fromEntries(DEMOS.map((d) => [d.id, d]))

/** The demos that teach a concept (data/concepts.ts id). */
export function demosForConcept(conceptId: string) {
  return DEMOS.filter((d) => d.concept === conceptId)
}
