import { numericDemo, recorder, nextPrediction, treeNodes, treeEdges, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runHeap({ values, target: k }: NumericInput) {
  const heap: number[] = []
  const state: VisualState = { kind: 'heap', values: [], nodes: [], edges: [] }
  const { steps, emit } = recorder(state, { k })
  const snap = () => ({ values: [...heap], nodes: treeNodes(heap), edges: treeEdges(heap.length) })
  emit('START', 'Keep a min-heap of at most k values. Its root is the smallest retained candidate.', [1])
  for (const value of values) {
    heap.push(value)
    emit(
      'PUSH',
      `Append ${value} as the next leaf; restore heap order by bubbling upward.`,
      [3],
      snap(),
      { incoming: value },
      nextPrediction('Which heap value is discarded when more than k are kept?', 'The minimum at the root', 'The newest value, regardless of size')
    )
    let i = heap.length - 1
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (heap[p] <= heap[i]) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
      emit('BUBBLE UP', 'Swap with the parent while the child is smaller.', [4], snap())
    }
    if (heap.length > k) {
      const removed = heap[0],
        last = heap.pop()!
      heap[0] = last
      emit('POP', `Remove the minimum ${removed}, replace the root with the last leaf.`, [5, 6], snap(), { removed })
      i = 0
      while (true) {
        let smaller = i
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && heap[c] < heap[smaller]) smaller = c
        if (smaller === i) break
        ;[heap[i], heap[smaller]] = [heap[smaller], heap[i]]
        i = smaller
        emit('BUBBLE DOWN', 'Swap with the smaller child until the replacement fits.', [7], snap())
      }
    }
    emit('TOP K', 'The heap now contains the largest k values seen so far, or all values if fewer were seen.', [8], snap())
  }
  emit('DONE', 'The heap is not fully sorted; its root is the next most important value.', [9], { ...snap(), result: [...heap].sort((a, b) => b - a) })
  return steps
}
export const heapDemo = numericDemo(
  {
    id: 'heaps',
    title: 'Heaps: tree shape, backing array and top k',
    concept: 'heaps',
    summary: 'Watch insertions bubble up and root replacements bubble down.',
    rule: 'Every parent is no larger than its children. Keeping only k candidates makes the root the smallest of the best k seen.',
    code: [
      'heap = []',
      'for value in values:',
      '    heap.append(value)',
      '    bubble_up(heap)',
      '    if len(heap) > k:',
      '        replace_root_with_last_leaf(heap)',
      '        bubble_down(heap)',
      '    # heap holds the largest k seen so far',
      'return heap'
    ],
    defaultInput: { values: [4, 9, 2, 8, 5, 10], target: 3 },
    presets: [
      { label: 'Keep just one', input: { values: [2, 7, 1, 8], target: 1 } },
      { label: 'Keep them all', input: { values: [9, 3, 5], target: 3 } }
    ],
    run: runHeap
  },
  (i) => (i.target < 1 || i.target > i.values.length ? 'Choose k from 1 to the number of values.' : undefined)
)
