import type { Skill, SkillGroup, SkillId } from '@/lib/types'

/**
 * The skill graph. Granular on purpose: a capstone is the sum of these, and
 * mastery is tracked per skill, never per "topic".
 */

function s(id: SkillId, name: string, group: SkillGroup, definition: string, prerequisites: SkillId[] = []): Skill {
  return { id, name, group, definition, prerequisites }
}

export const SKILLS: Skill[] = [
  // Python foundations
  s('list_create', 'list literal', 'Python foundations', 'Create a list with [] and values, including the empty list.'),
  s('list_index', 'list indexing', 'Python foundations', 'Read and write list[i], including negative indexes like list[-1].', ['list_create']),
  s('list_append', 'list.append', 'Python foundations', 'Add an item to the end of a list with .append(x).', ['list_create']),
  s('len', 'len()', 'Python foundations', 'Get the size of a list, string, set or dict with len().', ['list_create']),
  s('for_loop', 'for loop', 'Python foundations', 'Iterate over the items of a sequence with for x in seq.', ['list_create']),
  s('list_iterate', 'list iteration', 'Python foundations', 'Visit each element of a list in order and act on it.', ['for_loop']),
  s('range', 'range()', 'Python foundations', 'Produce integer sequences with range(stop), range(start, stop) and range(start, stop, step).', ['for_loop']),
  s('enumerate', 'enumerate', 'Python foundations', 'Loop with both index and value: for i, x in enumerate(seq).', ['for_loop', 'list_index']),
  s('conditionals', 'if / elif / else', 'Python foundations', 'Branch on conditions, including comparisons and boolean operators.'),
  s('accumulator', 'accumulator variable', 'Python foundations', 'Keep a running total, count, best value or result across loop iterations.', ['for_loop']),
  s('early_return', 'early return', 'Python foundations', 'Return from inside a loop as soon as the answer is known.', ['for_loop', 'functions']),
  s('functions', 'functions', 'Python foundations', 'Define a function with def, take parameters, and return a value.'),
  s('while_loop', 'while loop', 'Python foundations', 'Repeat while a condition holds; make progress each iteration so it ends.', ['conditionals']),
  s('tuples', 'tuples & unpacking', 'Python foundations', 'Create tuples and unpack them: a, b = pair.'),
  s('list_comprehension', 'list comprehension', 'Python foundations', 'Build a list in one expression: [f(x) for x in seq if cond].', ['for_loop']),

  // Hashing
  s('set_create', 'set creation', 'Hashing', 'Create an empty set with set() and a set from an iterable.'),
  s('set_add', 'set.add', 'Hashing', 'Insert into a set with .add(x); duplicates are ignored.', ['set_create']),
  s('set_membership', 'set membership', 'Hashing', 'Test x in s in O(1) average time.', ['set_create']),
  s('dict_create', 'dict creation', 'Hashing', 'Create an empty dict with {} and a dict literal with key: value pairs.'),
  s('dict_assign', 'dict assignment', 'Hashing', 'Store or overwrite a value with d[key] = value.', ['dict_create']),
  s('dict_lookup', 'dict lookup', 'Hashing', 'Read d[key]; a missing key raises KeyError.', ['dict_create']),
  s('dict_membership', 'dict membership', 'Hashing', 'Check key in d (checks keys, not values).', ['dict_create']),
  s('dict_get', 'dict.get', 'Hashing', 'Read with a default: d.get(key, default) never raises.', ['dict_lookup']),
  s('dict_items', 'iterating dicts', 'Hashing', 'Loop over keys, .values() and .items() pairs.', ['dict_create', 'for_loop']),
  s('frequency_map', 'frequency map', 'Hashing', 'Count occurrences: counts[x] = counts.get(x, 0) + 1.', ['dict_get', 'for_loop']),
  s('index_map', 'index map', 'Hashing', 'Map value → index while scanning: seen[num] = i.', ['dict_assign', 'enumerate']),
  s('complement', 'complement arithmetic', 'Hashing', 'Compute what is still needed: complement = target - num.'),
  s('hash_reasoning', 'hash map reasoning', 'Hashing', 'Trade O(n) space for O(1) lookups to replace a nested loop.', ['dict_membership', 'set_membership']),
  s('grouping_key', 'grouping by a key', 'Hashing', 'Build a hashable key for each item (a sorted string, a tuple) and collect items under it in a dict of lists.', ['dict_get', 'list_append']),
  s('sequence_start', 'run starts', 'Hashing', 'Spot where a run begins (x - 1 is not in the set) and extend it with a while loop, so each value is visited once.', ['set_membership', 'while_loop']),
  s('prefix_suffix', 'prefix & suffix passes', 'Hashing', 'Fill out[i] with a summary of everything before i in one pass, then fold in everything after i in a second pass from the right.', ['accumulator', 'list_index']),

  // Strings & pointers
  s('string_index', 'string indexing', 'Strings & pointers', 'Read characters with s[i] and s[-1]; strings are immutable.', ['list_index']),
  s('string_iterate', 'string iteration', 'Strings & pointers', 'Loop over characters with for ch in s.', ['for_loop']),
  s('string_methods', 'string methods', 'Strings & pointers', 'Use .lower(), .isalnum(), .split(), .join() and friends.'),
  s('slicing', 'slicing', 'Strings & pointers', 'Take s[a:b], s[:k], s[k:], s[::-1]; the end index is excluded.', ['string_index']),
  s('two_pointer', 'two pointers', 'Strings & pointers', 'Move left/right indexes toward each other (or together) to scan in O(n).', ['while_loop', 'list_index']),
  s('pointer_update', 'pointer updates', 'Strings & pointers', 'Advance exactly one pointer per step based on a comparison.', ['two_pointer']),
  s('state_tracking', 'running state', 'Strings & pointers', 'Track the best-so-far / min-so-far while scanning once.', ['accumulator']),
  s('string_framing', 'length-prefixed strings', 'Strings & pointers', 'Join strings so they can be split again whatever they contain: write each length, a marker, then the text; read the length and slice.', ['string_methods', 'slicing']),
  s('sorted_dedupe', 'skipping duplicates', 'Strings & pointers', 'In sorted input, step past equal neighbours so each answer is produced once.', ['two_pointer']),
  s('expand_center', 'expand around a center', 'Strings & pointers', 'Grow left and right from a middle while the two ends match; try both an odd and an even center.', ['two_pointer', 'string_index']),

  // Windows & stacks
  s('sliding_window', 'sliding window', 'Windows & stacks', 'Grow the right edge, shrink the left edge while the window is invalid.', ['two_pointer']),
  s('window_state', 'window state', 'Windows & stacks', 'Keep a set or map of what is inside the window, updated on both edges.', ['sliding_window', 'set_add']),
  s('window_counts', 'window validity by counts', 'Windows & stacks', 'Decide whether a window is valid from its counts: length minus the most frequent, or how many needed characters are satisfied.', ['window_state', 'frequency_map']),
  s('stack_push_pop', 'stack append/pop', 'Windows & stacks', 'Use a list as a stack: .append() pushes, .pop() removes the top.', ['list_append']),
  s('matching_pairs', 'matching pairs', 'Windows & stacks', 'Map closers to openers and check the stack top on each closer.', ['stack_push_pop', 'dict_lookup']),

  // Search & linked lists
  s('binary_search', 'binary search', 'Search & linked lists', 'Halve a sorted search space each step: lo, hi, mid.', ['while_loop', 'list_index']),
  s('mid_calc', 'mid calculation', 'Search & linked lists', 'Compute mid = (lo + hi) // 2 and move lo = mid + 1 or hi = mid - 1.', ['while_loop']),
  s('search_invariant', 'search invariant', 'Search & linked lists', 'Know what is true about lo/hi on every iteration and when the loop stops.', ['binary_search']),
  s('rotated_search', 'rotated-array search', 'Search & linked lists', 'Compare mid with one end to tell which half is sorted, then keep the half that can still hold the answer.', ['search_invariant']),
  s('listnode', 'ListNode', 'Search & linked lists', 'A node holding val and next; None ends the list.'),
  s('linked_list_traversal', 'linked list traversal', 'Search & linked lists', 'Walk a list with while node: ... node = node.next.', ['listnode', 'while_loop']),
  s('linked_list_reassignment', 'pointer reassignment', 'Search & linked lists', 'Rewire .next safely using a temporary variable.', ['linked_list_traversal']),
  s('dummy_node', 'dummy head', 'Search & linked lists', 'Start a result list with a dummy node to avoid head special-cases.', ['listnode']),
  s('fast_slow', 'fast & slow pointers', 'Search & linked lists', 'Advance one pointer two steps and one pointer one step (or one pointer n ahead) to find a cycle, the middle or the n-th from the end.', ['linked_list_traversal']),

  // Recursion & trees
  s('recursion_base_case', 'base case', 'Recursion & trees', 'Stop recursion at the smallest input (often None or 0).', ['functions']),
  s('recursion_return', 'recursive return', 'Recursion & trees', 'Combine the results of recursive calls into this call’s return value.', ['recursion_base_case']),
  s('treenode', 'TreeNode', 'Recursion & trees', 'A node with val, left and right children.'),
  s('tree_dfs', 'tree DFS', 'Recursion & trees', 'Visit a tree depth-first recursively: handle None, recurse left and right.', ['recursion_base_case', 'treenode']),
  s('bst_property', 'BST ordering', 'Recursion & trees', 'Use left < node < right for every subtree: go one way only, or carry low and high bounds down.', ['tree_dfs']),
  s('tree_inorder', 'in-order traversal', 'Recursion & trees', 'Visit left, node, right; on a BST that yields the values in sorted order.', ['tree_dfs']),
  s('tree_build', 'building a tree from traversals', 'Recursion & trees', 'Take the root from preorder, find it in inorder, and build the left and right subtrees from the two halves.', ['tree_dfs', 'slicing']),
  s('tree_global_best', 'return one thing, record another', 'Recursion & trees', 'Return what a parent can use (one downward path) while updating a best answer that may bend through this node.', ['recursion_return', 'state_tracking']),
  s('trie_node', 'trie node & insert', 'Recursion & trees', 'A node holds a dict of children and an end flag; insert walks the word, creating one child per missing character.', ['dict_membership', 'string_iterate']),
  s('trie_search', 'trie search & prefixes', 'Recursion & trees', 'Walk a word character by character; fail on a missing child, and tell a whole word (end flag) from a prefix.', ['trie_node']),
  s('trie_wildcard', 'trie search with a wildcard', 'Recursion & trees', 'On a wildcard, try every child recursively from the next position.', ['trie_search', 'recursion_base_case']),

  // BFS & grids
  s('queue_deque', 'collections.deque', 'BFS & grids', 'Use deque for O(1) append and popleft as a FIFO queue.', ['list_append']),
  s('bfs', 'BFS', 'BFS & grids', 'Process nodes level by level with a queue; mark visited when enqueuing.', ['queue_deque']),
  s('bfs_levels', 'BFS by level', 'BFS & grids', 'Snapshot len(queue) to process exactly one level per outer loop.', ['bfs']),
  s('grid_nested', 'nested lists / grids', 'BFS & grids', 'Index grid[r][c], get rows = len(grid), cols = len(grid[0]).', ['list_index']),
  s('grid_neighbors', 'neighbors & bounds', 'BFS & grids', 'Generate up/down/left/right with a directions list and bounds-check.', ['grid_nested', 'tuples']),
  s('visited_set', 'visited set', 'BFS & grids', 'Track visited cells/nodes in a set to avoid revisiting.', ['set_add', 'set_membership']),
  s('border_reach', 'reaching inward from the borders', 'BFS & grids', 'Start the traversal from every border cell and walk in reverse, instead of testing each cell separately.', ['grid_neighbors', 'visited_set']),
  s('matrix_transform', 'transpose & reverse in place', 'BFS & grids', 'Swap matrix[r][c] with matrix[c][r] above the diagonal, and reverse rows, without a second matrix.', ['grid_nested']),
  s('matrix_layers', 'walking the boundaries', 'BFS & grids', 'Keep top, bottom, left and right bounds, walk one edge at a time, and shrink the bound just walked.', ['grid_nested', 'while_loop']),
  s('matrix_marking', 'mark first, change after', 'BFS & grids', 'Record which rows and columns must change before changing any cell, so new values are never mistaken for original ones.', ['grid_nested']),

  // Graphs
  s('graph_adjacency', 'adjacency list', 'Graphs', 'Build a dict of lists from an edge list (both directions if undirected).', ['dict_get', 'list_append']),
  s('graph_dfs', 'graph DFS', 'Graphs', 'Recursive or stack-based DFS over an adjacency list with a visited set.', ['graph_adjacency', 'visited_set']),
  s('graph_bfs', 'graph BFS', 'Graphs', 'Queue-based BFS over an adjacency list.', ['graph_adjacency', 'bfs']),
  s('connected_components', 'connected components', 'Graphs', 'Count components by starting a traversal from each unvisited node.', ['graph_dfs']),
  s('cycle_detection', 'cycle detection', 'Graphs', 'Detect cycles in a directed graph with visiting/visited states (or in-degrees).', ['graph_dfs']),
  s('graph_clone', 'copying a graph', 'Graphs', 'Keep a dict from each original node to its copy: create the copy on first visit, then wire neighbours through the dict.', ['graph_dfs', 'dict_membership']),
  s('graph_tree_check', 'is this graph a tree', 'Graphs', 'n nodes form a tree exactly when there are n - 1 edges and a traversal from one node reaches all of them.', ['connected_components']),

  // Heaps, sorting & intervals
  s('sorting', 'sorted / .sort', 'Heaps, sorting & intervals', 'Sort with sorted(seq) or seq.sort(); reverse=True for descending.'),
  s('sort_key', 'custom sort keys', 'Heaps, sorting & intervals', 'Sort by a derived value with key=lambda x: ...', ['sorting']),
  s('heap_push_pop', 'heapq push/pop', 'Heaps, sorting & intervals', 'heapq.heappush / heappop on a list: a min-heap.', ['list_append']),
  s('top_k', 'top-k with a heap', 'Heaps, sorting & intervals', 'Keep a size-k min-heap so the root is the k-th largest.', ['heap_push_pop']),
  s('interval_overlap', 'interval overlap', 'Heaps, sorting & intervals', 'Two sorted intervals overlap when next.start <= current.end.', ['sorting']),
  s('interval_insert', 'three-phase interval scan', 'Heaps, sorting & intervals', 'Copy the intervals that end before the new one, merge the ones that overlap it, then copy the rest.', ['interval_overlap']),
  s('interval_greedy', 'greedy by end time', 'Heaps, sorting & intervals', 'Sort by end and keep an interval only if it starts at or after the last kept end.', ['interval_overlap', 'sort_key']),
  s('min_rooms', 'rooms from end times', 'Heaps, sorting & intervals', 'Keep a min-heap of end times; reuse the earliest-ending room when it is free, else add one.', ['heap_push_pop', 'interval_overlap']),

  // Backtracking & DP
  s('backtracking_state', 'backtracking state', 'Backtracking & DP', 'Choose, recurse, un-choose: path.append(x); dfs(); path.pop().', ['recursion_base_case', 'stack_push_pop']),
  s('memoization', 'memoization', 'Backtracking & DP', 'Cache results of a recursive function in a dict (or @cache).', ['recursion_return', 'dict_get']),
  s('recurrence', 'recurrence reasoning', 'Backtracking & DP', 'Express an answer in terms of smaller answers, e.g. f(n) = f(n-1) + f(n-2).', ['recursion_return']),
  s('dp_table', 'bottom-up DP', 'Backtracking & DP', 'Fill a list where dp[i] depends on earlier entries.', ['recurrence', 'list_index']),
  s('combination_start', 'start index & reuse', 'Backtracking & DP', 'Pass a start index so choices never go backwards; pass i to reuse an item, i + 1 to use it once.', ['backtracking_state']),
  s('grid_backtracking', 'mark, explore, unmark on a grid', 'Backtracking & DP', 'Mark a cell as used, try its neighbours for the next step, and unmark it on the way back.', ['backtracking_state', 'grid_neighbors']),
  s('kadane', 'best ending here', 'Backtracking & DP', 'Carry the best sum ending at this index: extend the run or start fresh, and track the best seen.', ['state_tracking']),
  s('greedy_reach', 'farthest reach', 'Backtracking & DP', 'Scan once keeping the farthest index reachable so far; fail when the scan passes it.', ['state_tracking']),
  s('circular_split', 'a circle as two lines', 'Backtracking & DP', 'When first and last cannot both be used, solve the line without the first and the line without the last, and take the better.', ['dp_table', 'slicing']),
  s('dp_min_choice', 'min over choices', 'Backtracking & DP', 'dp[a] = 1 + the smallest dp[a - c] over every choice c, with infinity standing for unreachable.', ['dp_table']),
  s('dp_lookback', 'looking back at every earlier index', 'Backtracking & DP', 'dp[i] depends on every j < i that satisfies a condition, not just the previous one or two.', ['dp_table']),
  s('dp_prefix_words', 'DP over string prefixes', 'Backtracking & DP', 'dp[i] says whether (or how many ways) the first i characters can be split, built from earlier dp[j] and the piece s[j:i].', ['dp_table', 'slicing']),
  s('dp_grid', '2-D DP table', 'Backtracking & DP', 'Fill a table row by row where each cell depends on the cell above and the cell to the left.', ['dp_table', 'grid_nested']),
  s('dp_two_sequences', 'DP over two sequences', 'Backtracking & DP', 'dp[i][j] answers the question for the first i items of one sequence and the first j of the other.', ['dp_grid']),

  // Interview craft
  s('complexity', 'complexity analysis', 'Interview craft', 'State time and space in Big-O and justify them from the code.'),
  s('edge_cases', 'edge cases', 'Interview craft', 'Name and handle empty input, single element, duplicates, negatives.'),
  s('explanation', 'verbal reasoning', 'Interview craft', 'Explain the approach, the invariant and the trade-off clearly before coding.'),
]

export const SKILL_BY_ID: Record<SkillId, Skill> = Object.fromEntries(SKILLS.map((k) => [k.id, k]))

export const SKILL_GROUPS: SkillGroup[] = [
  'Python foundations',
  'Hashing',
  'Strings & pointers',
  'Windows & stacks',
  'Search & linked lists',
  'Recursion & trees',
  'BFS & grids',
  'Graphs',
  'Heaps, sorting & intervals',
  'Backtracking & DP',
  'Interview craft',
]

export function skillName(id: SkillId): string {
  return SKILL_BY_ID[id]?.name ?? id
}
