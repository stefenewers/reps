import type { Lab } from '@/data/course/types'

/**
 * Labs for Weeks 3–8 (REPS_2_MASTER_SPEC.md §9, §17, §34, §48).
 * DESIGN → BUILD → REVIEW → CHANGE REQUEST. Exercises live in
 * data/exercises/course/labs-w3w8.ts as `<id>-build` and `<id>-change`.
 */
export const labs: Lab[] = [
  // ── Week 3 ──────────────────────────────────────────────────────────────
  {
    id: 'lab-trend-analyzer',
    title: 'Trend Analyzer',
    week: 3,
    unitId: 'w3-running-prefix',
    brief:
      'A growth dashboard shows one number per day. The team wants the best and worst so far, the longest run of rising days, and fast totals for any range of days. You build the small engine behind those widgets.',
    requirements: [
      '`running_best(values)` and `running_worst(values)` return one item per day: the highest or lowest value so far.',
      '`longest_rise(values)` returns the longest run of days that each beat the day before. An equal day is not a rise.',
      '`prefix_totals(values)` returns the running totals with a 0 in front, so it has one more item than `values`.',
      '`range_totals(values, queries)` answers each `(start, end)` query, both ends included, with one subtraction.',
      'Every function makes one pass over `values`. An empty list is valid input.',
      'No function changes `values`.',
    ],
    designQuestions: [
      'Inputs: what does each function receive, and which inputs are allowed to be empty?',
      'Outputs: how long is each returned list, and why does `prefix_totals` have one extra item?',
      'State: what one variable does each running function carry from day to day, and what is it before day 0?',
      'Components: which function does `range_totals` reuse, and how many times is it called per batch of queries?',
      'Data flow: write out `prefix_totals([2, 3, 5])` and show how the query `(1, 2)` becomes one subtraction.',
      'Failure modes: what happens with a negative value, or a query where `start` equals `end`?',
      'Validation: which three test inputs would catch an off-by-one in `range_totals`?',
      'Tradeoffs: when is it worth storing prefix totals instead of summing each range directly?',
    ],
    buildExerciseId: 'lab-trend-analyzer-build',
    changeRequest: {
      title: 'Missing days',
      description:
        'The sensor sometimes misses a day, recorded as None. Running best and worst skip missing days, a missing day ends a rise streak, and a missing day counts as 0 in totals.',
      exerciseId: 'lab-trend-analyzer-change',
    },
    review: [
      'Every function is one pass; `range_totals` builds the totals once, not once per query.',
      'The empty list and a single day both work without special-case crashes.',
      'The streak resets to 1 on a day that does not beat the one before, not to 0.',
      'Names say what they hold (`best`, `run`, `prefix`), not `x` or `temp`.',
      'After the change request, the old tests still pass unchanged.',
    ],
  },
  {
    id: 'lab-sorted-match',
    title: 'Sorted Match Engine',
    week: 3,
    unitId: 'w3-two-pointers',
    brief:
      'A small marketplace keeps buy prices and sell prices in two sorted lists. You build the engine that merges the books, finds shared prices, and matches buyers to sellers in one walk.',
    requirements: [
      '`merge_prices(a, b)` returns one sorted list with every price from both lists, duplicates kept.',
      '`shared_prices(a, b)` returns the prices found in both lists, each once, low to high.',
      '`match_orders(buys, sells)` pairs a buy with a sell when the sell price is at most the buy price.',
      'When a buy is too low for the cheapest sell left, the engine skips that buy.',
      'Each function walks both lists once, in O(n + m) time, and never calls `sort`.',
      'Empty lists are valid input and give empty results.',
    ],
    designQuestions: [
      'Inputs: what does "sorted low to high" let you assume about the next item in each list?',
      'Outputs: what shape is each result (list of prices, list of pairs), and what order is it in?',
      'State: what do the two indexes `i` and `j` mean at any moment?',
      'Components: which loop shape do all three functions share, and where do they differ?',
      'Data flow: trace `match_orders([5, 8, 10], [6, 7, 12])` one step at a time.',
      'Failure modes: why is it safe to skip a buy that cannot afford the cheapest sell left?',
      'Validation: which inputs check duplicates in `shared_prices` and leftovers in `merge_prices`?',
      'Tradeoffs: what would a nested loop cost here, and what does sorted input buy you?',
    ],
    buildExerciseId: 'lab-sorted-match-build',
    changeRequest: {
      title: 'Quantities and partial fills',
      description:
        'Orders now carry a quantity as (price, quantity) pairs. Add fill_orders and total_filled: a fill trades the smaller quantity left, and an order is only passed once it is used up.',
      exerciseId: 'lab-sorted-match-change',
    },
    review: [
      'Exactly one index moves per step, or both on a match; there is no step that moves neither.',
      'The leftover tail of a list is handled after the main loop in `merge_prices`.',
      'Duplicates in `shared_prices` are skipped without a set.',
      'The change request does not modify the caller\'s lists; remaining quantities live in local state.',
      'Old `match_orders` behaviour is unchanged after adding quantities.',
    ],
  },

  // ── Week 4 ──────────────────────────────────────────────────────────────
  {
    id: 'lab-activity-window',
    title: 'Activity Window Analyzer',
    week: 4,
    unitId: 'w4-windows',
    brief:
      'An on-call engineer wants to know when a server was busiest and how long it stayed quiet. You turn raw request minutes into per-minute counts, then answer both questions in one pass each.',
    requirements: [
      '`per_minute(times, n)` returns `n` counts and ignores times outside 0 to `n - 1`.',
      '`busiest_window(counts, k)` returns `(start, total)` for the `k` minutes in a row with the most events; ties go to the earliest start.',
      '`longest_quiet(counts, limit)` returns the length of the longest run of minutes whose total is at most `limit`.',
      'Both window functions make one pass and update a running total; they never re-add a whole window.',
      '`longest_quiet` returns 0 when every single minute is over the limit.',
      'Counts are never negative and `k` is between 1 and `len(counts)`.',
    ],
    designQuestions: [
      'Inputs: why convert timestamps to per-minute counts first, and what does that cost in memory?',
      'Outputs: why does `busiest_window` return the start as well as the total?',
      'State: what does the window hold in each function, and when does each edge move?',
      'Components: which function has a fixed-size window and which grows and shrinks? Why?',
      'Data flow: trace `longest_quiet([1, 0, 2, 0, 0, 1], 1)` showing left, right and total.',
      'Failure modes: what goes wrong if the tie rule uses `>=` instead of `>`?',
      'Validation: which tests cover a minute that alone breaks the limit, and a limit of 0?',
      'Tradeoffs: when would you keep the raw times instead of per-minute counts?',
    ],
    buildExerciseId: 'lab-activity-window-build',
    changeRequest: {
      title: 'Unique visitors',
      description:
        'Each event is now a (minute, user) pair. per_minute accepts either form, and a new busiest_unique(events, k) returns the most different users seen in any k minutes in a row.',
      exerciseId: 'lab-activity-window-change',
    },
    review: [
      'Each window function is O(n): the left edge only ever moves forward.',
      'The tie rule is tested and matches the requirement (earliest start).',
      'A per-user count reaching 0 is removed so `len` gives distinct users.',
      'Old plain-minute input to `per_minute` still works after the change.',
      'No window sum is recomputed with `sum(...)` inside the loop.',
    ],
  },
  {
    id: 'lab-undo-redo',
    title: 'Editor Undo/Redo Engine',
    week: 4,
    unitId: 'w4-stacks',
    brief:
      'A note-taking app needs undo and redo. You build the engine that replays a list of type, delete, undo and redo commands and reports the text after each one.',
    requirements: [
      "`apply(text, command)` handles `'type <text>'` (spaces kept) and `'delete n'` (never below empty).",
      "`'undo'` restores the text before the last change that is not undone yet; `'redo'` brings back the last undone change.",
      'A new type or delete clears everything that could be redone.',
      'Undo or redo with nothing available does nothing and does not crash.',
      '`snapshots(commands)` returns the text after every command; `run_editor(commands)` returns the final text.',
      'Each command is O(1) stack work plus the cost of building the new text.',
    ],
    designQuestions: [
      'Inputs: how do you split a command into its action and its argument, keeping spaces in typed text?',
      'Outputs: why is `snapshots` useful for testing even if the app only shows the final text?',
      'State: what do the undo and redo stacks hold — whole texts or the edits — and why did you choose that?',
      'Components: which function does the real editing, and which one only manages history?',
      'Data flow: trace `type a`, `type b`, `undo`, `type c`, `redo` through both stacks.',
      'Failure modes: what happens on `undo` with an empty stack, or `delete 99` on a short text?',
      'Validation: which test proves a new edit clears the redo stack?',
      'Tradeoffs: storing whole texts is simple; what does it cost for a long document?',
    ],
    buildExerciseId: 'lab-undo-redo-build',
    changeRequest: {
      title: 'Undo several steps and clear',
      description:
        "'undo 3' and 'redo 2' repeat up to that many times, stopping early when nothing is left. A new 'clear' command empties the document and can be undone like any change.",
      exerciseId: 'lab-undo-redo-change',
    },
    review: [
      'Undo moves the current text onto the redo stack before restoring; redo does the reverse.',
      'Only real edits push onto the undo stack and clear redo; undo and redo never do.',
      'Empty-stack undo and redo are no-ops, covered by tests.',
      '`run_editor` reuses `snapshots` instead of duplicating the loop.',
      'After the change request, a plain `undo` still means one step.',
    ],
  },

  // ── Week 5 ──────────────────────────────────────────────────────────────
  {
    id: 'lab-product-catalog',
    title: 'Searchable Product Catalog',
    week: 5,
    unitId: 'w5-binary-search',
    brief:
      'An online shop keeps a catalog of (price, name) pairs sorted by price. Shoppers filter by budget and by price range, and the catalog is too big to scan. You build the search layer.',
    requirements: [
      '`first_at_least(products, budget)` returns the first index priced at or above `budget`, or `len(products)`.',
      '`last_at_most(products, budget)` returns the last index priced at or below `budget`, or -1.',
      '`count_in_range(products, low, high)` counts prices from `low` to `high` inclusive and returns 0 when `low > high`.',
      '`affordable(products, budget)` returns names at or below `budget`, cheapest first.',
      'Every search is O(log n); only `affordable` may copy the matching slice.',
      'Equal prices are handled: "first" and "last" mean the edges of a run of equal prices.',
    ],
    designQuestions: [
      'Inputs: what does sorted by price guarantee, and what does it not guarantee about names?',
      'Outputs: why return an index rather than a product, and what does `len(products)` mean as an answer?',
      'State: what is true about everything left of `lo` and right of `hi` at every step?',
      'Components: which one or two search helpers can every other function be built from?',
      'Data flow: show how `count_in_range` becomes the difference of two searches.',
      'Failure modes: what happens with an empty catalog, a budget below every price, or above every price?',
      'Validation: which tests prove the search lands on the edge of a run of equal prices?',
      'Tradeoffs: when is a linear scan good enough, and when does the O(log n) search matter?',
    ],
    buildExerciseId: 'lab-product-catalog-build',
    changeRequest: {
      title: 'New arrivals',
      description:
        'New products arrive during the day. add_product inserts in place after any equal prices and returns the index; cheapest_at_least returns the cheapest name at or above a budget, or None.',
      exerciseId: 'lab-product-catalog-change',
    },
    review: [
      'The loop always shrinks the range: `lo = mid + 1` or `hi = mid`, never `hi = mid - 1` by accident.',
      'Both searches are written once and reused, not copied into each function.',
      'The empty catalog and out-of-range budgets are tested.',
      'The change request inserts without calling `sort`.',
      'You can state the loop invariant in one sentence.',
    ],
  },
  {
    id: 'lab-playlist',
    title: 'Playlist Editor',
    week: 5,
    unitId: 'w5-linked-lists',
    brief:
      'A music app stores each playlist as a linked list of song titles. You build the editor operations by rewiring nodes: add, remove, find, and reverse a section of the playlist.',
    requirements: [
      '`add_song(head, title)` appends and works on an empty playlist.',
      '`remove_song(head, title)` removes only the first match, including when it is the head; a missing title changes nothing.',
      '`position_of(head, title)` returns the 1-based position of the first match, or -1.',
      '`reverse_range(head, left, right)` reverses positions `left` to `right` inclusive and returns the head.',
      '`reverse_range` reverses to the end when `right` is past it, and changes nothing when `left` is past it.',
      'Operations rewire existing nodes; they do not copy titles into a Python list or build new nodes for old songs.',
    ],
    designQuestions: [
      'Inputs: what does `head` stand for, and what is the empty playlist?',
      'Outputs: why does every editing function return the head?',
      'State: which references (`prev`, `cur`, `nxt`, `before`) must you save before you change a `.next`?',
      'Components: where does a dummy node remove a special case, and where is it not needed?',
      'Data flow: draw the arrows for `reverse_range` on a, b, c, d, e from 2 to 4, before and after.',
      'Failure modes: which line, if done in the wrong order, loses the rest of the playlist?',
      'Validation: which tests cover removing the head, a missing title, and a range at the very start?',
      'Tradeoffs: what does a linked list make cheap here compared with a Python list, and what does it make slow?',
    ],
    buildExerciseId: 'lab-playlist-build',
    changeRequest: {
      title: 'Move a song',
      description:
        'Users want to drag a song. move_song(head, title, position) unlinks the first song with that title and relinks the same node so it becomes song number position; past the end means last.',
      exerciseId: 'lab-playlist-change',
    },
    review: [
      'Every `.next` change saves what it still needs first.',
      'The head can change (remove, reverse from 1, move to 1) and the returned head is correct.',
      'A dummy node is used where it removes a head special case.',
      'Tests check identity (`is`) for the rewired nodes, not just the titles.',
      'Each operation is O(n) with O(1) extra memory.',
    ],
  },

  // ── Week 6 ──────────────────────────────────────────────────────────────
  {
    id: 'lab-route-walker',
    title: 'Loop Detector / Route Walker',
    week: 6,
    unitId: 'w6-fast-slow',
    brief:
      'A transit app stores its map as "next stop" links. A typo in the data can send a route round forever. You build the walker that lists a route, detects loops with constant memory, and finds the middle stop.',
    requirements: [
      '`route(next_stop, start)` lists stops in order and stops before a repeat or at the end of the line.',
      'A stop that maps to `None`, or is not a key at all, ends the line.',
      '`has_loop(next_stop, start)` detects a loop with O(1) extra memory (no set of visited stops).',
      '`middle_stop(next_stop, start)` returns the middle of a loop-free route; with two middles, the second.',
      '`last_stop(next_stop, start)` returns the final stop, or `None` if the route loops.',
      'No function loops forever on any input.',
    ],
    designQuestions: [
      'Inputs: how is a dict of next stops the same shape as a linked list?',
      'Outputs: why does `last_stop` need to know about loops before it walks?',
      'State: where are the slow and fast walkers after each step, and what does it mean when they meet?',
      'Components: which functions share the same walking loop, and can they share code?',
      'Data flow: trace slow and fast on A → B → C → D → B until they meet.',
      'Failure modes: which `.get` calls protect you from a missing key, and what breaks without them?',
      'Validation: which tests cover a self-loop, a one-stop route and a start that is not in the map?',
      'Tradeoffs: `route` uses a set and `has_loop` does not. When is each choice right?',
    ],
    buildExerciseId: 'lab-route-walker-build',
    changeRequest: {
      title: 'Where the loop starts',
      description:
        'The map team needs to fix loops. loop_info(next_stop, start) returns (first stop on the loop, number of stops in the loop), or None if the route ends, still with O(1) extra memory.',
      exerciseId: 'lab-route-walker-change',
    },
    review: [
      'The fast walker checks the next link before taking two steps.',
      '`middle_stop` gives the second middle on an even route, and that is tested.',
      'No function can run forever on a looping map.',
      '`has_loop` and `loop_info` keep O(1) extra memory.',
      'The change request reuses the meeting point instead of starting over with a set.',
    ],
  },
  {
    id: 'lab-nested-analyzer',
    title: 'Nested Structure Analyzer',
    week: 6,
    unitId: 'w6-recursion',
    brief:
      'A backup tool describes a folder as nested dicts: a file is a name mapped to its size, and a folder is a name mapped to another dict. You build the analyzer that totals, counts, measures and lists it.',
    requirements: [
      '`total_size(folder)` adds up every file at any depth.',
      '`count_files(folder)` counts files at any depth; an empty folder has none.',
      '`max_depth(folder)` counts folder levels, with the top folder as level 1 even when it is empty.',
      "`list_files(folder)` returns every file path joined with `/`, like `'src/util/io.py'`, sorted.",
      'Each function is recursive: it handles its own level and asks a smaller call about each subfolder.',
      'No function changes the folder it is given.',
    ],
    designQuestions: [
      'Inputs: how do you tell a file from a folder, and why `isinstance(item, dict)`?',
      'Outputs: what does each function promise to return for any folder, including an empty one?',
      'State: what does each call own locally, and what does it get back from its subcalls?',
      'Components: what is the base case for each function? Is it a special `if`, or does the loop just not run?',
      'Data flow: trace `max_depth` on a folder with one subfolder that holds one empty folder.',
      'Failure modes: what happens if a call forgets to return, or returns before checking every item?',
      'Validation: which tests cover empty folders, deep nesting and files at the top level?',
      'Tradeoffs: `list_files` builds paths as it goes down. What is the alternative, and what does it cost?',
    ],
    buildExerciseId: 'lab-nested-analyzer-build',
    changeRequest: {
      title: 'Big folders',
      description:
        'The tool must warn about big folders. folder_sizes returns every folder path (not the top one) with its total size in one walk, and folders_over returns the sorted paths above a limit.',
      exerciseId: 'lab-nested-analyzer-change',
    },
    review: [
      'Every recursive call is used: its return value goes into the answer.',
      'Each function makes progress: every call is on a smaller folder.',
      'Empty folders are handled by the loop not running, not by extra special cases.',
      '`folder_sizes` visits each file once instead of calling `total_size` per folder.',
      'You can say in one sentence what each function returns for any folder.',
    ],
  },

  // ── Week 7 ──────────────────────────────────────────────────────────────
  {
    id: 'lab-org-hierarchy',
    title: 'Organization Hierarchy Analyzer',
    week: 7,
    unitId: 'w7-trees',
    brief:
      'HR keeps the company as a tree of Employee objects, each with a name, a salary and a list of direct reports. You build the analyzer behind the org-chart page: team size, depth, payroll and top earner.',
    requirements: [
      "A person's team is that person plus everyone below them, at any depth.",
      '`team_size(boss)` counts the team, boss included.',
      '`levels(boss)` returns the number of levels; a boss with no reports is 1.',
      '`payroll(boss)` returns the total salary of the team.',
      '`top_earner(boss)` returns the highest-paid name; ties go to the first met, boss first, then reports in list order.',
      'Each function visits every person once and does not change the tree.',
    ],
    designQuestions: [
      'Inputs: what does an `Employee` hold, and what is a leaf in this tree?',
      'Outputs: for any employee, what does each function promise about the team rooted there?',
      'State: what does each call combine from its reports, and what does it add for itself?',
      'Components: `top_earner` returns a name, but its helper returns what? Why?',
      'Data flow: trace `levels` on Ana → Cal → Fay → Gus and show the value each call returns.',
      'Failure modes: where does a `>=` instead of `>` break the tie rule?',
      'Validation: which tests cover a lone employee, a wide flat team and a top earner deep in the tree?',
      'Tradeoffs: could one walk compute all four answers at once? Would that be clearer or not?',
    ],
    buildExerciseId: 'lab-org-hierarchy-build',
    changeRequest: {
      title: 'Chain of command',
      description:
        'HR wants to see who someone reports to. chain_of_command(boss, name) returns the names from boss down to that person, or [] if they are not in the team.',
      exerciseId: 'lab-org-hierarchy-change',
    },
    review: [
      'Each function states its contract for any node, and the code matches it.',
      'There is no special case for "no reports": the loop or `sum` over an empty list handles it.',
      'The tie rule for `top_earner` is tested.',
      '`chain_of_command` stops searching once it finds the person.',
      'The given `Employee` and `build_org` are unchanged.',
    ],
  },
  {
    id: 'lab-category-tree',
    title: 'Searchable Category Tree',
    week: 7,
    unitId: 'w7-bst',
    brief:
      'A store files its category ids in a binary search tree. Staff add ids, check whether one exists, and list every id in a range. You build the tree operations so each search walks one path, not the whole tree.',
    requirements: [
      '`insert(root, key)` places a new id by the BST rule and ignores duplicates; it returns the root.',
      '`build_catalog(keys)` inserts keys in order into an empty tree.',
      '`contains(root, key)` walks a single path from the root.',
      '`in_range(root, low, high)` returns ids from `low` to `high` inclusive, smallest first.',
      '`in_range` skips any subtree that cannot hold an id in range.',
      'An empty tree (`None`) is valid input everywhere.',
    ],
    designQuestions: [
      'Inputs: what is true of every id in the left subtree of a node, and in the right?',
      'Outputs: why does `insert` return the root, even when the root does not change?',
      'State: in `contains`, what does each step rule out?',
      'Components: which functions are best as a loop and which as recursion?',
      'Data flow: trace `in_range` on 50, 30, 70, 20, 40, 60, 80 for 35 to 65. Which nodes are skipped?',
      'Failure modes: what shape does the tree take if keys arrive already sorted, and what does that cost?',
      'Validation: which tests cover duplicates, a one-id range and a range outside every id?',
      'Tradeoffs: when is a sorted Python list with binary search simpler than this tree?',
    ],
    buildExerciseId: 'lab-category-tree-build',
    changeRequest: {
      title: 'Nearest id',
      description:
        'A typed id often does not exist. at_or_below returns the largest id at most key and at_or_above returns the smallest id at least key, each walking one path, or None.',
      exerciseId: 'lab-category-tree-change',
    },
    review: [
      '`contains` and the change-request searches visit one node per level.',
      '`in_range` comes out sorted because it visits left, node, right.',
      'Subtrees outside the range are not entered.',
      'Duplicates and the empty tree are tested.',
      'You can explain why the tree is fast when balanced and slow when keys arrive sorted.',
    ],
  },

  // ── Week 8 ──────────────────────────────────────────────────────────────
  {
    id: 'lab-evacuation-map',
    title: 'Building Evacuation Map',
    week: 8,
    unitId: 'w8-grids',
    brief:
      'Facilities wants an evacuation sign in every room showing how far the nearest exit is. The floor plan is a grid of rooms, walls and exits. You compute the distances and flag the rooms with no way out.',
    requirements: [
      "The grid is a list of strings: `'E'` exit, `'#'` wall, `'.'` room. Moves are up, down, left, right.",
      '`find_exits(grid)` lists every exit as `(row, col)`, top row first.',
      '`steps_to_exit(grid)` returns steps to the nearest exit: 0 for exits, `None` for walls, -1 for rooms with no way out.',
      '`trapped_rooms(grid)` lists rooms with no way out, top row first.',
      '`longest_escape(grid)` returns the most steps any room needs, or 0 if no room can get out.',
      'The search starts from every exit at once and visits each cell once: O(rows × cols).',
    ],
    designQuestions: [
      'Inputs: what is a node and what is an edge in this grid?',
      'Outputs: why use three different markers (0, None, -1) instead of one number?',
      'State: what does the distance grid double as, so you need no separate visited set?',
      'Components: which functions are built on `steps_to_exit`, and why compute it only once each?',
      'Data flow: on the sample map, which cells get distance 1, then 2, as the search spreads?',
      'Failure modes: what goes wrong if a cell is marked when it is taken off the queue instead of when it is added?',
      'Validation: which tests cover no exits, an empty grid and a room sealed off by walls?',
      'Tradeoffs: why start from all exits at once instead of searching from each room?',
    ],
    buildExerciseId: 'lab-evacuation-map-build',
    changeRequest: {
      title: 'Locked exits',
      description:
        'During a drill some exits are locked. Every function takes an optional closed list of (row, col) exits that act like walls; a closed position that is not an exit changes nothing.',
      exerciseId: 'lab-evacuation-map-change',
    },
    review: [
      'Bounds are checked before the grid is read.',
      'A cell gets its distance when it is added to the queue, so it is never added twice.',
      'The queue is a `deque` and `popleft` is O(1).',
      'Walls, unreachable rooms and the empty grid are each tested.',
      'With no `closed` argument, the change-request version gives the same answers as the build.',
    ],
  },
  {
    id: 'lab-social-network',
    title: 'Social Network Explorer',
    week: 8,
    unitId: 'w8-graphs',
    brief:
      'A small social app stores friendships as pairs of names. You build the explorer behind its profile page: friend lists, who someone can reach, friend groups, and degrees of separation.',
    requirements: [
      '`build_friends(people, pairs)` maps every person to a sorted list of friends, each once; self-pairs are ignored.',
      'Friendship goes both ways, and a pair may appear twice.',
      '`reachable(people, pairs, person)` returns everyone reachable, sorted, not including `person`.',
      '`friend_groups(people, pairs)` returns each connected group as a sorted list, and the groups sorted.',
      '`degrees_apart(people, pairs, a, b)` returns the fewest steps: 0 for the same person, -1 if not connected.',
      'Every traversal marks a person when it is first found, so no one is processed twice.',
    ],
    designQuestions: [
      'Inputs: what are the nodes and the edges, and is the graph directed?',
      'Outputs: why sort the results, and where in the code is the cheapest place to do it?',
      'State: what does the visited set (or the steps dict) hold, and when does a person go into it?',
      'Components: which function builds the adjacency, and which three reuse it?',
      'Data flow: trace `degrees_apart` from ana to dee one queue step at a time.',
      'Failure modes: what happens with a person who has no friends, or a duplicate pair?',
      'Validation: which tests cover isolated people, a cycle of friends and a shortcut path?',
      'Tradeoffs: which questions need breadth-first order, and which work with any traversal order?',
    ],
    buildExerciseId: 'lab-social-network-build',
    changeRequest: {
      title: 'Friend suggestions',
      description:
        'The app wants "people you may know". suggestions(people, pairs, person) returns people exactly two steps away who are not already friends, most mutual friends first, ties by name.',
      exerciseId: 'lab-social-network-change',
    },
    review: [
      'The adjacency is built once per call and every edge is added in both directions.',
      'People are marked visited when found, not when processed.',
      '`degrees_apart` uses breadth-first order, so the first time it reaches `b` is the shortest path.',
      'Isolated people still appear in `build_friends` and in `friend_groups`.',
      'The suggestion order is tested on a tie.',
    ],
  },
]
