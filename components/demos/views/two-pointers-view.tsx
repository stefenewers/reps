import ArrayView from '@/components/demos/array-view'
import type { DemoViewProps } from '@/components/demos/demo-player'
import type { TwoPointerState } from '@/lib/demos/two-pointers'

export default function TwoPointersView({ state }: DemoViewProps<TwoPointerState>) {
  const { values, left, right, discarded, compare, found, done } = state
  const live = !(done && !found)
  return (
    <div className="flex flex-col gap-3">
      <ArrayView
        values={values}
        pointers={live ? [{ name: 'left', index: left, tone: 'learn' }, { name: 'right', index: right, tone: 'flame' }] : []}
        region={live ? [left, right] : null}
        ruledOut={discarded}
        highlight={compare && !found ? [left, right] : []}
        found={found ?? []}
        regionLabel={done ? undefined : 'Still possible: every pair between left and right'}
      />
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-surface-2" /> ruled out, safely
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-learn-soft shadow-[inset_0_0_0_1.5px_var(--learn)]" /> still in play
        </span>
      </p>
    </div>
  )
}
