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

test('required work keeps the original order across the calendar', () => {
  const calendar = DAYS.flatMap((d) => dayExercises(d).map((e) => e.id))
  const modules = REQUIRED_MODULES.flatMap((m) => dayExercises(m).map((e) => e.id))
  assert.deepEqual(calendar, modules)
})

const DICT_DAY = ['o2-dictionaries', 'o2-dict-revision', 'o2-get', 'o2-iter-dicts', 'o2-frequency', 'o2-dict-mastery', 'o2-dict-ladder']

test('Oct 3 ends as a dictionaries-only day, closed by the end-of-day mastery check', () => {
  const ids = DAYS[1].sections.filter((s) => !s.optional).map((s) => s.id)
  const from = ids.indexOf('o2-dictionaries')
  assert.deepEqual(ids.slice(from), DICT_DAY)
  for (const id of ['o2-dict-revision', 'o2-dict-mastery', 'o2-dict-ladder']) assert.ok(DAYS[1].sections.find((s) => s.id === id)?.gate, `${id} is a mastery check`)
})

test('everything else planned for Oct 3 moved to the front of Oct 4, in order', () => {
  const ids = DAYS[2].sections.filter((s) => !s.optional).map((s) => s.id)
  assert.deepEqual(ids.slice(0, 7), ['o2-valid-anagram', 'o2-index-maps', 'o2-complements', 'o2-two-sum', 'd3-strings', 'd3-slicing', 'd3-methods'])
})

test('Oct 4 – Oct 10 absorb it evenly: about 5.25 to 6 planned hours each', () => {
  for (const d of DAYS.slice(2, 9)) {
    const m = minutes(d)
    assert.ok(m >= 300 && m <= 365, `${d.date}: ${Math.round(m)} min`)
  }
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

test('capstones are always required, never extra', () => {
  for (const d of DAYS)
    for (const s of d.sections.filter((x) => x.optional)) for (const e of s.exercises) assert.notEqual(e.repType, 'capstone', `${e.id} on ${d.date}`)
  const required = new Set(DAYS.flatMap((d) => dayExercises(d).map((e) => e.id)))
  for (const m of MODULES) for (const e of allDayExercises(m)) if (e.repType === 'capstone') assert.ok(required.has(e.id), e.id)
})

test('the Dictionary ladder closes Oct 3: 30 reps, ground up to LeetCode', () => {
  const ladder = DAYS[1].sections.find((s) => s.id === 'o2-dict-ladder')!
  assert.equal(ladder.exercises.length, 30)
  assert.equal(DAYS[1].sections.filter((s) => !s.optional).at(-1)?.id, 'o2-dict-ladder')
  assert.ok(ladder.exercises.filter((e) => e.title.includes('LeetCode')).length >= 6)
})
