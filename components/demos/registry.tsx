import type { ReactNode } from 'react'
import type { DemoViewProps } from '@/components/demos/demo-player'
import TwoPointersView from '@/components/demos/views/two-pointers-view'

/** Demo id → the view that draws its state. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DEMO_VIEWS: Record<string, (p: DemoViewProps<any>) => ReactNode> = {
  'two-pointers': TwoPointersView,
}
