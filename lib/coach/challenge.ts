import type { Plan } from '@/lib/coach/schemas'

/**
 * "Challenge me", parsed locally first. Most requests ("10 fast dict +
 * enumerate questions", "hit my weakest skills for 20 minutes") need no model
 * at all. Returns null when the request is too open-ended, and only then does
 * the client ask /api/coach/plan.
 */

const ALIASES: [RegExp, string[]][] = [
  [/\.get\b|get\(\)|dict\.get/i, ['dict_get']],
  [/enumerate/i, ['enumerate']],
  [/frequen|count(ing|s)?\b|tally/i, ['frequency_map']],
  [/index map|value.?to.?index/i, ['index_map']],
  [/two.?sum|complement/i, ['index_map', 'complement']],
  [/dict(ionar(y|ies))?|hash ?map/i, ['dict_assign', 'dict_lookup', 'dict_membership']],
  [/\.items|iterat\w* (over )?dict/i, ['dict_items']],
  [/\bsets?\b/i, ['set_membership', 'set_add']],
  [/\brange\b/i, ['range']],
  [/for.?loops?|loops?\b/i, ['for_loop', 'list_iterate']],
  [/slic(e|ing)/i, ['slicing']],
  [/string/i, ['string_iterate', 'string_index']],
  [/two.?pointers?|pointers?\b/i, ['two_pointer', 'pointer_update']],
  [/sliding|window/i, ['sliding_window', 'window_state']],
  [/stack|parenthes|bracket/i, ['stack_push_pop', 'matching_pairs']],
  [/binary.?search/i, ['binary_search', 'mid_calc']],
  [/linked.?lists?|listnode/i, ['linked_list_traversal', 'linked_list_reassignment']],
  [/recurs/i, ['recursion_base_case', 'recursion_return']],
  [/trees?\b|\bdfs\b/i, ['tree_dfs']],
  [/deque|queue|\bbfs\b/i, ['queue_deque', 'bfs']],
  [/grids?\b|islands?/i, ['grid_neighbors', 'visited_set']],
  [/graphs?|adjacen/i, ['graph_adjacency', 'graph_dfs']],
  [/heap|top.?k|kth/i, ['heap_push_pop', 'top_k']],
  [/sort/i, ['sort_key']],
  [/interval/i, ['interval_overlap']],
  [/backtrack|subsets?|permutation/i, ['backtracking_state']],
  [/memo|\bdp\b|dynamic/i, ['memoization', 'recurrence']],
]

export function parseChallenge(text: string, weakest: string[]): Plan | null {
  const t = text.toLowerCase()
  const skills: string[] = []
  for (const [re, ids] of ALIASES) if (re.test(t)) for (const id of ids) if (!skills.includes(id)) skills.push(id)
  const wantsWeakest = /weak/.test(t)
  if (wantsWeakest) for (const w of weakest) if (!skills.includes(w)) skills.push(w)

  const hidePattern = /without (telling|naming|saying)|don'?t (tell|name|say)|same mechanics|disguis/.test(t)
  // Disguised problems need fresh generation; otherwise curriculum reps go first.
  if (hidePattern && !skills.length) return null
  if (!skills.length) return null

  const minutes = /(\d+)\s*(min|minutes)/.exec(t)
  const explicit = /(\d+)\s*(fast |quick |more |short )?(questions|reps|problems|exercises|drills)?/.exec(t)
  let count = 6
  if (minutes) count = Math.max(3, Math.min(15, Math.round(Number(minutes[1]) / 3)))
  else if (explicit && Number(explicit[1]) > 0 && Number(explicit[1]) <= 15) count = Number(explicit[1])

  const hard = /hard|harder|challenge|tough|medium/.test(t)
  const easy = /easy|easier|simple|basic|fast|quick/.test(t)
  const difficulty = hard ? 4 : easy ? 1 : 2
  const type: Plan['type'] = hidePattern ? 'pattern' : /cold|from scratch|recall/.test(t) ? 'cold' : skills.length > 1 ? 'combine' : 'foundation'
  const fresh = hidePattern || /new|fresh|generate|different/.test(t)

  return { skills: skills.slice(0, 4), count, difficulty, type, hidePattern, fresh }
}
