import type { RepType, Stage } from '@/lib/types'

/** User-facing language. The internal ladder stays internal. */

export const STAGE_LABEL: Record<Stage, string> = {
  recognize: 'Learn',
  trace: 'Learn',
  recall: 'Rep',
  complete: 'Rep',
  reconstruct: 'Rep',
  microbuild: 'Rep',
  combine: 'Combine',
  pattern: 'Apply',
  capstone: 'Apply',
  interview: 'Interview Rep',
  retrieval: 'Cold Rep',
}

export const REP_TYPE_LABEL: Record<RepType, string> = {
  foundation: 'Foundation Rep',
  combine: 'Combination Rep',
  pattern: 'Pattern Rep',
  capstone: 'Capstone',
  cold: 'Cold Rep',
  interview: 'Interview Rep',
}

export const KIND_VERB = {
  choice: 'Choose',
  output: 'Predict the output',
  code: 'Write it',
  reorder: 'Put it in order',
  explain: 'Explain it',
} as const
