import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState, type VisualNode } from '@/lib/demos/visual-state'
export function runBacktracking({ values }: NumericInput) {
  const state: VisualState = { kind: 'decisions', values: [...values], nodes: [], edges: [], frontier: [], result: [] }
  const { steps, emit } = recorder(state)
  const nodes: VisualNode[] = [],
    edges: [string, string][] = [],
    path: number[] = [],
    answers: string[] = []
  const walk = (i: number, parent?: string, branch = 0) => {
    const id = String(nodes.length),
      x = ((branch + 0.5) * 600) / 2 ** i
    nodes.push({ id, value: `[${path.join(',')}]`, x, y: 30 + i * 65 })
    if (parent) edges.push([parent, id])
    emit(
      'EXPLORE',
      'Each call owns one decision: include this value, or skip it.',
      [1, 2],
      { nodes: nodes.map((n) => ({ ...n, active: n.id === id })), edges: [...edges], frontier: [...path] },
      { index: i },
      nextPrediction(
        'What must happen after exploring an included value?',
        'Undo that exact choice before the skip branch',
        'Keep it for every remaining branch'
      )
    )
    if (i === values.length) {
      answers.push(`[${path.join(',')}]`)
      emit('SAVE', 'At the end of the decisions, copy this path as one subset.', [3, 4], { result: [...answers] })
      return
    }
    path.push(values[i])
    emit('CHOOSE', `Include ${values[i]}.`, [5], { frontier: [...path] })
    walk(i + 1, id, branch * 2)
    path.pop()
    emit('UNDO', `Remove ${values[i]} to restore the caller's path.`, [7], { frontier: [...path] })
    emit('TRY NEXT', `Now explore the choice that skips ${values[i]}.`, [8])
    walk(i + 1, id, branch * 2 + 1)
  }
  walk(0)
  emit('DONE', 'Every include/skip path has been explored; the working path is empty again.', [9], { frontier: [], result: answers })
  return steps
}
export const backtrackingDemo = numericDemo(
  {
    id: 'backtracking',
    title: 'Backtracking: choose, explore, undo',
    concept: 'backtracking',
    summary: 'Watch an include/skip decision tree grow while the working path changes.',
    rule: 'Each recursive branch must return with the same working path it received.',
    code: [
      'def explore(i):',
      '    if i == len(values):',
      '        answers.append(path.copy())',
      '        return',
      '    path.append(values[i])',
      '    explore(i + 1)',
      '    path.pop()',
      '    explore(i + 1)',
      'explore(0)'
    ],
    defaultInput: { values: [2, 5, 8], target: 0 },
    presets: [
      { label: 'One decision', input: { values: [4], target: 0 } },
      { label: 'Two decisions', input: { values: [1, 2], target: 0 } }
    ],
    run: runBacktracking
  },
  (i) => (i.values.length > 4 ? 'At most four values keep the decision tree readable.' : undefined)
)
