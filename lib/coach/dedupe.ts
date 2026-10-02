/**
 * Structural deduplication for generated reps.
 *
 * Every rep carries a `signature` describing its code structure, not its story:
 * "freq-map:count-items" whether it counts fruits or animals. Two reps whose
 * signatures share most of their tokens are treated as the same rep.
 */

export function normalizeSignature(sig: string): string {
  return sig
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function tokens(sig: string): Set<string> {
  return new Set(normalizeSignature(sig).split(/[-:]/).filter(Boolean))
}

export function signatureSimilarity(a: string, b: string): number {
  const x = tokens(a)
  const y = tokens(b)
  if (!x.size || !y.size) return 0
  let inter = 0
  for (const t of x) if (y.has(t)) inter++
  return inter / (x.size + y.size - inter)
}

export const DUPLICATE_THRESHOLD = 0.75

export function isDuplicate(sig: string, recent: string[]): boolean {
  const n = normalizeSignature(sig)
  return recent.some((r) => normalizeSignature(r) === n || signatureSimilarity(sig, r) >= DUPLICATE_THRESHOLD)
}

/** Recent signatures for the given skills, newest first, for the prompt and the filter. */
export function recentSignatures(entries: { signature: string; skills: string[]; at: string }[], skills: string[], limit = 8): string[] {
  const want = new Set(skills)
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of [...entries].sort((a, b) => b.at.localeCompare(a.at))) {
    if (!e.skills.some((s) => want.has(s))) continue
    const n = normalizeSignature(e.signature)
    if (seen.has(n)) continue
    seen.add(n)
    out.push(e.signature)
    if (out.length >= limit) break
  }
  return out
}
