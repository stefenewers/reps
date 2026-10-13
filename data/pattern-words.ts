import type { SkillId } from '@/lib/types'

/**
 * The words that name a technique. A transfer rep (and a mastery check) must not
 * use the ones belonging to its own skills in its title or prompt: recognising
 * the pattern is the thing being tested. Teaching reps use them freely.
 *
 * Only words that give the method away are listed. Vocabulary the problem
 * itself needs ("sorted", "interval", "tree", "grid") is not.
 */
const W: [RegExp[], SkillId[]][] = [
  [[/two[- ]pointers?/i, /\bpointers?\b/i, /from both ends/i], ['two_pointer', 'pointer_update', 'sorted_dedupe', 'expand_center']],
  [[/sliding[- ]window/i, /\bwindow\b/i], ['sliding_window', 'window_state', 'window_counts']],
  [[/\bhash(es|ing| ?map| ?set| ?table)?\b/i, /\b(a|the|one|with a|use a|using a) (set|dict|dictionary)\b/i, /frequency map/i, /index map/i, /`seen`|\bseen[- ](set|dict|map|so far in a)\b/i, /complement/i], ['set_membership', 'set_add', 'hash_reasoning', 'frequency_map', 'index_map', 'complement', 'dict_get', 'grouping_key', 'sequence_start']],
  [[/\bstack\b/i, /\bpush\b/i, /\bpop\b/i], ['stack_push_pop', 'matching_pairs']],
  [[/binary search/i, /\bmid(dle index)?\b/i, /\bhalv/i, /\blo\b.*\bhi\b/i], ['binary_search', 'mid_calc', 'search_invariant', 'rotated_search']],
  [[/fast (and|&) slow/i, /slow (and|&) fast/i, /two speeds/i], ['fast_slow']],
  [[/\bdummy\b/i], ['dummy_node']],
  [[/\brecurs/i, /\bDFS\b/, /depth[- ]first/i, /base case/i], ['recursion_base_case', 'recursion_return', 'tree_dfs', 'tree_global_best']],
  [[/in-?order/i, /\bBST property\b/i], ['tree_inorder']],
  [[/\bBFS\b/, /breadth[- ]first/i, /\bqueue\b/i, /\bdeque\b/i, /level by level/i], ['bfs', 'bfs_levels', 'queue_deque', 'graph_bfs']],
  [[/\bDFS\b/, /\bBFS\b/, /\bvisited\b/i, /adjacency/i, /connected components?/i], ['graph_dfs', 'graph_bfs', 'visited_set', 'connected_components', 'graph_adjacency', 'border_reach']],
  [[/\bcycle detection\b/i, /in-?degree/i, /topological/i], ['cycle_detection']],
  [[/\bheap/i, /priority queue/i], ['heap_push_pop', 'top_k', 'min_rooms']],
  [[/backtrack/i, /un-?choose/i], ['backtracking_state', 'combination_start', 'grid_backtracking']],
  [[/\bDP\b/, /dynamic programming/i, /\bmemo/i, /recurrence/i, /bottom[- ]up/i, /\btable\b/i], ['recurrence', 'memoization', 'dp_table', 'dp_min_choice', 'dp_lookback', 'dp_prefix_words', 'dp_grid', 'dp_two_sequences', 'circular_split']],
  [[/kadane/i, /\bgreedy\b/i], ['kadane', 'greedy_reach', 'interval_greedy']],
  [[/\bprefix\b/i, /\bsuffix\b/i], ['prefix_suffix']],
  [[/transpose/i], ['matrix_transform']],
]

/** The technique-naming words in a piece of text, for a rep with these skills. */
export function patternLeaks(text: string, skills: SkillId[]): string[] {
  const out: string[] = []
  for (const [words, mine] of W) {
    if (!mine.some((s) => skills.includes(s))) continue
    for (const w of words) {
      const m = w.exec(text)
      if (m) out.push(m[0])
    }
  }
  return [...new Set(out)]
}
