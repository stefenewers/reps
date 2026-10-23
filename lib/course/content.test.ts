import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { GATES } from '@/data/course/gates'
import { LABS, LESSONS, LESSON_BY_ID, WORKED_EXAMPLES } from '@/data/course/lessons'
import { UNITS } from '@/data/course/units'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { COURSE_SECTIONS } from '@/data/exercises/course'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { patternLeaks } from '@/data/pattern-words'
import { wordingProblems } from '@/lib/wording'

const COURSE_REPS = COURSE_SECTIONS.flatMap((s) => s.exercises)

test('every unit references sections that exist, and lessons and worked examples that exist', () => {
  for (const u of UNITS) {
    for (const id of [...u.sections, ...(u.optional ?? [])]) assert.ok(SECTION_BY_ID[id], `${u.id}: section ${id}`)
    for (const id of u.lessonIds) assert.ok(LESSON_BY_ID[id] || CONCEPT_BY_ID[id], `${u.id}: lesson ${id}`)
    for (const id of u.workedExampleIds) assert.ok(WORKED_EXAMPLES.some((w) => w.id === id), `${u.id}: worked example ${id}`)
    for (const id of u.labIds) assert.ok(LABS.some((l) => l.id === id), `${u.id}: lab ${id}`)
  }
})

test('every gate has at least two real variants per clean pass it needs, each a cold checkpoint', () => {
  for (const g of GATES) {
    const real = g.pool.filter((id) => EXERCISE_BY_ID[id])
    assert.deepEqual(real, g.pool, `${g.id}: missing variants`)
    assert.ok(real.length >= g.need, `${g.id}: needs ${g.need}, has ${real.length}`)
    for (const id of real) {
      const e = EXERCISE_BY_ID[id]
      assert.ok(e.gate || e.repType === 'cold', `${id}: a gate variant is cold`)
      if (e.gate) assert.ok(!e.hints?.length && !e.note, `${id}: a checkpoint carries no hints or notes`)
    }
  }
})

test('checkpoints and Week 13 transfer reps never name the technique', () => {
  for (const e of COURSE_REPS.filter((e) => e.gate || e.transfer)) assert.deepEqual(patternLeaks(`${e.title}\n${e.prompt}`, e.skills), [], `${e.id}: names the technique`)
})

test('labs: a build and a change request each, both lab parts that never count as reps', () => {
  for (const l of LABS) {
    for (const id of [l.buildExerciseId, l.changeRequest.exerciseId]) {
      assert.ok(EXERCISE_BY_ID[id], `${l.id}: ${id}`)
      assert.equal(EXERCISE_BY_ID[id].lab, true, `${id} is a lab part`)
    }
    assert.ok(l.designQuestions.length >= 5 && l.requirements.length >= 4 && l.review.length >= 3, l.id)
  }
  assert.ok(LABS.some((l) => l.aiFde), 'the Applied AI / FDE lane appears through labs')
})

test('worked examples rebuild through a real rep; every course rep reads in plain English', () => {
  for (const w of WORKED_EXAMPLES) assert.ok(EXERCISE_BY_ID[w.reconstructionExerciseId], `${w.id}: ${w.reconstructionExerciseId}`)
  for (const l of LESSONS) assert.ok(l.sections.length >= 2 && l.mistakes.length >= 2, l.id)
  for (const e of COURSE_REPS) assert.deepEqual(wordingProblems(e), [], e.id)
})

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import Markdown from '@/components/markdown'

test('Markdown renders numbered lists and tables (the Solve Map steps, variable traces and lab specs)', () => {
  const html = renderToStaticMarkup(createElement(Markdown, { text: '1. Contract\n2. Example\n\n| step | total |\n|---|---|\n| 1 | 5 |\n| 2 | 9 |' }))
  assert.match(html, /<ol><li>Contract<\/li><li>Example<\/li><\/ol>/)
  assert.match(html, /<table><thead><tr><th>step<\/th><th>total<\/th><\/tr><\/thead><tbody><tr><td>1<\/td><td>5<\/td><\/tr>/)
})
