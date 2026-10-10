'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

const noop = () => () => {}

/**
 * Renders its children only in the browser. Pages are prerendered at deploy
 * time, so anything that depends on today's date would otherwise be drawn for
 * the deploy date and then mismatch on hydration.
 */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const inBrowser = useSyncExternalStore(noop, () => true, () => false)
  return inBrowser ? <>{children}</> : <main className="flex-1 bg-canvas" aria-busy="true" />
}
