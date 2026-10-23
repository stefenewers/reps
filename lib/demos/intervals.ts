import { numericDemo, recorder, nextPrediction, type NumericInput, type VisualState } from '@/lib/demos/visual-state'
export function runIntervals({ values, target: width }: NumericInput) {
  const intervals = values.map((start) => [start, start + width] as [number, number])
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]),
    merged: [number, number][] = []
  const state: VisualState = { kind: 'intervals', values: [], intervals }
  const { steps, emit } = recorder(state)
  emit('START', 'Each start creates an interval of the chosen width.', [1])
  emit('SORT', 'Sort by start so only the latest merged interval can overlap the next one.', [2], { intervals: sorted })
  for (const [start, end] of sorted) {
    const last = merged.at(-1)
    emit(
      'COMPARE',
      last ? `Compare next start ${start} with current end ${last[1]}.` : 'No result yet; this interval starts the result.',
      [4],
      { intervals: sorted, table: merged.map((x) => `[${x.join(', ')}]`) },
      { start, end },
      nextPrediction('Do touching closed intervals overlap?', 'Yes: next start <= current end', 'No: touching must always start a new interval')
    )
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end)
      emit('MERGE', 'Expand the current end; a contained interval cannot make it smaller.', [5], { table: merged.map((x) => `[${x.join(', ')}]`) })
    } else {
      merged.push([start, end])
      emit('NO OVERLAP', 'Start a new interval after a gap.', [6, 7], { table: merged.map((x) => `[${x.join(', ')}]`) })
    }
  }
  emit('DONE', 'The result covers exactly the same positions with no overlapping pairs.', [8], {
    intervals: merged,
    result: merged.map((x) => `[${x.join(', ')}]`)
  })
  return steps
}
export const intervalsDemo = numericDemo(
  {
    id: 'intervals',
    title: 'Intervals: sort, compare and merge on a timeline',
    concept: 'intervals',
    summary: 'Use the target as a common interval width; watch overlap expand the merged result.',
    rule: 'After sorting by start, only the last merged interval can overlap the next one.',
    code: [
      'intervals = [(start, start + width) for start in starts]',
      'intervals.sort()',
      'for start, end in intervals:',
      '    if merged and start <= merged[-1][1]:',
      '        merged[-1][1] = max(merged[-1][1], end)',
      '    else:',
      '        merged.append([start, end])',
      'return merged'
    ],
    defaultInput: { values: [7, 1, 3, 12], target: 3 },
    presets: [
      { label: 'Touching', input: { values: [1, 3, 5], target: 2 } },
      { label: 'Separated', input: { values: [1, 5, 9], target: 1 } }
    ],
    run: runIntervals
  },
  (i) => (i.target < 0 || i.target > 20 ? 'Use an interval width from 0 to 20.' : undefined)
)
