import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runLinkedList({ values }: NumericInput) {
  const links: (number | null)[] = values.map((_, i) => (i + 1 < values.length ? i + 1 : null))
  const state: VisualState = {
    kind: 'links',
    values: [...values],
    nodes: values.map((v, i) => ({ id: String(i), value: String(v), x: 45 + i * 75, y: 70 })),
    edges: [],
    pointers: { prev: null, curr: 0, next: null }
  }
  const { steps, emit } = recorder(state)
  let prev: number | null = null,
    curr: number | null = 0
  const edges = (): [string, string][] => links.flatMap((n, i) => (n === null ? [] : [[String(i), String(n)] as [string, string]]))
  emit('START', 'prev is the reversed prefix; curr begins the remaining chain.', [1], { edges: edges() })
  while (curr !== null) {
    const next: number | null = links[curr]
    emit(
      'SAVE',
      'Save the next node before changing the only reference to it.',
      [3],
      { pointers: { prev, curr, next } },
      {},
      nextPrediction('What must be saved before rewiring curr.next?', 'The next node in the original chain', 'Only the value stored in curr')
    )
    links[curr] = prev
    emit('REWIRE', 'Point the current node at the reversed prefix.', [4], { edges: edges() })
    prev = curr
    curr = next
    emit('ADVANCE', 'Move prev to the new prefix head and curr to the saved next node.', [5, 6], { pointers: { prev, curr, next: null } }, { prev, curr })
  }
  emit('DONE', 'prev is the new head. Following its arrows visits the values in reverse.', [7], { result: [...values].reverse() })
  return steps
}
export const linkedListDemo = numericDemo({
  id: 'linked-list',
  title: 'Linked list reversal: save, rewire, advance',
  concept: 'linked-lists',
  summary: 'See references change while the node values stay in place.',
  rule: 'Never overwrite the reference to the unprocessed chain before saving it.',
  code: [
    'prev, curr = None, head',
    'while curr is not None:',
    '    next_node = curr.next',
    '    curr.next = prev',
    '    prev = curr',
    '    curr = next_node',
    'return prev'
  ],
  defaultInput: { values: [4, 7, 2, 9], target: 0 },
  presets: [
    { label: 'One node', input: { values: [5], target: 0 } },
    { label: 'Two nodes', input: { values: [1, 2], target: 0 } }
  ],
  run: runLinkedList
})
