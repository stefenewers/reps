import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAYS, EXERCISE_BY_ID, MODULES, allDayExercises, dayExercises } from '@/data/curriculum'
import { engagementOf } from '@/lib/curriculum-audit'

/** The calendar re-plan of Oct 2 evening: realistic, aggressive, in the original order. */

const minutes = (d: (typeof DAYS)[number]) => dayExercises(d).reduce((n, e) => n + e.minutes, 0)

test('Oct 2 is exactly what was completed: Python recall and Loops & range', () => {
  const oct2 = DAYS[0]
  assert.equal(oct2.date, '2026-10-02')
  assert.deepEqual(
    oct2.sections.filter((s) => !s.optional).map((s) => s.id),
    ['o2-python-recall', 'o2-loops'],
  )
  assert.equal(dayExercises(oct2).length, 20)
})

test('practice resumes Oct 3 at enumerate', () => {
  assert.equal(DAYS[1].date, '2026-10-03')
  assert.equal(DAYS[1].sections[0].id, 'o2-enumerate')
  assert.equal(dayExercises(DAYS[1])[0].id, MODULES[0].sections.find((s) => s.id === 'o2-enumerate')!.exercises[0].id)
})

test('within every section, required reps keep their authored order', () => {
  const order = new Map(MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises.map((e, i) => [e.id, i] as const))))
  for (const d of DAYS)
    for (const s of d.sections.filter((x) => !x.optional)) {
      const idx = s.exercises.map((e) => order.get(e.id)!)
      assert.deepEqual(idx, [...idx].sort((a, b) => a - b), s.id)
    }
})

const DICT_DAY = ['o2-dictionaries', 'o2-dict-revision', 'o2-get', 'o2-iter-dicts', 'o2-frequency', 'o2-dict-mastery']

test('Oct 3 is closed as completed: a dictionaries day ending with the from-scratch check', () => {
  const ids = DAYS[1].sections.filter((s) => !s.optional).map((s) => s.id)
  assert.deepEqual(ids.slice(ids.indexOf('o2-dictionaries')), DICT_DAY)
  for (const id of ['o2-dict-revision', 'o2-dict-mastery']) assert.ok(DAYS[1].sections.find((s) => s.id === id)?.gate, `${id} is a mastery check`)
})

test('Oct 4 was the Dictionary ladder; the dictionary chapter is closed without a lock', () => {
  assert.deepEqual(DAYS[2].sections.filter((s) => !s.optional).map((s) => s.id), ['o2-dict-ladder'])
  assert.ok(!DAYS[2].sections.find((s) => s.id === 'o2-dict-ladder')?.gate)
  const onCalendar = new Set(DAYS.flatMap((d) => d.sections.filter((s) => !s.optional).map((s) => s.id)))
  for (const id of ['o2-valid-anagram', 'o2-index-maps', 'o2-complements', 'o2-two-sum']) assert.ok(!onCalendar.has(id), `${id} is off the calendar`)
  assert.ok(dayExercises(DAYS[9]).some((e) => e.id === 'cold-two-sum'), 'Two Sum returns cold on interview day')
})

test('Oct 5 closed with the Slicing done; Oct 6 was an off day', () => {
  assert.deepEqual(DAYS[3].sections.filter((s) => !s.optional).map((s) => s.id), ['d3-slicing'])
  assert.equal(DAYS[4].sections.length, 0)
})

test('Oct 8 – Oct 11 follow the remaining topics by interview priority', () => {
  const caps = (i: number) => DAYS[i].capstones
  assert.deepEqual(caps(6), ['valid-palindrome', 'max-depth', 'invert-tree'])
  assert.deepEqual(caps(7), ['level-order', 'number-of-islands', 'path-exists'])
  assert.deepEqual(caps(8), ['longest-substring', 'valid-parentheses', 'binary-search', 'merge-intervals', 'climbing-stairs'])
  const cold = dayExercises(DAYS[9]).filter((e) => e.id.startsWith('cold-')).map((e) => e.id).sort()
  assert.deepEqual(cold, ['cold-longest-substring', 'cold-merge-intervals', 'cold-number-of-islands', 'cold-two-sum', 'cold-valid-parentheses'])
  assert.deepEqual(DAYS[9].mocks, ['mock-1', 'mock-2'])
  // Oct 11 keeps its whole shape: speed → debug → edges → cold → mixed.
  assert.deepEqual(DAYS[9].sections.filter((s) => !s.optional).map((s) => s.id), ['o11-speed', 'o11-debug', 'o11-edges', 'o11-cold', 'o11-mixed'])
})

test('from Oct 8, capstones are followed by an interviewer follow-up that changes one constraint', () => {
  const FOLLOW_UPS: Record<string, string> = {
    'cap-valid-palindrome': 'd3-vp-one-deletion',
    'cap-max-depth': 'd06-fu-min-depth',
    'cap-level-order': 'o7-fu-zigzag',
    'cap-number-of-islands': 'o7-i-max-area',
    'cap-path-exists': 'o8-fu-fewest-hops',
    'cap-binary-search': 'd05-fu-insert-position',
    'cap-merge-intervals': 'd9-fu-touching-apart',
    'cap-climbing-stairs': 'd10-fu-broken-steps',
  }
  const order = DAYS.flatMap((d) => dayExercises(d).map((e) => e.id))
  for (const [cap, fu] of Object.entries(FOLLOW_UPS)) {
    assert.ok(order.indexOf(cap) >= 0 && order.indexOf(fu) > order.indexOf(cap), `${fu} comes after ${cap}`)
  }
  // The new ones start from the capstone's working solution.
  for (const id of ['d06-fu-min-depth', 'o7-fu-zigzag', 'o8-fu-fewest-hops', 'd05-fu-insert-position', 'd9-fu-touching-apart', 'd10-fu-broken-steps'])
    assert.equal(EXERCISE_BY_ID[id].style, 'modify', id)
})

test('the unlabeled set never names its technique', () => {
  const set = DAYS[8].sections.find((s) => s.id === 'o11-name-it')!
  assert.equal(set.exercises.length, 4)
  for (const e of set.exercises)
    assert.doesNotMatch(`${e.title} ${e.prompt}`, /\b(set|dict|hash|BFS|DFS|graph|window|binary search|two pointers?|stack|heap|queue)\b/i, e.id)
})


const checkMinutes = MODULES[0].sections.filter((s) => s.id === 'o2-dict-revision').reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.minutes, 0), 0)

test('the Dictionary check sits between Dictionaries and .get(), on Oct 3, and is required', () => {
  const ids = DAYS[1].sections.filter((s) => !s.optional).map((s) => s.id)
  assert.equal(ids.indexOf('o2-dict-revision'), ids.indexOf('o2-dictionaries') + 1)
  assert.equal(ids.indexOf('o2-get'), ids.indexOf('o2-dict-revision') + 1)
  assert.ok(checkMinutes > 15 && checkMinutes <= 30, `${checkMinutes} min`)
})

test('Oct 11 stays interview execution, lighter, with both mocks', () => {
  const oct11 = DAYS[9]
  assert.equal(oct11.date, '2026-10-11')
  assert.ok(minutes(oct11) <= 200, `${Math.round(minutes(oct11))} min plus mocks`)
  assert.deepEqual(oct11.mocks, ['mock-1', 'mock-2'])
})

test('nothing is lost: every authored rep is on the calendar exactly once', () => {
  const calendar = DAYS.flatMap((d) => allDayExercises(d).map((e) => e.id))
  const authored = MODULES.flatMap((m) => allDayExercises(m).map((e) => e.id))
  assert.equal(new Set(calendar).size, calendar.length)
  assert.deepEqual([...calendar].sort(), [...authored].sort())
})

test('every capstone on the calendar from Oct 8 has its walkthrough-backed practice before Oct 11', () => {
  const required = new Set(DAYS.flatMap((d) => dayExercises(d).map((e) => e.id)))
  for (const id of ['cap-valid-palindrome', 'cap-max-depth', 'cap-invert-tree', 'cap-level-order', 'cap-number-of-islands', 'cap-path-exists', 'cap-longest-substring', 'cap-valid-parentheses', 'cap-binary-search', 'cap-merge-intervals', 'cap-climbing-stairs'])
    assert.ok(required.has(id), id)
})

test('Oct 8 – Oct 11 stay code-first on the calendar itself (≥ 65% active minutes a day)', () => {
  for (const d of DAYS.slice(6, 10)) {
    const ex = dayExercises(d)
    const total = ex.reduce((n, e) => n + e.minutes, 0)
    const active = ex.filter((e) => engagementOf(e) === 'active').reduce((n, e) => n + e.minutes, 0)
    assert.ok(active / total >= 0.65, `${d.date}: ${Math.round((100 * active) / total)}% active`)
    assert.ok(total <= 180, `${d.date}: ${Math.round(total)} min`)
  }
})

test('the Dictionary ladder: 30 reps, ground up to LeetCode', () => {
  const ladder = DAYS[2].sections.find((s) => s.id === 'o2-dict-ladder')!
  assert.equal(ladder.exercises.length, 30)
  assert.ok(ladder.exercises.filter((e) => e.title.includes('LeetCode')).length >= 6)
})
