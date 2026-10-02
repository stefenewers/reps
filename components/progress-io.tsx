'use client'

import { useRef, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { localDate } from '@/lib/dates'

/** Portable JSON backup, independent of Supabase. Import validates and merges without duplicating. */
export default function ProgressIO() {
  const { repo } = useReps()
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const exportNow = () => {
    const blob = new Blob([JSON.stringify(repo.exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reps-progress-${localDate()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Exported.')
  }

  const importFile = async (file: File) => {
    try {
      const { added } = await repo.importData(JSON.parse(await file.text()))
      setMsg(`Imported ${added.attempts} new attempt${added.attempts === 1 ? '' : 's'}, ${added.review_queue} review item(s), ${added.generated_reps} generated rep(s).`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message.slice(0, 160)}`)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
      <button type="button" className="hover:text-ink" onClick={exportNow}>
        Export progress
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" className="hover:text-ink" onClick={() => input.current?.click()}>
        Import progress
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json"
        className="sr-only"
        aria-label="Import progress file"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importFile(f)
          e.target.value = ''
        }}
      />
      {msg && (
        <span role="status" className="text-ink-2">
          {msg}
        </span>
      )}
    </div>
  )
}
