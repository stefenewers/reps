import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAY_BY_DATE, PLAN_DAYS } from '@/data/curriculum'
import { blockAt, blocksFor, clock12, minutesRemaining } from '@/data/program-90day'

test('a plan day lays out as blocks in clock order, sized by the plan', () => {
  const d = DAY_BY_DATE['2026-11-10'] // a Tuesday in the full phase
  const blocks = blocksFor(d)
  assert.deepEqual(blocks.map((b) => b.id), ['A', 'B', 'C', 'D'])
  assert.equal(blocks[0].start, '09:00')
  for (let i = 1; i < blocks.length; i++) assert.ok(blocks[i].start >= blocks[i - 1].end, 'blocks never overlap')
  assert.equal(blocks.find((b) => b.id === 'C')!.title, 'Mock')
  const resolves = (d.leetcode ?? []).filter((x) => x.type !== 'new').length
  assert.equal(blocks.find((b) => b.id === 'B')!.minutes, resolves * 15)
  // A redo adds fifteen minutes to block B.
  assert.equal(blocksFor(d, resolves + 1).find((b) => b.id === 'B')!.minutes, (resolves + 1) * 15)
})

test('week 1 and Saturdays have no afternoon track; off days and pre-plan days have no blocks', () => {
  assert.ok(!blocksFor(DAY_BY_DATE['2026-10-12']).some((b) => b.id === 'C'), 'soft start')
  assert.ok(!blocksFor(DAY_BY_DATE['2026-11-14']).some((b) => b.id === 'C'), 'Saturday')
  assert.deepEqual(blocksFor(DAY_BY_DATE['2026-10-18']), [], 'off day')
  assert.deepEqual(blocksFor(DAY_BY_DATE['2026-10-05']), [], 'before the plan')
})

test('the afternoon track rotates by weekday', () => {
  const week = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'].map((d) => blocksFor(DAY_BY_DATE[d]).find((b) => b.id === 'C')!.title)
  assert.deepEqual(week, ['Design', 'Mock', 'Stories', 'Applications', 'Mock or timed set'])
})

test('next up and minutes remaining follow the clock', () => {
  const blocks = blocksFor(DAY_BY_DATE['2026-11-10'])
  const a = blocks[0]
  const startA = Number(a.start.slice(0, 2)) * 60 + Number(a.start.slice(3))
  assert.equal(blockAt(blocks, startA - 30).next?.id, 'A')
  assert.equal(blockAt(blocks, startA + 10).current?.id, 'A')
  assert.equal(blockAt(blocks, 23 * 60).current, null)
  const total = blocks.reduce((n, b) => n + b.minutes, 0)
  assert.equal(minutesRemaining(blocks, 0), total)
  assert.equal(minutesRemaining(blocks, startA + 10), total - 10)
  assert.equal(minutesRemaining(blocks, 23 * 60), 0)
  assert.equal(clock12('13:05'), '1:05 pm')
  assert.equal(clock12('09:00'), '9:00 am')
})

test('no plan day asks for more than five hours of blocks, and most stay under four and a half', () => {
  const totals = PLAN_DAYS.map((d) => blocksFor(d).reduce((n, b) => n + b.minutes, 0))
  // The heaviest days run a few minutes long because a ladder section is never cut mid-rep.
  for (const [i, t] of totals.entries()) assert.ok(t <= 295, `${PLAN_DAYS[i].date}: ${t} min`)
  assert.ok(totals.filter((t) => t > 270).length <= 12, `${totals.filter((t) => t > 270).length} days over 4.5 h`)
})
