import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runSlidingWindow({ values, target }: NumericInput) {
  const state: VisualState = { kind: 'array', values: [...values], pointers: { left: 0, right: -1 } }
  const { steps, emit } = recorder(state, { total: 0, best: 0, limit: target })
  let left = 0,
    total = 0,
    best = 0
  emit('START', 'With nonnegative values, removing the left value can only reduce the total.', [1])
  values.forEach((v, right) => {
    total += v
    emit(
      'ENTER',
      `Add ${v} to the remembered total.`,
      [3, 4],
      { pointers: { left, right }, active: Array.from({ length: right - left + 1 }, (_, i) => left + i) },
      { total },
      nextPrediction('When the total exceeds the limit, what must happen?', 'Remove values from the left until valid', 'Measure the invalid window')
    )
    if (total > target) emit('INVALID', `${total} exceeds ${target}; this window cannot be measured yet.`, [5])
    while (total > target && left <= right) {
      const outgoing = values[left++]
      total -= outgoing
      emit(
        'SHRINK',
        `Remove outgoing value ${outgoing}; update both the total and left boundary.`,
        [6, 7],
        { pointers: { left, right }, active: Array.from({ length: Math.max(0, right - left + 1) }, (_, i) => left + i) },
        { total }
      )
    }
    emit('VALID', `The total ${total} is within the limit.`, [5])
    best = Math.max(best, right - left + 1)
    emit('MEASURE', 'Only a valid window may improve the longest length.', [8], { result: [best] }, { best })
  })
  return steps
}
export const slidingWindowDemo = numericDemo(
  {
    id: 'sliding-window',
    title: 'Sliding window: enter, repair, measure',
    concept: 'sliding-window',
    summary: 'Keep the longest nonnegative run whose sum is within a limit.',
    rule: 'The remembered total equals the sum inside the boundaries. Shrink while invalid; measure only after repair.',
    code: [
      'left = total = best = 0',
      'for right, value in enumerate(values):',
      '    # enter',
      '    total += value',
      '    while total > limit:',
      '        total -= values[left]',
      '        left += 1',
      '    best = max(best, right - left + 1)'
    ],
    defaultInput: { values: [2, 1, 4, 1, 2], target: 5 },
    presets: [
      { label: 'Needs several shrinks', input: { values: [1, 2, 6, 1], target: 3 } },
      { label: 'Zeros stay valid', input: { values: [0, 0, 2], target: 0 } }
    ],
    run: runSlidingWindow
  },
  (i) => (i.target < 0 || i.values.some((v) => v < 0) ? 'Use nonnegative values and a nonnegative limit for this window rule.' : undefined)
)
