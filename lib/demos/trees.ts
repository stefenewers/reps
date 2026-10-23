import { numericDemo, recorder, nextPrediction, treeNodes, treeEdges, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runTrees({ values }: NumericInput) {
  const nodes = treeNodes(values),
    state: VisualState = { kind: 'tree', values: [...values], nodes, edges: treeEdges(values.length), frames: [], frontier: [] }
  const { steps, emit } = recorder(state),
    frames: string[] = []
  emit('DFS', 'First compute the height by asking each child for its own height.', [1])
  const height = (i: number): number => {
    if (i >= values.length) return 0
    frames.push(`height(node ${i}: ${values[i]})`)
    emit(
      'DOWN',
      'Each node promises the height of its own subtree.',
      [2, 3],
      { nodes: nodes.map((n) => ({ ...n, active: n.id === String(i) })), frames: [...frames] },
      { node: values[i] },
      nextPrediction('What does a missing child return?', 'Height zero', 'Height one')
    )
    const left = height(2 * i + 1),
      right = height(2 * i + 2),
      result = 1 + Math.max(left, right)
    frames.pop()
    emit(
      'COMBINE',
      `Left height ${left}, right height ${right}: return ${result}.`,
      [4],
      { nodes: nodes.map((n) => ({ ...n, active: n.id === String(i) })), frames: [...frames], result: [result] },
      { left, right, height: result }
    )
    return result
  }
  const h = height(0)
  const queue = [0],
    visited: number[] = []
  let level = 0
  emit('BFS', 'Now use a queue to visit the same tree one level at a time.', [5], { frontier: queue.map((i) => values[i]), frames: [] }, { height: h })
  while (queue.length) {
    const size = queue.length
    emit('LEVEL', `Snapshot ${size} nodes before adding children from the next level.`, [7], {}, { level, size })
    for (let k = 0; k < size; k++) {
      const i = queue.shift()!
      visited.push(values[i])
      emit('DEQUEUE', 'Process the oldest queued node.', [9], {
        frontier: queue.map((i) => values[i]),
        visited: [...visited],
        nodes: nodes.map((n) => ({ ...n, active: n.id === String(i) }))
      })
      for (const child of [2 * i + 1, 2 * i + 2]) if (child < values.length) queue.push(child)
      emit('ENQUEUE', 'Append existing children after every node already waiting.', [9, 10], { frontier: queue.map((i) => values[i]) })
    }
    level++
  }
  emit('DONE', 'The queue is empty; every node was visited in level order.', [6], { result: visited })
  return steps
}
export const treesDemo = numericDemo({
  id: 'trees',
  title: 'Trees: recursive returns and breadth-first levels',
  concept: 'trees',
  summary: 'Compute subtree heights, then watch the queue form levels.',
  rule: 'DFS combines child answers; BFS snapshots the current queue length to preserve level boundaries.',
  code: [
    'def height(node):',
    '    if node is None: return 0',
    '    left, right = height(node.left), height(node.right)',
    '    return 1 + max(left, right)',
    'queue = deque([root])',
    'while queue:',
    '    size = len(queue)',
    '    for _ in range(size):',
    '        node = queue.popleft()',
    '        queue.extend(children(node))'
  ],
  defaultInput: { values: [8, 3, 10, 1, 6, 9, 12], target: 0 },
  presets: [
    { label: 'Single node', input: { values: [7], target: 0 } },
    { label: 'Two levels', input: { values: [1, 2, 3], target: 0 } }
  ],
  run: runTrees
})
