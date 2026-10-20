import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROBLEM_URLS, isLeetcodeOnly, practiceUrl } from '@/data/problem-urls'
import { PROBLEMS } from '@/data/problems'
import { PLAN_DAYS } from '@/data/curriculum'
import { PLAN_WHEN_AHEAD } from '@/data/schedule-90'
import { TARGETS } from '@/data/problem-bridges'

const NEETCODE = /^https:\/\/neetcode\.io\/problems\/[a-z0-9-]+$/
const LEETCODE = /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/

test('every problem in the app has a practice link in the one table', () => {
  const lcs = new Set([...PROBLEMS.map((p) => p.number), ...PLAN_DAYS.flatMap((d) => (d.leetcode ?? []).map((x) => x.lc)), ...PLAN_WHEN_AHEAD.map((x) => x.lc), ...TARGETS.map((t) => t.lc)])
  for (const lc of lcs) {
    assert.ok(PROBLEM_URLS[lc], `LC ${lc} has no entry in data/problem-urls.json`)
    assert.ok(practiceUrl(lc), `LC ${lc} has no practice URL`)
  }
})

test('NeetCode and LeetCode URLs are well formed; only LeetCode-only problems link to LeetCode', () => {
  for (const [lc, u] of Object.entries(PROBLEM_URLS)) {
    assert.match(u.leetcode, LEETCODE, `LC ${lc}`)
    if (u.neetcode !== null) assert.match(u.neetcode, NEETCODE, `LC ${lc}`)
  }
  assert.equal(Object.keys(PROBLEM_URLS).length, 74)
  assert.deepEqual(Object.keys(PROBLEM_URLS).map(Number).filter(isLeetcodeOnly), [1971])
  assert.equal(practiceUrl(1), 'https://neetcode.io/problems/two-integer-sum')
  assert.equal(practiceUrl(1971), 'https://leetcode.com/problems/find-if-path-exists-in-graph/')
})

test('the generated plan and the problem list use the table: NeetCode where it exists', () => {
  for (const x of [...PLAN_DAYS.flatMap((d) => d.leetcode ?? []), ...PLAN_WHEN_AHEAD]) assert.equal(x.url, practiceUrl(x.lc), `LC ${x.lc}: rerun planning/gen.py`)
  for (const p of PROBLEMS) {
    assert.equal(p.practice, practiceUrl(p.number), p.id)
    assert.equal(p.leetcode, PROBLEM_URLS[p.number].leetcode, p.id)
  }
})
