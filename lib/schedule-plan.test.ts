import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAYS, MODULES, REQUIRED_MODULES, allDayExercises, dayExercises } from '@/data/curriculum'

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

test('Oct 7 – Oct 11 are ordered by interview priority', () => {
  const caps = (i: number) => DAYS[i].capstones
  assert.deepEqual(caps(5), ['valid-palindrome', 'longest-substring', 'valid-parentheses'])
  assert.deepEqual(caps(6), ['reverse-linked-list', 'max-depth', 'invert-tree'])
  assert.deepEqual(caps(7), ['level-order', 'number-of-islands', 'path-exists'])
  assert.deepEqual(caps(8), ['binary-search', 'merge-intervals', 'climbing-stairs', 'house-robber'])
  const cold = dayExercises(DAYS[9]).map((e) => e.id).sort()
  assert.deepEqual(cold, ['cold-longest-substring', 'cold-merge-intervals', 'cold-number-of-islands', 'cold-reverse-linked-list', 'cold-two-sum', 'cold-valid-parentheses'])
  assert.deepEqual(DAYS[9].mocks, ['mock-1', 'mock-2'])
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

test('every capstone still required has a cold version or is practiced before Oct 11', () => {
  const required = new Set(DAYS.flatMap((d) => dayExercises(d).map((e) => e.id)))
  for (const id of ['cap-valid-palindrome', 'cap-longest-substring', 'cap-valid-parentheses', 'cap-reverse-linked-list', 'cap-max-depth', 'cap-invert-tree', 'cap-level-order', 'cap-number-of-islands', 'cap-path-exists', 'cap-binary-search', 'cap-merge-intervals', 'cap-climbing-stairs', 'cap-house-robber'])
    assert.ok(required.has(id), id)
})

test('priority cut: Oct 7 – Oct 10 are sized to ~5–6 real hours, and every section has you write code', () => {
  for (const d of DAYS.slice(5, 9)) {
    const m = minutes(d)
    assert.ok(m >= 90 && m <= 150, `${d.date}: ${Math.round(m)} min`)
    for (const s of d.sections.filter((x) => !x.optional)) assert.ok(s.exercises.some((e) => e.kind === 'code'), `${s.id} still has you write code`)
  }
})

test('the Dictionary ladder: 30 reps, ground up to LeetCode', () => {
  const ladder = DAYS[2].sections.find((s) => s.id === 'o2-dict-ladder')!
  assert.equal(ladder.exercises.length, 30)
  assert.ok(ladder.exercises.filter((e) => e.title.includes('LeetCode')).length >= 6)
})
