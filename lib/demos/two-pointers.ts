import { parseInts, type DemoDefinition, type DemoStep } from '@/lib/demos/types'

/**
 * Two pointers on a sorted list (REPS_2_1_SPEC.md §14): the learner sees left and
 * right close in, which values are compared, the decision, and the region that
 * is discarded, and why discarding it is safe.
 */

export interface TwoPointerInput {
  values: number[]
  target: number
}

export interface TwoPointerState {
  values: number[]
  left: number
  right: number
  /** Indexes ruled out: they cannot be part of any pair. */
  discarded: number[]
  /** The comparison just made, if any. */
  compare: 'less' | 'more' | 'equal' | null
  found: [number, number] | null
  done: boolean
}

const CODE = [
  'def pair_with_sum(nums, target):',
  '    left, right = 0, len(nums) - 1',
  '    while left < right:',
  '        total = nums[left] + nums[right]',
  '        if total == target:',
  '            return [left, right]',
  '        if total < target:',
  '            left += 1    # nums[left] is too small for every partner',
  '        else:',
  '            right -= 1   # nums[right] is too big for every partner',
  '    return []',
]

export function runTwoPointers(input: TwoPointerInput): DemoStep<TwoPointerState>[] {
  const values = [...input.values].sort((a, b) => a - b)
  const target = input.target
  const steps: DemoStep<TwoPointerState>[] = []
  let left = 0
  let right = values.length - 1
  const discarded: number[] = []
  const snap = (over: Partial<TwoPointerState> = {}): TwoPointerState => ({ values, left, right, discarded: [...discarded], compare: null, found: null, done: false, ...over })
  steps.push({ state: snap(), lines: [2], label: 'START', why: 'One index at each end of the sorted list. Every possible pair lies between them.', vars: { left, right, target } })
  while (left < right) {
    const total = values[left] + values[right]
    const cmp = total === target ? 'equal' : total < target ? 'less' : 'more'
    steps.push({
      state: snap({ compare: cmp }),
      lines: [4],
      label: 'COMPARE',
      why: `nums[left] + nums[right] = ${values[left]} + ${values[right]} = ${total}, against target ${target}.`,
      vars: { left, right, total, target },
      predict:
        cmp === 'equal'
          ? undefined
          : { question: `${total} is ${cmp === 'less' ? 'below' : 'above'} ${target}. Which pointer moves?`, choices: ['left moves right', 'right moves left'], answer: cmp === 'less' ? 0 : 1 },
    })
    if (cmp === 'equal') {
      steps.push({ state: snap({ compare: 'equal', found: [left, right], done: true }), lines: [5, 6], label: 'FOUND', why: `${values[left]} + ${values[right]} is exactly ${target}: return their indexes.`, vars: { left, right, total, target } })
      return steps
    }
    if (cmp === 'less') {
      discarded.push(left)
      left += 1
      steps.push({
        state: snap({ compare: 'less' }),
        lines: [7, 8],
        label: 'MOVE LEFT',
        why: `Even with the biggest value still in play (${values[right]}), ${values[left - 1]} only reaches ${total}. It is too small for every partner, so it can never be in the answer: drop it.`,
        vars: { left, right, total, target },
      })
    } else {
      discarded.push(right)
      right -= 1
      steps.push({
        state: snap({ compare: 'more' }),
        lines: [9, 10],
        label: 'MOVE RIGHT',
        why: `Even with the smallest value still in play (${values[left]}), ${values[right + 1]} makes ${total}. It is too big for every partner, so it can never be in the answer: drop it.`,
        vars: { left, right, total, target },
      })
    }
  }
  steps.push({ state: snap({ done: true }), lines: [3, 11], label: 'NO PAIR', why: 'The pointers met: every value was ruled out, so no pair adds up to the target.', vars: { left, right, target } })
  return steps
}

export const twoPointersDemo: DemoDefinition<TwoPointerInput, TwoPointerState> = {
  id: 'two-pointers',
  title: 'Two pointers: why moving one is safe',
  concept: 'two-pointers',
  summary: 'Watch left and right close in on a sorted list, and the values they rule out.',
  rule: 'If the sum is too small, the left value is too small for every partner; if too big, the right value is too big for every partner. Either way one value is ruled out, safely.',
  code: CODE,
  defaultInput: { values: [1, 3, 4, 6, 8, 11], target: 10 },
  presets: [
    { label: 'Found in the middle', input: { values: [1, 3, 4, 6, 8, 11], target: 10 } },
    { label: 'No pair', input: { values: [2, 4, 6, 8], target: 3 } },
    { label: 'Both ends at once', input: { values: [1, 2, 3, 9], target: 10 } },
  ],
  inputHint: '1 3 4 6 8 11, target 10',
  formatInput: (i) => `${i.values.join(' ')}, target ${i.target}`,
  parseInput: (text) => {
    const m = /^(.*?)(?:,|;|\s)\s*target\s*(-?\d+)\s*$/i.exec(text.trim())
    if (!m) return { error: 'Write the numbers, then "target N", e.g. 1 3 4 6 8 11, target 10.' }
    const parsed = parseInts(m[1], { min: 2, max: 12 })
    if ('error' in parsed) return parsed
    return { input: { values: parsed.values, target: Number(m[2]) } }
  },
  run: runTwoPointers,
}
