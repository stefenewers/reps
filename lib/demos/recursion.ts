import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runRecursion({ target: n }: NumericInput) {
  const state: VisualState = { kind: 'stack', values: [], frames: [] }
  const { steps, emit } = recorder(state)
  const frames: string[] = []
  const call = (k: number): number => {
    frames.push(`sum_to(${k}) · ${k === 0 ? 'base case' : 'waiting for sum_to(' + (k - 1) + ')'}`)
    emit(
      'DOWN',
      `Push a new frame. Its n=${k} belongs only to this call.`,
      [1, 2],
      { frames: [...frames] },
      { n: k },
      nextPrediction(`What does sum_to(${k}) wait for?`, k === 0 ? 'Nothing: return zero' : `sum_to(${k - 1})`, 'A shared global n')
    )
    let result = 0
    if (k === 0) emit('BASE', 'The empty sum is zero; no smaller call is needed.', [3], {}, { returned: 0 })
    else result = k + call(k - 1)
    emit('UP', `This frame returns ${result} to its waiting caller.`, [4], { frames: [...frames], result: [result] }, { n: k, returned: result })
    frames.pop()
    emit('POP', 'Remove the finished frame; resume its caller.', [4], { frames: [...frames] })
    return result
  }
  call(n)
  return steps
}
export const recursionDemo = numericDemo(
  {
    id: 'recursion',
    title: 'Recursion: down the stack and back up',
    concept: 'recursion',
    summary: 'Each frame owns n and later combines a smaller return value.',
    rule: 'A caller pauses until its child returns. The base case starts the return journey.',
    code: ['def sum_to(n):', '    if n == 0:', '        return 0', '    return n + sum_to(n - 1)'],
    defaultInput: { values: [0], target: 4 },
    presets: [
      { label: 'Base case', input: { values: [0], target: 0 } },
      { label: 'Two calls', input: { values: [0], target: 2 } }
    ],
    run: runRecursion
  },
  (i) => (i.target < 0 || i.target > 8 ? 'Use a target from 0 to 8 as the recursion depth.' : undefined)
)
