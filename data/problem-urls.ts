import URLS from '@/data/problem-urls.json'

/**
 * Where each problem is practised, keyed by LeetCode number: one table, read by the app
 * and by planning/gen.py. NeetCode first (solves sync to GitHub through NeetCode); a problem
 * with no NeetCode page keeps its LeetCode link and is labelled "LeetCode only".
 * NeetCode slugs differ from LeetCode's, so they are listed, never derived.
 */
export interface ProblemUrls {
  title: string
  leetcode: string
  neetcode: string | null
}

export const PROBLEM_URLS: Record<number, ProblemUrls> = Object.fromEntries(Object.entries(URLS as Record<string, ProblemUrls>).map(([lc, u]) => [Number(lc), u]))

/** The link to practise on: NeetCode when it has the problem, otherwise LeetCode. */
export function practiceUrl(lc: number): string | undefined {
  const u = PROBLEM_URLS[lc]
  return u ? (u.neetcode ?? u.leetcode) : undefined
}

export function leetcodeUrl(lc: number): string | undefined {
  return PROBLEM_URLS[lc]?.leetcode
}

export function isLeetcodeOnly(lc: number): boolean {
  return Boolean(PROBLEM_URLS[lc]) && PROBLEM_URLS[lc].neetcode === null
}

/** "Practice on NeetCode", or "Practice on LeetCode" for the problems NeetCode does not have. */
export function practiceSite(lc: number): 'NeetCode' | 'LeetCode' {
  return isLeetcodeOnly(lc) ? 'LeetCode' : 'NeetCode'
}
