import type { SkillId } from '@/lib/types'

/**
 * The vocabulary Reps introduces. Each term names the skill whose primer must
 * define it in plain words, so nobody has to infer a definition from a prompt.
 * `says` is how the definition is recognised in the primer's text.
 */
export interface Term {
  term: string
  skill: SkillId
  says: RegExp
}

export const VOCABULARY: Term[] = [
  { term: 'pointer', skill: 'two_pointer', says: /\b(index(es)?|position)\b/i },
  { term: 'invariant', skill: 'search_invariant', says: /invariant/i },
  { term: 'lower bound', skill: 'search_invariant', says: /lower bound|first (index|position)/i },
  { term: 'half-open range', skill: 'search_invariant', says: /half-open/i },
  { term: 'sliding window', skill: 'sliding_window', says: /window/i },
  { term: 'window state', skill: 'window_state', says: /inside the window|window state/i },
  { term: 'stack', skill: 'stack_push_pop', says: /last in|LIFO|most recent/i },
  { term: 'queue', skill: 'queue_deque', says: /first in|FIFO/i },
  { term: 'deque', skill: 'queue_deque', says: /deque/i },
  { term: 'BFS', skill: 'bfs', says: /breadth|level by level|one step away/i },
  { term: 'DFS', skill: 'tree_dfs', says: /depth[- ]first/i },
  { term: 'tree traversal', skill: 'tree_dfs', says: /travers|visit/i },
  { term: 'preorder / inorder / postorder', skill: 'tree_inorder', says: /in-?order/i },
  { term: 'recursion base case', skill: 'recursion_base_case', says: /base case/i },
  { term: 'adjacency list', skill: 'graph_adjacency', says: /adjacency/i },
  { term: 'visited set', skill: 'visited_set', says: /visited/i },
  { term: 'connected component', skill: 'connected_components', says: /component/i },
  { term: 'directed edge', skill: 'cycle_detection', says: /directed/i },
  { term: 'in-degree', skill: 'cycle_detection', says: /in-?degree|visiting/i },
  { term: 'heap', skill: 'heap_push_pop', says: /smallest/i },
  { term: 'size-k heap', skill: 'top_k', says: /size[- ]k|k items|k largest/i },
  { term: 'interval', skill: 'interval_overlap', says: /start.*end|\[start, end\]/i },
  { term: 'backtracking', skill: 'backtracking_state', says: /backtrack/i },
  { term: 'choose / explore / un-choose', skill: 'backtracking_state', says: /un-?choose|undo/i },
  { term: 'recurrence', skill: 'recurrence', says: /recurrence|smaller (answers|subproblems|inputs)/i },
  { term: 'memoization', skill: 'memoization', says: /memo/i },
  { term: 'bottom-up DP', skill: 'dp_table', says: /bottom[- ]up/i },
  { term: 'DP state', skill: 'dp_table', says: /\bstate\b|dp\[i\] (means|is|holds)/i },
  { term: 'rolling state', skill: 'dp_table', says: /rolling|last (one or )?two|only the last/i },
  { term: 'dummy head', skill: 'dummy_node', says: /dummy/i },
  { term: 'frequency map', skill: 'frequency_map', says: /count/i },
  { term: 'index map', skill: 'index_map', says: /index/i },
  { term: 'complement', skill: 'complement', says: /target - |still needed|complete/i },
]
