/**
 * Deterministic answer checking for non-code reps.
 */

export function normalizeOutput(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''))
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  while (lines.length && lines[0] === '') lines.shift()
  return lines.join('\n')
}

/** Forgiving about spacing around punctuation and quote style, strict about content. */
function loose(line: string): string {
  return line
    .trim()
    .replace(/"/g, "'")
    .replace(/\s*([,:[\]{}()])\s*/g, '$1')
    .replace(/\s+/g, ' ')
}

export function outputMatches(given: string, expected: string): boolean {
  const a = normalizeOutput(given)
  const b = normalizeOutput(expected)
  if (a === b) return true
  const al = a.split('\n').map(loose)
  const bl = b.split('\n').map(loose)
  return al.length === bl.length && al.every((l, i) => l === bl[i])
}

/** First line that differs, for feedback. */
export function firstDifference(given: string, expected: string): { line: number; given: string; expected: string } | null {
  const al = normalizeOutput(given).split('\n')
  const bl = normalizeOutput(expected).split('\n')
  const n = Math.max(al.length, bl.length)
  for (let i = 0; i < n; i++) {
    if (loose(al[i] ?? '') !== loose(bl[i] ?? '')) return { line: i + 1, given: al[i] ?? '(nothing)', expected: bl[i] ?? '(nothing)' }
  }
  return null
}

export const BLANK = '____'

export function hasBlanks(code: string): boolean {
  return code.includes(BLANK)
}
