import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runGraphs({ values }: NumericInput) {
  const nodes = values.map((v, i) => ({ id: String(i), value: `Room ${v}`, x: 80 + (i % 3) * 200, y: 40 + Math.floor(i / 3) * 80 })),
    edges: [string, string][] = []
  for (let i = 1; i < values.length; i++) {
    edges.push([String(Math.floor((i - 1) / 2)), String(i)])
    if (i === 3) edges.push(['2', '3'])
  }
  const adj: number[][] = values.map(() => [])
  for (const [a, b] of edges) {
    adj[+a].push(+b)
    adj[+b].push(+a)
  }
  const state: VisualState = { kind: 'graph', values: [...values], nodes, edges: [], frontier: [], visited: [] }
  const { steps, emit } = recorder(state)
  emit('MODEL', 'Each room is a node. A doorway is a two-way relationship.', [1])
  emit('EDGES', 'Draw both directions of every doorway; this is an undirected graph.', [2], { edges })
  emit('ADJACENCY', 'For each node, store the indexes of its neighbors.', [3], { table: adj.map((xs, i) => `${i}: [${xs.join(', ')}]`) })
  const visited = new Set([0]),
    queue = [0],
    order: number[] = []
  emit('START BFS', 'Mark the starting room when it enters the queue.', [4], { frontier: [values[0]], visited: [values[0]] })
  while (queue.length) {
    const curr = queue.shift()!
    order.push(values[curr])
    emit(
      'VISIT',
      'The queue processes rooms in discovery order.',
      [6],
      { nodes: nodes.map((n) => ({ ...n, active: n.id === String(curr) })), frontier: queue.map((i) => values[i]) },
      { current: values[curr] },
      nextPrediction('When should a new neighbor be marked visited?', 'When it is enqueued', 'After it is removed from the queue')
    )
    for (const neighbor of adj[curr]) {
      if (visited.has(neighbor)) {
        emit('SKIP', 'This room is already discovered; do not add it twice.', [8])
        continue
      }
      visited.add(neighbor)
      queue.push(neighbor)
      emit('DISCOVER', 'Mark and enqueue together so another edge cannot duplicate this room.', [9, 10], {
        frontier: queue.map((i) => values[i]),
        visited: [...visited].map((i) => values[i])
      })
    }
  }
  emit('DONE BFS', 'Every reachable room is visited exactly once in breadth-first order.', [5], { result: order })
  const stack = [0],
    dfsSeen = new Set([0]),
    dfsOrder: number[] = []
  emit('START DFS', 'Use a stack instead of a queue to explore the latest discovered branch first.', [11], { frontier: [values[0]], visited: [values[0]] })
  while (stack.length) {
    const curr = stack.pop()!
    dfsOrder.push(values[curr])
    emit('DFS VISIT', 'Pop the most recent frontier entry; its branch is explored before older entries.', [12, 13], {
      nodes: nodes.map((n) => ({ ...n, active: n.id === String(curr) })),
      frontier: stack.map((i) => values[i])
    })
    for (const neighbor of [...adj[curr]].reverse()) {
      if (dfsSeen.has(neighbor)) continue
      dfsSeen.add(neighbor)
      stack.push(neighbor)
      emit('DFS DISCOVER', 'Mark before pushing so shared neighbors and cycles stay finite.', [14, 15, 16], {
        frontier: stack.map((i) => values[i]),
        visited: [...dfsSeen].map((i) => values[i])
      })
    }
  }
  emit('DONE', 'BFS and DFS reached the same rooms using different frontier order.', [12], { result: dfsOrder })
  return steps
}
export const graphsDemo = numericDemo({
  id: 'graphs',
  title: 'Graphs: rooms, doorways, adjacency and BFS',
  concept: 'graphs',
  summary: 'Turn a small real-world map into a graph, then traverse it.',
  rule: 'The frontier holds discovered work. Mark on enqueue so cycles and shared neighbors cannot duplicate it.',
  code: [
    'rooms = nodes',
    'doorways = undirected_edges',
    'adj = adjacency(rooms, doorways)',
    'queue, visited = deque([0]), {0}',
    'while queue:',
    '    current = queue.popleft()',
    '    for neighbor in adj[current]:',
    '        if neighbor in visited: continue',
    '        visited.add(neighbor)',
    '        queue.append(neighbor)',
    'stack, visited = [0], {0}',
    'while stack:',
    '    current = stack.pop()',
    '    for neighbor in reversed(adj[current]):',
    '        if neighbor not in visited:',
    '            visited.add(neighbor); stack.append(neighbor)'
  ],
  defaultInput: { values: [10, 20, 30, 40, 50], target: 0 },
  presets: [
    { label: 'One room', input: { values: [1], target: 0 } },
    { label: 'Shared neighbor', input: { values: [1, 2, 3, 4], target: 0 } }
  ],
  run: runGraphs
})
