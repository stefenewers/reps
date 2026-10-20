import { IconExternal } from '@/components/icons'
import { isLeetcodeOnly, leetcodeUrl } from '@/data/problem-urls'

/**
 * Next to a practice link: "LeetCode only" for the problems NeetCode does not have,
 * otherwise a quiet secondary link to the same problem on LeetCode.
 */
export default function PracticeSite({ lc, className = '' }: { lc: number; className?: string }) {
  if (isLeetcodeOnly(lc))
    return (
      <span className={`rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted ${className}`} data-testid="leetcode-only">
        LeetCode only
      </span>
    )
  const lcUrl = leetcodeUrl(lc)
  if (!lcUrl) return null
  return (
    <a href={lcUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 text-[12px] text-faint hover:text-muted ${className}`} data-testid="leetcode-fallback">
      LeetCode <IconExternal size={10} />
    </a>
  )
}
