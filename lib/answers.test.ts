import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firstDifference, outputMatches } from '@/lib/answers'

test('output matching is strict on content, forgiving on spacing and quotes', () => {
  assert.ok(outputMatches('0 8\n1 3\n', '0 8\n1 3'))
  assert.ok(outputMatches('{4:0, 8:1}', '{4: 0, 8: 1}'))
  assert.ok(outputMatches('["a", "b"]', "['a', 'b']"))
  assert.ok(!outputMatches('{4: 1}', '{4: 0}'))
  assert.ok(!outputMatches('1 2', '12'))
  assert.ok(!outputMatches('0 8', '0 8\n1 3'))
})

test('first difference points at the line', () => {
  assert.deepEqual(firstDifference('a\nb', 'a\nc'), { line: 2, given: 'b', expected: 'c' })
  assert.equal(firstDifference('a', 'a'), null)
})
