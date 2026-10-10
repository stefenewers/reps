/**
 * The design track of the 90-day plan: one item for most Mondays, object-oriented
 * design first, then one end-to-end system. The bar for SWE I is clean classes
 * and APIs, a sensible data model, and depth on your own projects.
 */
export interface DesignItem {
  id: string
  /** Plan week (1–13). */
  week: number
  kind: 'object design' | 'system design' | 'drill'
  title: string
  /** What "done" means. */
  deliverables: string[]
}

export const DESIGN_TRACK: DesignItem[] = [
  { id: 'min-stack', week: 3, kind: 'object design', title: 'Min Stack and GetRandom set', deliverables: ['Class with its invariant stated in one sentence', 'Every method O(1), explained', 'Three tests, including empty'] },
  { id: 'parking-lot', week: 4, kind: 'object design', title: 'Parking lot', deliverables: ['Classes and what each one owns', 'Method contracts for park and leave', 'One extension discussed: a new vehicle size'] },
  { id: 'lru-cache', week: 5, kind: 'object design', title: 'LRU cache', deliverables: ['Hash map + doubly linked list, drawn', 'get and put in O(1), coded', 'What changes for a size-in-bytes limit'] },
  { id: 'rate-limiter', week: 6, kind: 'object design', title: 'Token-bucket rate limiter', deliverables: ['State per client and how it refills', 'allow(client, now) coded and tested', 'Trade-off against a fixed window'] },
  { id: 'hld-primer', week: 8, kind: 'system design', title: 'Primer: client, API, database, cache, queue', deliverables: ['One page in your own words', 'SQL vs NoSQL: when you would pick each', 'What an index and a cache each buy you'] },
  { id: 'url-shortener', week: 9, kind: 'system design', title: 'URL shortener, end to end', deliverables: ['API and data model', 'How ids are generated', 'Where a cache goes, and what happens at 100× traffic'] },
  { id: 'kv-store', week: 10, kind: 'object design', title: 'In-memory key-value store with snapshots', deliverables: ['get / set / delete / snapshot / restore coded', 'Cost of a snapshot, and one cheaper design', 'Tests for restore after later writes'] },
  { id: 'ai-assisted', week: 10, kind: 'drill', title: 'AI-assisted round: failing test → feature → optimize', deliverables: ['A small multi-file Python repo of your own', '60 minutes with an AI chat allowed', 'Every line explained and verified by you'] },
  { id: 'code-review', week: 12, kind: 'drill', title: 'Code review: 200 unfamiliar lines', deliverables: ['Bugs found and explained', 'Two readability changes', 'One test you would add first'] },
  { id: 'own-system', week: 12, kind: 'system design', title: 'Deep dive on your own project', deliverables: ['Architecture in five boxes', 'Two trade-offs you made and why', 'What you would change with a month more'] },
]
