import type { Problem } from '@/lib/types'

/**
 * Canonical LeetCode targets. Reps never reproduces problem statements: the
 * internal capstone (exercise id `cap-<id>`) is written in Reps' own words and
 * the LeetCode link is the external reference.
 */

function p(id: string, number: number, title: string, slug: string, pattern: string, day: string, skills: string[]): Problem {
  return { id, number, title, leetcode: `https://leetcode.com/problems/${slug}/`, pattern, day, skills, exerciseId: `cap-${id}` }
}

export const PROBLEMS: Problem[] = [
  p('contains-duplicate', 217, 'Contains Duplicate', 'contains-duplicate', 'Hash set', '2026-10-02', ['set_create', 'set_add', 'set_membership', 'for_loop', 'early_return', 'hash_reasoning']),
  p('valid-anagram', 242, 'Valid Anagram', 'valid-anagram', 'Frequency map', '2026-10-02', ['frequency_map', 'dict_get', 'string_iterate', 'len', 'dict_items']),
  p('two-sum', 1, 'Two Sum', 'two-sum', 'Hash map', '2026-10-02', ['enumerate', 'index_map', 'dict_membership', 'dict_lookup', 'dict_assign', 'complement', 'hash_reasoning']),

  p('valid-palindrome', 125, 'Valid Palindrome', 'valid-palindrome', 'Two pointers', '2026-10-03', ['two_pointer', 'pointer_update', 'string_index', 'string_methods', 'while_loop']),
  p('best-time-stock', 121, 'Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'Running min', '2026-10-03', ['state_tracking', 'list_iterate', 'accumulator']),
  p('two-sum-ii', 167, 'Two Sum II – Input Array Is Sorted', 'two-sum-ii-input-array-is-sorted', 'Two pointers', '2026-10-03', ['two_pointer', 'pointer_update', 'while_loop']),

  p('longest-substring', 3, 'Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'Sliding window', '2026-10-04', ['sliding_window', 'window_state', 'set_membership', 'state_tracking']),
  p('valid-parentheses', 20, 'Valid Parentheses', 'valid-parentheses', 'Stack', '2026-10-04', ['stack_push_pop', 'matching_pairs', 'dict_lookup']),

  p('binary-search', 704, 'Binary Search', 'binary-search', 'Binary search', '2026-10-05', ['binary_search', 'mid_calc', 'search_invariant', 'while_loop']),
  p('reverse-linked-list', 206, 'Reverse Linked List', 'reverse-linked-list', 'Pointer rewiring', '2026-10-05', ['linked_list_traversal', 'linked_list_reassignment', 'listnode']),
  p('merge-two-lists', 21, 'Merge Two Sorted Lists', 'merge-two-sorted-lists', 'Dummy head', '2026-10-05', ['dummy_node', 'linked_list_traversal', 'linked_list_reassignment']),

  p('max-depth', 104, 'Maximum Depth of Binary Tree', 'maximum-depth-of-binary-tree', 'Tree DFS', '2026-10-06', ['tree_dfs', 'recursion_base_case', 'recursion_return']),
  p('same-tree', 100, 'Same Tree', 'same-tree', 'Tree DFS', '2026-10-06', ['tree_dfs', 'recursion_base_case', 'recursion_return']),
  p('invert-tree', 226, 'Invert Binary Tree', 'invert-binary-tree', 'Tree DFS', '2026-10-06', ['tree_dfs', 'recursion_base_case', 'treenode']),

  p('level-order', 102, 'Binary Tree Level Order Traversal', 'binary-tree-level-order-traversal', 'BFS by level', '2026-10-07', ['bfs', 'bfs_levels', 'queue_deque', 'treenode']),
  p('number-of-islands', 200, 'Number of Islands', 'number-of-islands', 'Grid traversal', '2026-10-07', ['grid_nested', 'grid_neighbors', 'visited_set', 'bfs']),

  p('path-exists', 1971, 'Find if Path Exists in Graph', 'find-if-path-exists-in-graph', 'Graph traversal', '2026-10-08', ['graph_adjacency', 'graph_dfs', 'visited_set']),
  p('number-of-provinces', 547, 'Number of Provinces', 'number-of-provinces', 'Connected components', '2026-10-08', ['connected_components', 'graph_dfs', 'visited_set']),
  p('course-schedule', 207, 'Course Schedule', 'course-schedule', 'Cycle detection', '2026-10-08', ['cycle_detection', 'graph_adjacency', 'graph_dfs']),

  p('top-k-frequent', 347, 'Top K Frequent Elements', 'top-k-frequent-elements', 'Frequency + heap', '2026-10-09', ['frequency_map', 'top_k', 'heap_push_pop', 'sort_key']),
  p('kth-largest', 215, 'Kth Largest Element in an Array', 'kth-largest-element-in-an-array', 'Heap', '2026-10-09', ['heap_push_pop', 'top_k']),
  p('merge-intervals', 56, 'Merge Intervals', 'merge-intervals', 'Intervals', '2026-10-09', ['sort_key', 'interval_overlap', 'list_index']),

  p('subsets', 78, 'Subsets', 'subsets', 'Backtracking', '2026-10-10', ['backtracking_state', 'recursion_base_case']),
  p('climbing-stairs', 70, 'Climbing Stairs', 'climbing-stairs', '1-D DP', '2026-10-10', ['recurrence', 'memoization', 'dp_table']),
  p('house-robber', 198, 'House Robber', 'house-robber', '1-D DP', '2026-10-10', ['recurrence', 'dp_table', 'state_tracking']),
]

export const PROBLEM_BY_ID: Record<string, Problem> = Object.fromEntries(PROBLEMS.map((x) => [x.id, x]))
