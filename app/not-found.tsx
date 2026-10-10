import Link from 'next/link'

export const metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[620px] flex-1 px-5 py-20">
      <p className="eyebrow text-muted">404</p>
      <h1 className="h1 mt-2">That page does not exist</h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">The rep or day in that link is not part of Reps. It may have been mistyped, or it came from an older version of the plan.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="btn btn-primary btn-lg">
          Go to Today
        </Link>
        <Link href="/plan" className="btn btn-lg">
          See the plan
        </Link>
      </div>
    </main>
  )
}
