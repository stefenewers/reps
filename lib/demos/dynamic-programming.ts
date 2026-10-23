import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState, type VisualNode } from '@/lib/demos/visual-state'
export function runDP({ target: n }: NumericInput) {
  const state: VisualState = { kind: 'dp', values: [], nodes: [{ id: 'state', value: `ways(${n})`, x: 300, y: 40 }], edges: [] }
  const { steps, emit } = recorder(state)
  const nodes: VisualNode[] = [],
    edges: [string, string][] = [],
    seen = new Set<number>()
  let leaves = 0
  emit('STATE', 'ways(k) means the number of ways to climb k steps, taking one or two at a time.', [1])
  const tree = (k: number, depth: number, parent?: string) => {
    const id = String(nodes.length),
      duplicate = seen.has(k)
    seen.add(k)
    nodes.push({ id, value: `ways(${k})${duplicate ? ' · repeated' : ''}`, x: 25 + (leaves++ % 12) * 48, y: 30 + depth * 48, muted: duplicate })
    if (parent) edges.push([parent, id])
    emit(
      duplicate ? 'DUPLICATE' : 'RECURSION',
      duplicate ? `ways(${k}) is being recomputed. The same input has the same answer.` : 'A smaller state represents the remaining steps.',
      [2, 3],
      { nodes: [...nodes], edges: [...edges] },
      { k }
    )
    if (k > 1) {
      tree(k - 1, depth + 1, id)
      tree(k - 2, depth + 1, id)
    }
  }
  tree(n, 0)
  emit('MEMO', 'Store answers by remaining steps; the repeated recursion can now become a lookup.', [4], {
    nodes: [],
    edges: [],
    table: Array(n + 1).fill('—')
  })
  const memo = new Map<number, number>()
  const ways = (k: number): number => {
    if (memo.has(k)) {
      emit('LOOKUP', `ways(${k}) is already ${memo.get(k)}; reuse it without another subtree.`, [6, 7], {}, { k, value: memo.get(k)! })
      return memo.get(k)!
    }
    const answer = k <= 1 ? 1 : ways(k - 1) + ways(k - 2)
    memo.set(k, answer)
    emit(
      k <= 1 ? 'BASE' : 'CACHE',
      `Remember ways(${k}) = ${answer}.`,
      [8, 9, 11, 12],
      { table: Array.from({ length: n + 1 }, (_, i) => memo.get(i) ?? '—') },
      { k, answer }
    )
    return answer
  }
  const answer = ways(n)
  const dp = Array<number | string>(n + 1).fill('—')
  dp[0] = 1
  if (n >= 1) dp[1] = 1
  emit('BASE', 'There is one way to climb zero steps and one way to climb one step.', [16, 17], { table: [...dp] })
  for (let k = 2; k <= n; k++) {
    const value = Number(dp[k - 1]) + Number(dp[k - 2])
    emit(
      'RECURRENCE',
      `ways(${k}) = ways(${k - 1}) + ways(${k - 2}).`,
      [19],
      {},
      { k },
      nextPrediction(`What should dp[${k}] become?`, String(value), String(value + 1))
    )
    dp[k] = value
    emit('ORDER', 'Both smaller answers are already filled because k increases.', [18, 19], { table: [...dp] }, { k, value })
  }
  emit('DONE', `Memoized recursion and the bottom-up table agree: ${answer} ways.`, [20], { result: [answer] })
  return steps
}
export const dpDemo = numericDemo(
  {
    id: 'dynamic-programming',
    title: 'DP: repeated recursion becomes a table',
    concept: 'dynamic-programming',
    summary: 'See duplicated states, memo lookups and bottom-up dependency order.',
    rule: 'STATE: remaining steps. BASE: ways(0)=ways(1)=1. RECURRENCE: add the previous two states. ORDER: smallest state first.',
    code: [
      'def ways(k):',
      '    if k <= 1: return 1',
      '    return ways(k - 1) + ways(k - 2)',
      'memo = {}',
      'def cached(k):',
      '    if k in memo:',
      '        return memo[k]',
      '    if k <= 1:',
      '        answer = 1',
      '    else:',
      '        answer = cached(k - 1) + cached(k - 2)',
      '    memo[k] = answer',
      '    return answer',
      'def bottom_up(n):',
      '    dp = [0] * (n + 1)',
      '    dp[0] = 1',
      '    if n >= 1: dp[1] = 1',
      '    for k in range(2, n + 1):',
      '        dp[k] = dp[k - 1] + dp[k - 2]',
      '    return dp[n]'
    ],
    defaultInput: { values: [0], target: 5 },
    presets: [
      { label: 'Two steps', input: { values: [0], target: 2 } },
      { label: 'Six steps', input: { values: [0], target: 6 } }
    ],
    run: runDP
  },
  (i) => (i.target < 2 || i.target > 6 ? 'Use a target from 2 to 6 to see repeated states clearly.' : undefined)
)
