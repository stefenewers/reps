import type { Metadata } from 'next'
import DemoView from '@/components/demo/demo-view'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Reps: learn coding-interview patterns from the ground up. Try a short ladder in the browser and see a 13-week plan for software engineering interviews.',
  // The rest of the app is a private tool; this page is the public one.
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Reps · Build fluency through repetition',
    description: 'Try a short ladder of Python reps in the browser, and see a 13-week plan for software engineering interviews.',
    type: 'website',
  },
}

export default function DemoPage() {
  return <DemoView />
}
