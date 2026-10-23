import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runBinarySearch({ values: input, target }: NumericInput) {
  const values = [...input].sort((a, b) => a - b),
    discarded: number[] = []
  const state: VisualState = { kind: 'array', values, pointers: { lo: 0, hi: values.length - 1 } }
  const { steps, emit } = recorder(state, { target })
  let lo = 0,
    hi = values.length - 1
  emit('START', 'If the answer exists, it is still inside [lo, hi].', [1])
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    emit(
      'COMPARE',
      `Compare the middle value ${values[mid]} with ${target}.`,
      [3, 4],
      { pointers: { lo, mid, hi } },
      { lo, mid, hi },
      nextPrediction('Can we discard the middle value after a mismatch?', 'Yes, and all values on the impossible side', 'No, keep mid in the next region')
    )
    if (values[mid] === target) {
      emit('FOUND', 'The middle value is the target.', [5], { result: [mid] })
      return steps
    }
    if (values[mid] < target) {
      for (let i = lo; i <= mid; i++) discarded.push(i)
      lo = mid + 1
    } else {
      for (let i = mid; i <= hi; i++) discarded.push(i)
      hi = mid - 1
    }
    emit(
      'DISCARD',
      'Sorted order proves the discarded region cannot contain the answer.',
      [6, 7, 8, 9],
      { pointers: { lo, hi }, discarded: [...discarded] },
      { lo, hi }
    )
  }
  emit('NOT FOUND', 'The active region is empty: the target is absent.', [10], { result: [-1] })
  return steps
}
export const binarySearchDemo = numericDemo({
  id: 'binary-search',
  title: 'Binary search: preserve the search region',
  concept: 'binary-search',
  summary: 'Compare at mid and eliminate only an impossible region.',
  rule: 'If the answer exists, it is still inside [lo, hi]. Every mismatch makes that region strictly smaller.',
  code: [
    'lo, hi = 0, len(values) - 1',
    'while lo <= hi:',
    '    mid = (lo + hi) // 2',
    '    if values[mid] == target:',
    '        return mid',
    '    if values[mid] < target:',
    '        lo = mid + 1',
    '    else:',
    '        hi = mid - 1',
    'return -1'
  ],
  defaultInput: { values: [1, 3, 5, 7, 9, 11, 13], target: 9 },
  presets: [
    { label: 'Absent', input: { values: [2, 4, 6], target: 5 } },
    { label: 'Only value', input: { values: [7], target: 7 } }
  ],
  run: runBinarySearch
})
