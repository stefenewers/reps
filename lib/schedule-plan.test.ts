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

test('Oct 3 – Oct 10 are aggressive but realistic: about 4.75 to 5.75 planned hours each', () => {
  for (const d of DAYS.slice(1, 9)) {
    const m = minutes(d)
    // Oct 3 also carries the mandatory Dictionary check (~25 min), added after the re-plan.
    const max = d.date === '2026-10-03' ? 345 + checkMinutes : 345
    assert.ok(m >= 285 && m <= max, `${d.date}: ${Math.round(m)} min`)
  }
})

const checkMinutes = MODULES[0].sections.filter((s) => s.gate).reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.minutes, 0), 0)

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
