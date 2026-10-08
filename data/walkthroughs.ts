import type { Exercise } from '@/lib/types'

/**
 * Video walkthroughs for the capstones, for learning a topic you have never
 * seen before. Every link was checked against YouTube's oEmbed API (real
 * title and channel) on Oct 8, 2026.
 *
 * Shown on the capstone itself and on the sections that lead into it, never
 * on cold reps or in interview mode: watch the explanation, pause when the
 * code starts, write it yourself, then finish the video to compare.
 */
export interface Walkthrough {
  problemId: string
  url: string
  channel: string
  /** e.g. "LC 125 · Valid Palindrome" */
  label: string
  /** Sections whose reps build toward this capstone. */
  leadIn: string[]
}

export const WALKTHROUGHS: Walkthrough[] = [
  { problemId: 'valid-palindrome', url: 'https://www.youtube.com/watch?v=jJXJ16kPFWg', channel: 'NeetCode', label: 'LC 125 · Valid Palindrome', leadIn: ['d3-two-pointers', 'd3-valid-palindrome'] },
  { problemId: 'longest-substring', url: 'https://www.youtube.com/watch?v=wiGpQwVHdE0', channel: 'NeetCode', label: 'LC 3 · Longest Substring Without Repeating Characters', leadIn: ['d4-windows', 'd4-window-state', 'd4-longest-substring'] },
  { problemId: 'valid-parentheses', url: 'https://www.youtube.com/watch?v=WTzjTskDFMg', channel: 'NeetCode', label: 'LC 20 · Valid Parentheses', leadIn: ['d4-stacks', 'd4-matching', 'd4-valid-parentheses'] },
  { problemId: 'reverse-linked-list', url: 'https://www.youtube.com/watch?v=G0_I-ZF0S38', channel: 'NeetCode', label: 'LC 206 · Reverse Linked List', leadIn: ['d05-listnode', 'd05-rewire', 'd05-cap-reverse'] },
  { problemId: 'max-depth', url: 'https://www.youtube.com/watch?v=hTM3phVI6YQ', channel: 'NeetCode', label: 'LC 104 · Maximum Depth of Binary Tree', leadIn: ['d06-recursion', 'd06-treenode', 'd06-dfs', 'd06-cap-depth'] },
  { problemId: 'invert-tree', url: 'https://www.youtube.com/watch?v=OnSn2XEQ4MY', channel: 'NeetCode', label: 'LC 226 · Invert Binary Tree', leadIn: ['d06-cap-invert'] },
  { problemId: 'level-order', url: 'https://www.youtube.com/watch?v=6ZnyEApgFYg', channel: 'NeetCode', label: 'LC 102 · Binary Tree Level Order Traversal', leadIn: ['o7-deque', 'o7-tree-bfs', 'o7-cap-level-order'] },
  { problemId: 'number-of-islands', url: 'https://www.youtube.com/watch?v=pV2kpPD66nE', channel: 'NeetCode', label: 'LC 200 · Number of Islands', leadIn: ['o7-grids', 'o7-neighbors', 'o7-grid-bfs', 'o7-islands'] },
  { problemId: 'path-exists', url: 'https://www.youtube.com/watch?v=t2ogKoewL5Y', channel: 'Rapid Syntax', label: 'LC 1971 · Find if Path Exists in Graph', leadIn: ['o8-adjacency', 'o8-dfs', 'o8-cap-path-exists'] },
  { problemId: 'binary-search', url: 'https://www.youtube.com/watch?v=s4DPM8ct1pI', channel: 'NeetCode', label: 'LC 704 · Binary Search', leadIn: ['d05-bs', 'd05-cap-search'] },
  { problemId: 'merge-intervals', url: 'https://www.youtube.com/watch?v=44H3cEC2fFM', channel: 'NeetCode', label: 'LC 56 · Merge Intervals', leadIn: ['d9-intervals'] },
  { problemId: 'climbing-stairs', url: 'https://www.youtube.com/watch?v=Y0lT9Fck7qI', channel: 'NeetCode', label: 'LC 70 · Climbing Stairs', leadIn: ['d10-bottom-up'] },
  { problemId: 'house-robber', url: 'https://www.youtube.com/watch?v=73r3KWiEvyk', channel: 'NeetCode', label: 'LC 198 · House Robber', leadIn: ['d10-rolling'] },
]

const BY_PROBLEM = new Map(WALKTHROUGHS.map((w) => [w.problemId, w]))
const BY_SECTION = new Map(WALKTHROUGHS.flatMap((w) => w.leadIn.map((s) => [s, w] as const)))

/** The walkthrough for a rep: its own capstone's, or the one its section leads into. Never for cold reps. */
export function walkthroughFor(e: Exercise, sectionId?: string): Walkthrough | undefined {
  if (e.id.startsWith('cold-')) return undefined
  return (e.problemId ? BY_PROBLEM.get(e.problemId) : undefined) ?? (sectionId ? BY_SECTION.get(sectionId.replace(/-extra$/, '')) : undefined)
}
