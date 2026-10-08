import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WALKTHROUGHS, walkthroughFor } from '@/data/walkthroughs'
import { DAYS, EXERCISE_BY_ID, MODULES } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'

test('every capstone left on the calendar before Oct 11 has a walkthrough', () => {
  const caps = DAYS.filter((d) => d.date >= '2026-10-07' && d.date <= '2026-10-10').flatMap((d) => d.capstones)
  for (const c of caps) assert.ok(WALKTHROUGHS.some((w) => w.problemId === c), c)
})

test('walkthroughs point at real problems and real sections, as YouTube links', () => {
  const sections = new Set(MODULES.flatMap((m) => m.sections.map((s) => s.id)))
  for (const w of WALKTHROUGHS) {
    assert.ok(PROBLEM_BY_ID[w.problemId], w.problemId)
    assert.match(w.url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/)
    for (const s of w.leadIn) assert.ok(sections.has(s), `${w.problemId}: ${s}`)
  }
})

test('lead-in reps get the video; cold reps never do', () => {
  assert.equal(walkthroughFor(EXERCISE_BY_ID['cap-longest-substring'])?.problemId, 'longest-substring')
  assert.equal(walkthroughFor(EXERCISE_BY_ID['d4-win-trace-slices'], 'd4-windows')?.problemId, 'longest-substring')
  assert.equal(walkthroughFor(EXERCISE_BY_ID['cold-longest-substring']), undefined)
})
