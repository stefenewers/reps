import type { DemoDefinition, DemoStep, VarValue } from '@/lib/demos/types'

export interface VisualNode {
  id: string
  value: string
  x: number
  y: number
  active?: boolean
  muted?: boolean
}
export interface VisualState {
  kind: 'array' | 'links' | 'stack' | 'tree' | 'graph' | 'decisions' | 'dp' | 'heap' | 'intervals'
  values: (number | string)[]
  active?: number[]
  discarded?: number[]
  pointers?: Record<string, number | null>
  nodes?: VisualNode[]
  edges?: [string, string][]
  frontier?: (number | string)[]
  visited?: (number | string)[]
  frames?: string[]
  table?: (number | string)[]
  intervals?: [number, number][]
  result?: (number | string)[]
}
export interface NumericInput {
  values: number[]
  target: number
}
export function numericDemo(
  config: Omit<DemoDefinition<NumericInput, VisualState>, 'formatInput' | 'parseInput'>,
  validate?: (i: NumericInput) => string | undefined
): DemoDefinition<NumericInput, VisualState> {
  return {
    ...config,
    inputHint: '{"values":[1,2,3],"target":4}',
    formatInput: (i) => JSON.stringify(i),
    parseInput: (text) => {
      try {
        const input = JSON.parse(text) as NumericInput
        if (
          !input ||
          !Array.isArray(input.values) ||
          input.values.length < 1 ||
          input.values.length > 8 ||
          input.values.some((v) => !Number.isInteger(v) || Math.abs(v) > 99) ||
          !Number.isInteger(input.target) ||
          Math.abs(input.target) > 99
        )
          return { error: 'Use 1–8 whole numbers from -99 to 99, and a whole-number target.' }
        const error = validate?.(input)
        return error ? { error } : { input }
      } catch {
        return { error: 'Use JSON with a values list and a target number.' }
      }
    }
  }
}
export function recorder(state: VisualState, vars: Record<string, VarValue> = {}) {
  const steps: DemoStep<VisualState>[] = []
  const emit = (
    label: string,
    why: string,
    lines: number[],
    changes: Partial<VisualState> = {},
    variables: Record<string, VarValue> = {},
    predict?: DemoStep<VisualState>['predict']
  ) => {
    Object.assign(state, changes)
    Object.assign(vars, variables)
    steps.push({ label, why, lines, state: structuredClone(state), vars: { ...vars }, predict })
  }
  return { steps, emit }
}
export const nextPrediction = (question: string, correct: string, wrong: string) => ({ question, choices: [correct, wrong], answer: 0 })
export function treeNodes(values: number[]): VisualNode[] {
  return values.map((v, i) => {
    const level = Math.floor(Math.log2(i + 1))
    const position = i - (2 ** level - 1)
    return { id: String(i), value: String(v), x: ((position + 0.5) * 600) / 2 ** level, y: 36 + level * 72 }
  })
}
export const treeEdges = (length: number): [string, string][] =>
  Array.from({ length: Math.max(0, length - 1) }, (_, k) => [String(Math.floor(k / 2)), String(k + 1)])
