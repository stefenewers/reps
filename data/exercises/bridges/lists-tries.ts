import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { debug, output, write, code, t } from '@/data/exercises/build'

const combine = { stage: 'combine' as const, repType: 'combine' as const }
const pattern = { stage: 'pattern' as const, repType: 'pattern' as const, important: true }
const cold = { stage: 'retrieval' as const, repType: 'cold' as const }

const LISTS = '2026-10-05'
const TRIES = '2026-10-06'

// ── shared Python fragments ──────────────────────────────────────────────────

/** Merge two sorted linked lists: already owned (cap-merge-two-lists), so it is given. */
const MERGE_TWO = `def merge_two(a, b):
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a if a else b
    return dummy.next`

const NODE = `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False`

const NODE_BLANK = `class TrieNode:
    def __init__(self):
        pass`

const INSERT = `def insert(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
        node = node.children[ch]
    node.end = True`

/** Test-only helpers (hidden tests): build a trie from words, and list the words a trie holds. */
const MK = `def _mk(words):
    root = TrieNode()
    for w in words:
        n = root
        for c in w:
            if c not in n.children:
                n.children[c] = TrieNode()
            n = n.children[c]
        n.end = True
    return root`
const WORDS = `def _words(node, pre=''):
    out = [pre] if node.end else []
    for c in sorted(node.children):
        out += _words(node.children[c], pre + c)
    return out`
const mk = (body: string) => `${MK}\n${body}`
const words = (body: string) => `${WORDS}\n${body}`

// ── Linked lists: LC 141 ─────────────────────────────────────────────────────

const br141: PackSection = {
  id: 'br-141',
  module: LISTS,
  title: 'Toward Linked List Cycle',
  summary: 'Two pointers on one list, moving at different speeds.',
  exercises: [
    write({
      id: 'b141-middle',
      title: 'The middle in one pass',
      skills: ['fast_slow', 'linked_list_traversal', 'while_loop'],
      prompt:
        'You found the middle before with two passes: count, then walk. Now one pass. `slow` moves one node per step and `fast` moves two. When `fast` has run out of list, `slow` is in the middle.\n\nWrite `middle_one_pass(head)` for a non-empty list: the value at position `length // 2`.\n\n`1 -> 2 -> 3 -> 4` → `3`\n`1 -> 2 -> 3` → `2`',
      starterCode: `def middle_one_pass(head):\n    pass`,
      solution: `def middle_one_pass(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val`,
      tests: [
        t.eq('middle_one_pass(build_list([1, 2, 3]))', '2'),
        t.eq('middle_one_pass(build_list([1, 2, 3, 4]))', '3'),
        t.hidden('middle_one_pass(build_list([7]))', '7'),
        t.hidden('middle_one_pass(build_list([1, 2]))', '2'),
        t.hidden('middle_one_pass(build_list([1, 2, 3, 4, 5, 6]))', '4'),
        t.hidden('middle_one_pass(build_list([-5, -4, -3, -2, -1]))', '-3'),
      ],
      hints: [
        'Both pointers start on the head.',
        '`fast` takes two steps at once, so before each jump two things must exist: `fast` itself and the node after it.',
        'Each turn of the loop: `slow` one step, `fast` two steps. The answer is under `slow` when the loop ends.',
      ],
      note: '`while fast and fast.next:` is the guard for a pointer that jumps two nodes: it stops on an even length (`fast` is `None`) and on an odd one (`fast.next` is `None`).',
      explanation: 'fast covers the list twice as quickly, so when it runs out slow has covered half. The loop condition protects the double step `fast.next.next`.',
      signature: 'fast-slow:middle-one-pass',
      minutes: 7,
    }),
    debug({
      id: 'b141-dbg-check-first',
      title: 'Debug: every list has a loop',
      skills: ['fast_slow', 'linked_list_traversal', 'early_return'],
      prompt:
        '`has_loop(head)` should return `True` when following `.next` from `head` never reaches `None` (some node points back to an earlier one), and `False` for a list that ends. Make the tests pass.',
      brokenCode: `def has_loop(head):
    slow = head
    fast = head
    while fast and fast.next:
        if slow is fast:
            return True
        slow = slow.next
        fast = fast.next.next
    return False`,
      solution: `def has_loop(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
      tests: [
        t.eq('has_loop(build_list([1, 2, 3]))', 'False'),
        t.check('the tail points back at the second node', 'h = build_list([1, 2, 3, 4])\nh.next.next.next.next = h.next\nassert has_loop(h) is True'),
        t.hidden('has_loop(None)', 'False'),
        t.hidden('has_loop(build_list([5]))', 'False'),
        t.hidden('has_loop(build_list([1, 1, 1, 1]))', 'False'),
        t.check('one node pointing at itself', 'h = build_list([5])\nh.next = h\nassert has_loop(h) is True', true),
        t.check('the tail points back at the head', 'h = build_list([1, 2, 3])\nh.next.next.next = h\nassert has_loop(h) is True', true),
        t.check('two nodes in a loop', 'h = build_list([1, 2])\nh.next.next = h\nassert has_loop(h) is True', true),
      ],
      note: '`slow is fast` asks whether the two names are on the very same node. Equal values are not enough: two different nodes can both hold `1`. In a list that ends, `fast` runs off the end. In a loop it never does, and it gains one node on `slow` every turn until it lands on it.',
      hints: ['Trace the very first turn of the loop on `1 -> 2 -> 3`. Where are the two pointers at that moment?', 'They start on the same node. A meeting only means something after they have moved.'],
      explanation: 'Both pointers start on the head, so comparing before moving is true at once. Move first, then compare: after a move they can only share a node if the list loops.',
      signature: 'debug:fast-slow-compare-before-move',
      minutes: 4,
    }),
    write({
      id: 'b141-jump-loop',
      title: 'Does the walk ever stop?',
      ...pattern,
      difficulty: 3,
      skills: ['fast_slow', 'while_loop', 'list_index'],
      transfer: true,
      prompt:
        "`jumps` is a non-empty list of whole numbers. Standing on index `i`, your next index is `jumps[i]`; a value of `-1` means stop. Every other value is a valid index of `jumps`. You start on index `0`.\n\nWrite `loops_forever(jumps)`. Return `True` if the walk never stops, `False` if it reaches a `-1`. Do not keep a record of the indexes you have been on: use only a fixed handful of variables, however long `jumps` is.\n\n`loops_forever([1, 2, 0])` → `True` (0 → 1 → 2 → 0 → …)\n`loops_forever([1, 2, -1])` → `False`",
      starterCode: `def loops_forever(jumps):\n    pass`,
      solution: `def loops_forever(jumps):
    slow = 0
    fast = 0
    while fast != -1 and jumps[fast] != -1:
        slow = jumps[slow]
        fast = jumps[jumps[fast]]
        if slow == fast:
            return True
    return False`,
      tests: [
        t.eq('loops_forever([1, 2, 0])', 'True'),
        t.eq('loops_forever([1, 2, -1])', 'False'),
        t.hidden('loops_forever([-1])', 'False'),
        t.hidden('loops_forever([0])', 'True'),
        t.hidden('loops_forever([1, -1])', 'False'),
        t.hidden('loops_forever([1, 2, 3, 1])', 'True'),
        t.hidden('loops_forever([2, -1, 1])', 'False'),
        t.hidden('loops_forever([1, 2, 3, 4, 5, -1])', 'False'),
        t.hidden('loops_forever([3, 0, -1, 4, 3])', 'True'),
      ],
      hints: [
        'You have answered this question for a linked list. An index plays the part of a node, and `jumps[i]` plays the part of `.next`.',
        'Two positions moving at different speeds. What was `fast and fast.next` on a linked list? Here "nothing there" is spelled `-1`.',
        'One step is `jumps[slow]`. Two steps is a lookup of a lookup.',
        'Move both, then compare. Equal positions mean a loop; leaving the `while` means the walk ended.',
      ],
      explanation: 'The same two-speed idea without a linked list: if the walk ends, fast gets there first; if it loops, fast comes round and lands on slow.',
      signature: 'fast-slow:index-walk-loop',
      minutes: 9,
    }),
  ],
}

// ── Linked lists: LC 19 ──────────────────────────────────────────────────────

const br19: PackSection = {
  id: 'br-19',
  module: LISTS,
  title: 'Toward Remove Nth Node From End of List',
  summary: 'Give one pointer a head start, and let a dummy absorb the head case.',
  exercises: [
    write({
      id: 'b19-kth-from-end',
      title: 'k-th value from the end',
      skills: ['fast_slow', 'linked_list_traversal', 'range'],
      prompt:
        "Write `kth_from_end(head, k)`. Return the value of the k-th node counting from the end (`k = 1` is the last node). `k` is always between 1 and the length.\n\nOne pass, without measuring the length: send a `lead` pointer `k` nodes ahead, then move `lead` and a second pointer together until `lead` falls off the end.\n\n`1 -> 2 -> 3 -> 4 -> 5`, `k = 2` → `4`",
      starterCode: `def kth_from_end(head, k):\n    pass`,
      solution: `def kth_from_end(head, k):
    lead = head
    for _ in range(k):
        lead = lead.next
    trail = head
    while lead:
        lead = lead.next
        trail = trail.next
    return trail.val`,
      tests: [
        t.eq('kth_from_end(build_list([1, 2, 3, 4, 5]), 2)', '4'),
        t.eq('kth_from_end(build_list([1, 2, 3, 4, 5]), 1)', '5'),
        t.hidden('kth_from_end(build_list([1, 2, 3, 4, 5]), 5)', '1'),
        t.hidden('kth_from_end(build_list([9]), 1)', '9'),
        t.hidden('kth_from_end(build_list([3, 3, 7]), 3)', '3'),
        t.hidden('kth_from_end(build_list([-1, -2]), 2)', '-1'),
      ],
      hints: [
        'Two pointers that stay exactly `k` nodes apart.',
        'First loop: move `lead` forward `k` times. Second loop: move both, one node each.',
        'When `lead` is `None` it is one past the last node, so the other pointer is `k` nodes before that.',
      ],
      note: 'A gap of `k` nodes, held constant: when the front pointer is past the end, the back pointer is `k` from the end. To repeat a step `k` times when you do not need the counter, write `for _ in range(k):`. `_` is an ordinary variable name that says "not used".',
      explanation: 'The head start turns "k from the end", which you cannot index, into "stop when the leader runs out".',
      signature: 'fast-slow:lead-by-k-value',
      minutes: 8,
    }),
    debug({
      id: 'b19-dbg-chop',
      title: 'Debug: cut off the last k',
      skills: ['fast_slow', 'dummy_node', 'linked_list_reassignment'],
      prompt:
        '`chop_last(head, k)` should cut the final `k` nodes off the list and return the head of what is left, or `None` if nothing is left. `k` is between 1 and the length. Make the tests pass.',
      brokenCode: `def chop_last(head, k):
    lead = head
    for _ in range(k):
        lead = lead.next
    trail = head
    while lead.next:
        lead = lead.next
        trail = trail.next
    trail.next = None
    return head`,
      solution: `def chop_last(head, k):
    dummy = ListNode(0, head)
    lead = dummy
    for _ in range(k):
        lead = lead.next
    trail = dummy
    while lead.next:
        lead = lead.next
        trail = trail.next
    trail.next = None
    return dummy.next`,
      tests: [
        t.eq('list_to_array(chop_last(build_list([1, 2, 3, 4, 5]), 2))', '[1, 2, 3]'),
        t.eq('chop_last(build_list([1, 2, 3]), 3)', 'None'),
        t.hidden('chop_last(build_list([7]), 1)', 'None'),
        t.hidden('list_to_array(chop_last(build_list([1, 2]), 1))', '[1]'),
        t.hidden('list_to_array(chop_last(build_list([4, 4, 4, 4]), 3))', '[4]'),
      ],
      hints: [
        'Run the failing test by hand: where is `lead` after its head start when `k` equals the length?',
        'To cut, `trail` must stop on the last node that is **kept**. When nothing is kept there is no such node, unless you add one.',
        'You have used a node placed in front of the head before, in `remove_all`. Start both pointers there and return what follows it.',
      ],
      explanation: 'With a dummy in front, "the node before the cut" always exists, even when the cut starts at the head. Both pointers start on the dummy and the answer is dummy.next.',
      signature: 'debug:lead-by-k-needs-dummy',
      minutes: 6,
    }),
    write({
      id: 'b19-insert-from-end',
      title: 'Insert before the k-th from the end',
      ...pattern,
      difficulty: 3,
      skills: ['fast_slow', 'dummy_node', 'linked_list_reassignment', 'linked_list_traversal'],
      transfer: true,
      prompt:
        "Write `insert_from_end(head, k, val)`. Put a new node holding `val` just in front of the k-th node from the end (`k = 1` is the last node; `k` is between 1 and the length). Return the head of the list. One pass.\n\n`1 -> 2 -> 3`, `k = 1`, `val = 9` → `1 -> 2 -> 9 -> 3`\n`1 -> 2 -> 3`, `k = 3`, `val = 9` → `9 -> 1 -> 2 -> 3`",
      starterCode: `def insert_from_end(head, k, val):\n    pass`,
      solution: `def insert_from_end(head, k, val):
    dummy = ListNode(0, head)
    lead = dummy
    for _ in range(k):
        lead = lead.next
    trail = dummy
    while lead.next:
        lead = lead.next
        trail = trail.next
    trail.next = ListNode(val, trail.next)
    return dummy.next`,
      tests: [
        t.eq('list_to_array(insert_from_end(build_list([1, 2, 3]), 1, 9))', '[1, 2, 9, 3]'),
        t.eq('list_to_array(insert_from_end(build_list([1, 2, 3]), 3, 9))', '[9, 1, 2, 3]'),
        t.hidden('list_to_array(insert_from_end(build_list([5]), 1, 4))', '[4, 5]'),
        t.hidden('list_to_array(insert_from_end(build_list([1, 2]), 2, 0))', '[0, 1, 2]'),
        t.hidden('list_to_array(insert_from_end(build_list([1, 2, 3, 4]), 2, -1))', '[1, 2, -1, 3, 4]'),
        t.hidden('list_to_array(insert_from_end(build_list([6, 6, 6]), 2, 6))', '[6, 6, 6, 6]'),
      ],
      hints: [
        'To insert in front of a node you need to be standing on the node **before** it.',
        'In the second example the new node becomes the head. What node is "before the head"?',
        'Head start of `k` from the dummy, then move both until the leader is on the last node.',
        'One line rewires: the new node takes over what the trailing node pointed at.',
      ],
      explanation: 'Lead by k from a dummy and stop when the leader is on the last node: the trailing pointer is then one before the k-th from the end, which is where any insert or removal has to happen.',
      signature: 'fast-slow:lead-by-k-insert',
      minutes: 11,
    }),
  ],
}

// ── Linked lists: LC 143 ─────────────────────────────────────────────────────

const br143: PackSection = {
  id: 'br-143',
  module: LISTS,
  title: 'Toward Reorder List',
  summary: 'Weave two lists, cut a list at its middle, then put the pieces together.',
  exercises: [
    write({
      id: 'b143-weave',
      title: 'Weave two lists',
      skills: ['linked_list_reassignment', 'linked_list_traversal', 'while_loop'],
      prompt:
        '`a` and `b` are the heads of two linked lists. Either may be `None` (an empty list). `a` is as long as `b`, or one node longer.\n\nWrite `weave(a, b)` that rewires the existing nodes so they alternate, starting with `a`: a1, b1, a2, b2, … Return the head (still the first node of `a`). No new nodes.\n\n`1 -> 2 -> 3` and `7 -> 8` → `1 -> 7 -> 2 -> 8 -> 3`',
      starterCode: `def weave(a, b):\n    pass`,
      solution: `def weave(a, b):
    head = a
    while a and b:
        a_next = a.next
        b_next = b.next
        a.next = b
        b.next = a_next
        a = a_next
        b = b_next
    return head`,
      tests: [
        t.eq('list_to_array(weave(build_list([1, 2, 3]), build_list([7, 8])))', '[1, 7, 2, 8, 3]'),
        t.eq('list_to_array(weave(build_list([1, 2]), build_list([7, 8])))', '[1, 7, 2, 8]'),
        t.hidden('list_to_array(weave(build_list([5]), None))', '[5]'),
        t.hidden('weave(None, None)', 'None'),
        t.hidden('list_to_array(weave(build_list([1]), build_list([2])))', '[1, 2]'),
        t.check('reuses the original nodes', 'a = build_list([1, 2])\nb = build_list([9])\nr = weave(a, b)\nassert r is a and r.next is b and b.next.val == 2 and b.next.next is None', true),
      ],
      hints: [
        'Each turn handles one node from `a` and one from `b`.',
        'Two links are about to be overwritten. Save where each of them led first.',
        'Point the `a` node at the `b` node, and the `b` node at the saved rest of `a`. Then step both pointers to their saved nodes.',
      ],
      note: 'Same rule as reversing: before you overwrite a `.next`, keep what it pointed to in a variable.',
      explanation: 'Two saved pointers, two rewires, two advances. Saving both `.next` values first is what keeps either chain from being lost.',
      signature: 'll:weave-two',
      minutes: 10,
    }),
    debug({
      id: 'b143-dbg-weave',
      title: 'Debug: the weave that never ends',
      skills: ['linked_list_reassignment', 'linked_list_traversal'],
      prompt:
        '`weave_back(a, b)` should alternate the nodes of two lists starting with **`b`**: b1, a1, b2, a2, … and return the head. `b` is as long as `a`, or one node longer.\n\n`a` = `1 -> 2`, `b` = `7 -> 8 -> 9` → `7 -> 1 -> 8 -> 2 -> 9`\n\nMake the tests pass.',
      brokenCode: `def weave_back(a, b):
    head = b
    while a and b:
        b.next = a
        b_next = b.next
        a_next = a.next
        a.next = b_next
        a = a_next
        b = b_next
    return head`,
      solution: `def weave_back(a, b):
    head = b
    while a and b:
        b_next = b.next
        b.next = a
        a_next = a.next
        a.next = b_next
        a = a_next
        b = b_next
    return head`,
      tests: [
        t.eq('list_to_array(weave_back(build_list([1, 2]), build_list([7, 8, 9])))', '[7, 1, 8, 2, 9]'),
        t.eq('list_to_array(weave_back(build_list([1]), build_list([7])))', '[7, 1]'),
        t.hidden('list_to_array(weave_back(None, build_list([4])))', '[4]'),
        t.hidden('weave_back(None, None)', 'None'),
        t.hidden('list_to_array(weave_back(build_list([3, 3]), build_list([3, 3])))', '[3, 3, 3, 3]'),
      ],
      hints: ['Draw the two lists and run the first turn of the loop one line at a time.', 'When `b_next` is read, what does `b.next` hold by then?'],
      explanation: 'The link was overwritten before it was saved, so `b_next` was really `a` and the node ended up pointing at itself. Save, then rewire.',
      signature: 'debug:weave-save-after-overwrite',
      minutes: 4,
    }),
    write({
      id: 'b143-split',
      title: 'Cut a list in half',
      skills: ['fast_slow', 'linked_list_reassignment', 'linked_list_traversal'],
      prompt:
        'Write `split_half(head)` for a non-empty list: cut it into two separate lists and return the head of the **second** one (`None` if there is no second half). With an odd length the first half keeps the extra node. `head` stays the head of the first half.\n\nOne pass: start `fast` one node **ahead** of `slow`, so that `slow` stops on the last node of the first half. Then cut there.\n\n`1 -> 2 -> 3 -> 4 -> 5` becomes `1 -> 2 -> 3`, and `4 -> 5` is returned.',
      starterCode: `def split_half(head):\n    pass`,
      solution: `def split_half(head):
    slow = head
    fast = head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    second = slow.next
    slow.next = None
    return second`,
      tests: [
        t.check('five nodes: 3 and 2', 'h = build_list([1, 2, 3, 4, 5])\ns = split_half(h)\nassert list_to_array(h) == [1, 2, 3], f"first half is {list_to_array(h)}"\nassert list_to_array(s) == [4, 5], f"second half is {list_to_array(s)}"'),
        t.check('four nodes: 2 and 2', 'h = build_list([1, 2, 3, 4])\ns = split_half(h)\nassert list_to_array(h) == [1, 2], f"first half is {list_to_array(h)}"\nassert list_to_array(s) == [3, 4], f"second half is {list_to_array(s)}"'),
        t.check('two nodes', 'h = build_list([1, 2])\ns = split_half(h)\nassert list_to_array(h) == [1] and list_to_array(s) == [2]', true),
        t.check('one node has no second half', 'h = build_list([7])\ns = split_half(h)\nassert s is None and list_to_array(h) == [7]', true),
        t.check('six nodes', 'h = build_list([1, 2, 3, 4, 5, 6])\ns = split_half(h)\nassert list_to_array(h) == [1, 2, 3] and list_to_array(s) == [4, 5, 6]', true),
      ],
      hints: [
        'Same loop as the one-pass middle; only the starting position of `fast` changes.',
        'When the loop ends, the second half begins right after `slow`. Remember that node before you touch anything.',
        'The first half still runs on into the second until you end it.',
      ],
      note: 'Starting `fast` on `head.next` makes `slow` stop one node earlier than starting both on `head`: on the node before the split, which is the one you need in order to cut.',
      explanation: 'slow ends on the last node of the first half. Save what follows, then set slow.next to None so the two halves are really separate lists.',
      signature: 'fast-slow:split-half',
      minutes: 9,
    }),
    code({
      id: 'b143-shuffle-halves',
      title: 'Second half between the first',
      ...combine,
      difficulty: 3,
      style: 'from-signature',
      skills: ['fast_slow', 'linked_list_reassignment', 'linked_list_traversal', 'edge_cases'],
      prompt:
        '`weave` is given. Write `shuffle_halves(head)`, which changes the list **in place** and returns nothing: cut the list in half (the first half keeps the extra node), then weave the second half into the first.\n\n`1 -> 2 -> 3 -> 4 -> 5 -> 6` becomes `1 -> 4 -> 2 -> 5 -> 3 -> 6`\n`1 -> 2 -> 3` becomes `1 -> 3 -> 2`\n\n`head` may be `None`.',
      starterCode: `def weave(a, b):
    head = a
    while a and b:
        a_next = a.next
        b_next = b.next
        a.next = b
        b.next = a_next
        a = a_next
        b = b_next
    return head


def shuffle_halves(head):
    pass`,
      solution: `def weave(a, b):
    head = a
    while a and b:
        a_next = a.next
        b_next = b.next
        a.next = b
        b.next = a_next
        a = a_next
        b = b_next
    return head


def shuffle_halves(head):
    if head is None:
        return
    slow = head
    fast = head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    second = slow.next
    slow.next = None
    weave(head, second)`,
      tests: [
        t.check('six nodes', 'h = build_list([1, 2, 3, 4, 5, 6])\nshuffle_halves(h)\nassert list_to_array(h) == [1, 4, 2, 5, 3, 6], f"list is {list_to_array(h)}"'),
        t.check('three nodes', 'h = build_list([1, 2, 3])\nshuffle_halves(h)\nassert list_to_array(h) == [1, 3, 2], f"list is {list_to_array(h)}"'),
        t.check('empty list', 'assert shuffle_halves(None) is None', true),
        t.check('one node', 'h = build_list([7])\nshuffle_halves(h)\nassert list_to_array(h) == [7]', true),
        t.check('two nodes', 'h = build_list([1, 2])\nshuffle_halves(h)\nassert list_to_array(h) == [1, 2]', true),
        t.check('five nodes', 'h = build_list([1, 2, 3, 4, 5])\nshuffle_halves(h)\nassert list_to_array(h) == [1, 4, 2, 5, 3]', true),
      ],
      hints: [
        'Two steps you have already written separately: cut at the middle, then weave.',
        'The first node never changes, so there is nothing to return. Which input has no first node at all?',
        'If you skip the cut, the first half still leads into the second. What does the weave do then?',
      ],
      explanation: 'Cut, then weave. The cut (`slow.next = None`) is what stops the weave from chasing its own tail, and an in-place function has to guard the empty list itself.',
      signature: 'll:split-then-weave',
      minutes: 11,
    }),
    write({
      id: 'b143-end-pair-sums',
      title: 'Sums from both ends',
      ...pattern,
      difficulty: 4,
      skills: ['fast_slow', 'linked_list_reassignment', 'linked_list_traversal', 'list_append'],
      transfer: true,
      prompt:
        'Write `end_pair_sums(head)` for a non-empty list. Return a Python list of sums: first node + last node, second + second-to-last, and so on. With an odd length the middle node has no partner: put its value on the end by itself.\n\nDo not copy the values into a Python list first. You may rewire the linked list.\n\n`1 -> 2 -> 3 -> 10` → `[11, 5]`\n`1 -> 2 -> 3` → `[4, 2]`',
      starterCode: `def end_pair_sums(head):\n    pass`,
      solution: `def end_pair_sums(head):
    slow = head
    fast = head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    curr = slow.next
    slow.next = None
    prev = None
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    sums = []
    a = head
    b = prev
    while b:
        sums.append(a.val + b.val)
        a = a.next
        b = b.next
    if a:
        sums.append(a.val)
    return sums`,
      tests: [
        t.eq('end_pair_sums(build_list([1, 2, 3, 10]))', '[11, 5]'),
        t.eq('end_pair_sums(build_list([1, 2, 3]))', '[4, 2]'),
        t.hidden('end_pair_sums(build_list([7]))', '[7]'),
        t.hidden('end_pair_sums(build_list([4, 6]))', '[10]'),
        t.hidden('end_pair_sums(build_list([1, 2, 3, 4, 5, 6]))', '[7, 7, 7]'),
        t.hidden('end_pair_sums(build_list([-1, 5, 0, 5, -1]))', '[-2, 10, 0]'),
      ],
      hints: [
        'A singly linked list cannot be walked backwards. What could you do to the back half so that its last node comes first?',
        'Three stages: cut at the middle, turn the second half around, walk both halves side by side.',
        'The reversed half is the shorter one (or the same length), so let it decide when the side-by-side walk stops.',
        'After that walk, is anything left in the first half?',
      ],
      explanation: 'Middle, reverse, then two pointers walking toward the centre from both ends. Reversing the back half is how a one-way list gets read from its tail.',
      signature: 'll:middle-reverse-pair-walk',
      minutes: 16,
    }),
  ],
}

// ── Linked lists: LC 23 ──────────────────────────────────────────────────────

const br23: PackSection = {
  id: 'br-23',
  module: LISTS,
  title: 'Toward Merge k Sorted Lists',
  summary: 'From merging two lists to merging any number of them, a pair at a time.',
  exercises: [
    code({
      id: 'b23-fold',
      title: 'Merge them one at a time',
      style: 'from-signature',
      skills: ['linked_list_traversal', 'list_iterate', 'accumulator'],
      prompt:
        '`merge_two(a, b)` is given: it merges two sorted linked lists (either may be `None`). Its last line, `tail.next = a if a else b`, reads "`a` if `a` is not empty, otherwise `b`": it attaches whichever list still has nodes.\n\n`lists` is a Python list of heads of sorted linked lists. Some entries may be `None`. Write `merge_fold(lists)` that merges all of them into one sorted list and returns its head: keep one merged list, and merge the next head into it each time.\n\n`[1 -> 4, 2 -> 3, 0 -> 5]` → `0 -> 1 -> 2 -> 3 -> 4 -> 5`\n`[]` → `None`',
      starterCode: `${MERGE_TWO}


def merge_fold(lists):
    pass`,
      solution: `${MERGE_TWO}


def merge_fold(lists):
    merged = None
    for head in lists:
        merged = merge_two(merged, head)
    return merged`,
      tests: [
        t.eq('list_to_array(merge_fold([build_list([1, 4]), build_list([2, 3]), build_list([0, 5])]))', '[0, 1, 2, 3, 4, 5]'),
        t.eq('merge_fold([])', 'None'),
        t.hidden('list_to_array(merge_fold([None, build_list([1]), None]))', '[1]'),
        t.hidden('merge_fold([None])', 'None'),
        t.hidden('list_to_array(merge_fold([build_list([2, 2]), build_list([2])]))', '[2, 2, 2]'),
        t.hidden('list_to_array(merge_fold([build_list([-3, 9]), build_list([-5]), build_list([0]), build_list([-4, 10])]))', '[-5, -4, -3, 0, 9, 10]'),
      ],
      hints: ['This is an accumulator, like a running total, except the thing that grows is a linked list.', 'What is the merged list before you have looked at any head? `merge_two` copes with that value.'],
      note: 'A fold: start from an "empty" result and combine each item into it. For a sum the empty result is `0`; for a linked list it is `None`.',
      explanation: 'It works, but the merged list is re-walked for every new list, so early lists are walked again and again. Pairing the lists up keeps every merge small.',
      signature: 'll:merge-k-fold',
      minutes: 5,
    }),
    write({
      id: 'b23-next-round',
      title: 'One knockout round',
      skills: ['list_index', 'range', 'list_append', 'conditionals'],
      prompt:
        'One round of a knockout: `scores` is a list of numbers. Pair them off from the left (index 0 with 1, index 2 with 3, …) and keep the larger of each pair. If one is left over at the end, it goes through unpaired.\n\nWrite `next_round(scores)` returning the new, shorter list.\n\n`next_round([3, 8, 5, 1, 4])` → `[8, 5, 4]`',
      starterCode: `def next_round(scores):\n    pass`,
      solution: `def next_round(scores):
    winners = []
    for i in range(0, len(scores), 2):
        if i + 1 < len(scores):
            winners.append(max(scores[i], scores[i + 1]))
        else:
            winners.append(scores[i])
    return winners`,
      tests: [
        t.eq('next_round([3, 8, 5, 1, 4])', '[8, 5, 4]'),
        t.eq('next_round([3, 8, 5, 1])', '[8, 5]'),
        t.hidden('next_round([])', '[]'),
        t.hidden('next_round([7])', '[7]'),
        t.hidden('next_round([2, 2])', '[2]'),
        t.hidden('next_round([-1, -5, -3, -2])', '[-1, -2]'),
        t.hidden('next_round([1, 2, 3])', '[2, 3]'),
      ],
      hints: ['`range` takes a third number: the step.', 'At index `i` the partner is at `i + 1`. Does that index always exist?', 'No partner: the item goes into the result unchanged.'],
      explanation: 'Step by 2 and check that the partner exists. Each round roughly halves the list, which is the whole point of pairing.',
      signature: 'list:pair-up-one-round',
      minutes: 7,
    }),
    debug({
      id: 'b23-dbg-rounds',
      title: 'Debug: a list goes missing',
      ...combine,
      difficulty: 3,
      skills: ['list_index', 'range', 'while_loop', 'linked_list_traversal'],
      prompt:
        '`merge_rounds(lists)` should merge any number of sorted linked lists into one, in rounds: each round merges neighbours in pairs, and the rounds repeat until a single list is left. `[]` gives `None`. `merge_two` is correct. Make the tests pass.',
      brokenCode: `${MERGE_TWO}


def merge_rounds(lists):
    if not lists:
        return None
    while len(lists) > 1:
        paired = []
        for i in range(0, len(lists) - 1, 2):
            paired.append(merge_two(lists[i], lists[i + 1]))
        lists = paired
    return lists[0]`,
      solution: `${MERGE_TWO}


def merge_rounds(lists):
    if not lists:
        return None
    while len(lists) > 1:
        paired = []
        for i in range(0, len(lists), 2):
            if i + 1 < len(lists):
                paired.append(merge_two(lists[i], lists[i + 1]))
            else:
                paired.append(lists[i])
        lists = paired
    return lists[0]`,
      tests: [
        t.eq('list_to_array(merge_rounds([build_list([1, 4]), build_list([2, 3])]))', '[1, 2, 3, 4]'),
        t.eq('list_to_array(merge_rounds([build_list([1, 4]), build_list([2, 3]), build_list([0, 5])]))', '[0, 1, 2, 3, 4, 5]'),
        t.hidden('merge_rounds([])', 'None'),
        t.hidden('merge_rounds([None])', 'None'),
        t.hidden('list_to_array(merge_rounds([build_list([5])]))', '[5]'),
        t.hidden('list_to_array(merge_rounds([None, build_list([1]), None, build_list([1]), build_list([-2, 7])]))', '[-2, 1, 1, 7]'),
        t.hidden('list_to_array(merge_rounds([build_list([i]) for i in [6, 5, 4, 3, 2, 1, 0]]))', '[0, 1, 2, 3, 4, 5, 6]'),
      ],
      hints: ['Two lists work and three do not. Write out which indexes the `for` loop visits when there are three.', 'It is the knockout round again: what happens to the one with no partner?'],
      explanation: 'An odd list out has to be carried into the next round untouched. Stopping the range early avoided the index error but threw that list away.',
      signature: 'debug:merge-rounds-odd-dropped',
      minutes: 6,
    }),
    write({
      id: 'b23-merge-arrays',
      title: 'Many sorted arrays into one',
      ...pattern,
      difficulty: 4,
      skills: ['two_pointer', 'list_index', 'while_loop', 'range', 'list_append'],
      transfer: true,
      prompt:
        '`arrays` is a list of Python lists of numbers, each already sorted ascending. Inner lists may be empty, and `arrays` itself may be empty. Write `merge_sorted_arrays(arrays)` returning one new sorted list holding every value, duplicates included.\n\nNo `sorted()` and no `.sort()`: use the fact that every list is already in order.\n\n`merge_sorted_arrays([[1, 4], [2, 3], [0, 5]])` → `[0, 1, 2, 3, 4, 5]`\n`merge_sorted_arrays([])` → `[]`',
      starterCode: `def merge_sorted_arrays(arrays):\n    pass`,
      solution: `def merge_pair(a, b):
    out = []
    i = 0
    j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out


def merge_sorted_arrays(arrays):
    if not arrays:
        return []
    while len(arrays) > 1:
        paired = []
        for i in range(0, len(arrays), 2):
            if i + 1 < len(arrays):
                paired.append(merge_pair(arrays[i], arrays[i + 1]))
            else:
                paired.append(arrays[i])
        arrays = paired
    return arrays[0]`,
      tests: [
        t.eq('merge_sorted_arrays([[1, 4], [2, 3], [0, 5]])', '[0, 1, 2, 3, 4, 5]'),
        t.eq('merge_sorted_arrays([])', '[]'),
        t.hidden('merge_sorted_arrays([[]])', '[]'),
        t.hidden('merge_sorted_arrays([[], [1], []])', '[1]'),
        t.hidden('merge_sorted_arrays([[2, 2], [2]])', '[2, 2, 2]'),
        t.hidden('merge_sorted_arrays([[-3, 9], [-5], [0], [-4, 10], [1]])', '[-5, -4, -3, 0, 1, 9, 10]'),
        t.hidden('merge_sorted_arrays([[1, 2, 3]])', '[1, 2, 3]'),
        t.hidden('merge_sorted_arrays([[i] for i in [6, 5, 4, 3, 2, 1, 0]])', '[0, 1, 2, 3, 4, 5, 6]'),
      ],
      hints: [
        'Two functions: one that merges exactly two sorted lists, one that organises the rounds.',
        'Merging two: an index into each, take the smaller front value, and do not forget what is left in the longer one.',
        'A round builds a new list of merged pairs; the odd one out is carried over. Then the new list replaces the old.',
        'Keep going while more than one list remains. Which input has no list to return at all?',
      ],
      explanation: 'With k lists and n values in total, each round touches every value once and there are about log k rounds: O(n log k). Folding one list at a time can cost O(n·k).',
      complexity: { time: 'O(n log k)', space: 'O(n)' },
      signature: 'list:merge-k-rounds-arrays',
      minutes: 16,
    }),
  ],
}

// ── Tries: the pattern ladder ────────────────────────────────────────────────

const trNode: PackSection = {
  id: 'tr-node',
  module: TRIES,
  title: 'Trie nodes',
  summary: 'From a dict of dicts to a node with children and an end flag.',
  exercises: [
    output({
      id: 'tr-nested-trace',
      title: 'Trace: a dict whose values are dicts',
      skills: ['trie_node', 'dict_assign', 'dict_membership'],
      prompt: 'Predict the output. Draw `tree` as a small tree: one box per dict, one arrow per key.',
      code: `tree = {}
tree['c'] = {}
tree['c']['a'] = {}
tree['c']['o'] = {}
node = tree['c']
print(len(tree))
print(sorted(node))
print('a' in tree)
print('a' in node)`,
      expectedOutput: `1
['a', 'o']
False
True`,
      note: '`tree[\'c\']` is itself a dict. `node = tree[\'c\']` steps one level down: `node` is now that inner dict. `sorted(node)` gives the keys of a dict as a sorted list.',
      explanation: "The outer dict has one key, 'c'. Its value is another dict with keys 'a' and 'o'. `in` only looks at the level you are standing on.",
      signature: 'trace:nested-dict-levels',
      minutes: 2,
    }),
    write({
      id: 'tr-add-path',
      title: 'Walk down, creating as you go',
      skills: ['trie_node', 'dict_membership', 'dict_assign', 'string_iterate'],
      prompt:
        "`tree` is a dict of dicts: each key is one letter, and its value is the dict of letters that may follow it.\n\nWrite `add_path(tree, word)`. Walk down the letters of `word`, creating an empty dict wherever a letter is missing, and return `tree`.\n\n`add_path({}, 'cat')` → `{'c': {'a': {'t': {}}}}`\n\nAdding `'cab'` to that gives `{'c': {'a': {'t': {}, 'b': {}}}}`: the shared start is stored once.",
      starterCode: `def add_path(tree, word):\n    pass`,
      solution: `def add_path(tree, word):
    node = tree
    for ch in word:
        if ch not in node:
            node[ch] = {}
        node = node[ch]
    return tree`,
      tests: [
        t.eq("add_path({}, 'cat')", "{'c': {'a': {'t': {}}}}"),
        t.eq("add_path({'c': {'a': {'t': {}}}}, 'cab')", "{'c': {'a': {'t': {}, 'b': {}}}}"),
        t.hidden("add_path({}, '')", '{}'),
        t.hidden("add_path({'a': {}}, 'a')", "{'a': {}}"),
        t.hidden("add_path({'a': {'b': {}}}, 'xy')", "{'a': {'b': {}}, 'x': {'y': {}}}"),
        t.hidden("add_path({}, 'aa')", "{'a': {'a': {}}}"),
      ],
      hints: [
        'Keep a variable for the dict you are standing in. It starts as `tree`.',
        'For each letter: make sure the key exists on this level, then step into its dict.',
        'Stepping down means reassigning your variable to the inner dict.',
      ],
      note: 'Two actions per letter, always in this order: **create if missing**, then **step down**.',
      explanation: 'Create if missing, then step down. That pair of lines is the heart of every trie insert.',
      signature: 'trie:nested-dict-add-path',
      minutes: 6,
      important: true,
    }),
    write({
      id: 'tr-node-class',
      title: 'A node of your own',
      skills: ['trie_node', 'dict_create'],
      prompt:
        "A dict of dicts cannot say \"a word stops here\". This letter tree is called a **trie**. Each node becomes an object with **two** fields. `children` maps each letter to the next node. `end` is `True` when a word finishes at this node.\n\nYou make your own kind of object with a **class**. You have used one already, without having to write it:\n\n```python\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n```\n\nHow to read it:\n\n- `class ListNode:` names a new kind of object. Calling the name, as in `ListNode(5)`, makes a fresh one.\n- `__init__` (two underscores on each side) is a function inside the class. Python runs it by itself every time an object is made, to set the new object up.\n- `self` is that new object. Python passes it in for you, so it is in the `def` line but never in the call. (`val=0` is the value used when the caller leaves `val` out.)\n- `self.val = val` stores a **field** on the object. Later you read it with a dot: `node.val`.\n\nWrite `class TrieNode`. Its `__init__` takes nothing besides `self` (so a node is made with `TrieNode()`), and gives the new node an empty dict called `children` and an `end` flag that starts as `False`.",
      starterCode: NODE_BLANK,
      solution: NODE,
      tests: [
        t.check('a new node is empty', 'n = TrieNode()\nassert n.children == {}, f"children is {n.children}"\nassert n.end is False'),
        t.check('each node has its own children', "a = TrieNode()\nb = TrieNode()\na.children['x'] = b\nassert b.children == {}, 'b picked up a child that was given to a'"),
        t.check('each node has its own end flag', "a = TrieNode()\nb = TrieNode()\nb.end = True\nassert a.end is False and b.end is True", true),
      ],
      hints: ['`__init__` runs once for every `TrieNode()` you create.', 'Inside it, a field is created by assigning to `self.` followed by the field name.'],
      note: '`self` is the node being built. Anything assigned to `self.something` inside `__init__` belongs to that one node.',
      explanation: 'Assigning inside `__init__` gives every node a fresh dict and a fresh flag of its own.',
      signature: 'trie:node-class',
      minutes: 3,
    }),
    debug({
      id: 'tr-dbg-shared',
      title: 'Debug: the child that is its own parent',
      skills: ['trie_node', 'dict_assign'],
      prompt:
        '`link(parent, ch)` should hang a fresh, empty node under `parent` for the letter `ch`, and return the new node. After `link(root, \'a\')` the root has exactly one child and the new node has none. Make the tests pass.',
      brokenCode: `class TrieNode:
    children = {}
    end = False


def link(parent, ch):
    child = TrieNode()
    parent.children[ch] = child
    return child`,
      solution: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False


def link(parent, ch):
    child = TrieNode()
    parent.children[ch] = child
    return child`,
      tests: [
        t.check('the new node starts empty', "root = TrieNode()\nkid = link(root, 'a')\nassert list(root.children) == ['a']\nassert kid.children == {}, f'the new node already has children: {list(kid.children)}'"),
        t.check('two roots stay separate', "r1 = TrieNode()\nr2 = TrieNode()\nlink(r1, 'x')\nassert r2.children == {}, 'a child added to one root showed up in another'", true),
        t.check('end flags are per node', "root = TrieNode()\nkid = link(root, 'a')\nkid.end = True\nassert root.end is False", true),
      ],
      note: 'Lines written directly under `class` run **once**, when the class itself is defined. Lines inside `__init__` run once **per object**, every time `TrieNode()` is called.',
      hints: ['`link` is fine. How many dicts get created when three nodes are made?', 'A name assigned directly under `class` is created once and shared by every object. Where do per-object fields get created?'],
      explanation: 'A dict written directly in the class body exists once, so every node was using the same `children`. Creating it inside `__init__` gives each node its own. (`def __init__(self, children={})` has the same flaw: the default is built once.)',
      signature: 'debug:trie-shared-children',
      minutes: 5,
    }),
  ],
}

const trInsert: PackSection = {
  id: 'tr-insert',
  module: TRIES,
  title: 'Inserting words',
  summary: 'One child per letter, and a flag on the node where the word stops.',
  exercises: [
    code({
      id: 'tr-step',
      title: 'One step down',
      style: 'from-signature',
      skills: ['trie_node', 'dict_membership', 'dict_assign'],
      prompt:
        "Write `step(node, ch)`. Return the child of `node` for the letter `ch`. If there is no such child yet, create a new `TrieNode`, store it under `ch`, and return that one.\n\nCalling `step(root, 'a')` twice returns the **same** node both times.",
      starterCode: `${NODE}


def step(node, ch):
    pass`,
      solution: `${NODE}


def step(node, ch):
    if ch not in node.children:
        node.children[ch] = TrieNode()
    return node.children[ch]`,
      tests: [
        t.check('creates the child', "root = TrieNode()\nkid = step(root, 'a')\nassert isinstance(kid, TrieNode), 'step should return a TrieNode'\nassert root.children['a'] is kid"),
        t.check('does not replace an existing child', "root = TrieNode()\nfirst = step(root, 'a')\nassert step(root, 'a') is first, 'the second call made a new node'"),
        t.check('two letters, two children', "root = TrieNode()\nstep(root, 'a')\nstep(root, 'b')\nassert sorted(root.children) == ['a', 'b']", true),
        t.check('steps can be chained', "root = TrieNode()\nstep(step(root, 'a'), 'b')\nassert 'b' in root.children['a'].children and 'b' not in root.children", true),
      ],
      hints: ['It is the dict-of-dicts move again, but the dict now lives one dot away, in `node.children`.', 'Create only when the letter is missing. Either way, hand back what is stored under the letter.'],
      explanation: 'Create if missing, then return the child. An unconditional `TrieNode()` would wipe out everything already stored below that letter.',
      signature: 'trie:step-or-create',
      minutes: 4,
    }),
    code({
      id: 'tr-insert',
      title: 'Insert a word',
      style: 'from-signature',
      skills: ['trie_node', 'string_iterate', 'dict_membership'],
      prompt:
        "Write `insert(root, word)`. Start at `root`, move down one node per letter of `word` (creating the nodes that are missing), and mark the node you finish on as the end of a word. It returns nothing.\n\nAfter `insert(root, 'to')`:\n`root.children['t'].children['o'].end` is `True`\n`root.children['t'].end` is still `False`",
      starterCode: `${NODE}


def insert(root, word):
    pass`,
      solution: `${NODE}


${INSERT}`,
      tests: [
        t.check('insert to', "root = TrieNode()\ninsert(root, 'to')\nt_node = root.children['t']\nassert t_node.end is False, 't alone is not a word'\nassert t_node.children['o'].end is True, 'the o node should be marked'"),
        t.check('a shared start is stored once', "root = TrieNode()\ninsert(root, 'tea')\ninsert(root, 'ten')\nassert list(root.children) == ['t']\nassert sorted(root.children['t'].children['e'].children) == ['a', 'n']"),
        t.check('a word inside a longer word', words("root = TrieNode()\ninsert(root, 'cart')\ninsert(root, 'car')\nassert _words(root) == ['car', 'cart'], f'trie holds {_words(root)}'"), true),
        t.check('the same word twice', words("root = TrieNode()\ninsert(root, 'hi')\ninsert(root, 'hi')\nassert _words(root) == ['hi'], f'trie holds {_words(root)}'"), true),
        t.check('root itself is not a word', "root = TrieNode()\ninsert(root, 'a')\nassert root.end is False and root.children['a'].end is True", true),
      ],
      hints: [
        'A variable for where you are standing; it starts at the root.',
        'For each letter: create the child if it is missing, then move onto it.',
        'After the last letter you are standing on the node that represents the whole word. Mark it.',
      ],
      note: 'The letters live on the **arrows** (the keys of `children`). The `end` flag lives on the node the last arrow leads to.',
      explanation: 'The walk is the dict-of-dicts walk; the one new line is setting `end` after the loop, on the node where the word finishes.',
      signature: 'trie:insert',
      minutes: 7,
      important: true,
    }),
    debug({
      id: 'tr-dbg-no-advance',
      title: 'Debug: a very flat trie',
      skills: ['trie_node', 'string_iterate'],
      prompt:
        '`add_word(root, word)` should store `word` in the trie: one node per letter, each below the one before, with the last one marked as the end of a word. Make the tests pass.',
      brokenCode: `${NODE}


def add_word(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
    node.end = True`,
      solution: `${NODE}


def add_word(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
        node = node.children[ch]
    node.end = True`,
      tests: [
        t.check('at is a chain of two nodes', "root = TrieNode()\nadd_word(root, 'at')\nassert list(root.children) == ['a'], f'root has children {sorted(root.children)}'\nassert root.children['a'].children['t'].end is True"),
        t.check('the root is not marked', "root = TrieNode()\nadd_word(root, 'at')\nassert root.end is False", true),
        t.check('two words', words("root = TrieNode()\nadd_word(root, 'at')\nadd_word(root, 'an')\nassert _words(root) == ['an', 'at'], f'trie holds {_words(root)}'"), true),
      ],
      hints: ['After the loop, which node is `node`?', 'Each letter needs two actions. Only one of them is here.'],
      explanation: 'Without stepping down, every letter is hung on the root and the root gets the end flag. Create if missing, **then move**.',
      signature: 'debug:trie-insert-no-advance',
      minutes: 4,
    }),
    write({
      id: 'tr-build-trie',
      title: 'Build a trie from a word list',
      ...combine,
      difficulty: 3,
      skills: ['trie_node', 'string_iterate', 'dict_membership', 'list_iterate'],
      prompt:
        'From memory, both halves. Write `class TrieNode` (a `children` dict and an `end` flag), then `build_trie(words)` that returns the root of a trie holding every word in the list.\n\n`build_trie([\'an\', \'at\'])` returns a root with one child, `\'a\'`. That node has children `\'n\'` and `\'t\'`, both marked as word ends.',
      starterCode: `${NODE_BLANK}


def build_trie(words):
    pass`,
      solution: `${NODE}


def build_trie(words):
    root = TrieNode()
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True
    return root`,
      tests: [
        t.check('an and at', "root = build_trie(['an', 'at'])\nassert list(root.children) == ['a']\na = root.children['a']\nassert a.end is False\nassert sorted(a.children) == ['n', 't']\nassert a.children['n'].end is True and a.children['t'].end is True"),
        t.check('no words', "root = build_trie([])\nassert root.children == {} and root.end is False"),
        t.check('nested and repeated words', words("root = build_trie(['go', 'gone', 'go', 'a'])\nassert _words(root) == ['a', 'go', 'gone'], f'trie holds {_words(root)}'"), true),
        t.check('one letter', "root = build_trie(['x'])\nassert root.children['x'].end is True and root.children['x'].children == {}", true),
        t.check('separate tries', "r1 = build_trie(['ab'])\nr2 = build_trie(['cd'])\nassert list(r1.children) == ['a'] and list(r2.children) == ['c']", true),
      ],
      hints: [
        'One root for the whole list; one walk per word.',
        'Where must the "where am I standing" variable go back to at the start of every word?',
        'The end flag is set once per word, after its last letter.',
      ],
      explanation: 'One root, and for each word a fresh walk from that root. Resetting the walking variable per word is the only thing the outer loop adds.',
      signature: 'trie:build-from-words',
      minutes: 12,
      important: true,
    }),
  ],
}

const trSearch: PackSection = {
  id: 'tr-search',
  module: TRIES,
  title: 'Searching a trie',
  summary: 'Walk without creating: a missing child means no, and the end flag means a whole word.',
  exercises: [
    code({
      id: 'tr-find-node',
      title: 'Where does this text lead?',
      style: 'from-signature',
      skills: ['trie_search', 'early_return', 'string_iterate'],
      prompt:
        "`TrieNode` and `insert` are given. Write `find_node(root, text)`. Walk down from `root` one letter of `text` at a time and return the node you arrive at. If a letter has no child, return `None` straight away. Never create nodes here.\n\nWith only `'car'` inserted: `find_node(root, 'ca')` is the node the `a` arrow leads to, and `find_node(root, 'co')` is `None`.",
      starterCode: `${NODE}


${INSERT}


def find_node(root, text):
    pass`,
      solution: `${NODE}


${INSERT}


def find_node(root, text):
    node = root
    for ch in text:
        if ch not in node.children:
            return None
        node = node.children[ch]
    return node`,
      tests: [
        t.check('follows the letters', "root = TrieNode()\ninsert(root, 'car')\nassert find_node(root, 'ca') is root.children['c'].children['a']"),
        t.check('a missing letter gives None and creates nothing', "root = TrieNode()\ninsert(root, 'car')\nassert find_node(root, 'co') is None\nassert 'o' not in root.children['c'].children, 'searching must not add nodes'"),
        t.check('empty text is the root', "root = TrieNode()\ninsert(root, 'car')\nassert find_node(root, '') is root", true),
        t.check('past the end of a word', "root = TrieNode()\ninsert(root, 'car')\nassert find_node(root, 'cars') is None\nassert find_node(root, 'car').end is True", true),
        t.check('empty trie', "assert find_node(TrieNode(), 'a') is None", true),
      ],
      hints: ['Same walk as insert. What changes when the letter is missing?', 'Leave the function the moment a letter has no child.', 'If the loop finishes, you are standing on the answer.'],
      explanation: 'Insert creates a missing child; search gives up on one. Everything else about the walk is identical.',
      signature: 'trie:find-node',
      minutes: 7,
    }),
    code({
      id: 'tr-has-word',
      title: 'Is this whole word stored?',
      style: 'from-signature',
      skills: ['trie_search', 'early_return', 'string_iterate'],
      prompt:
        "Write `has_word(root, word)`. Return `True` only if exactly `word` was inserted. A stretch of letters that merely leads somewhere is not enough.\n\nWith `'car'` and `'cart'` inserted: `'car'` → `True`, `'cart'` → `True`, `'ca'` → `False`, `'cat'` → `False`.",
      starterCode: `${NODE}


${INSERT}


def has_word(root, word):
    pass`,
      solution: `${NODE}


${INSERT}


def has_word(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return node.end`,
      tests: [
        t.check('stored words are found', "root = TrieNode()\ninsert(root, 'car')\ninsert(root, 'cart')\nassert has_word(root, 'car') is True\nassert has_word(root, 'cart') is True"),
        t.check('a start of a word is not a word', "root = TrieNode()\ninsert(root, 'car')\ninsert(root, 'cart')\nassert has_word(root, 'ca') is False\nassert has_word(root, 'cat') is False"),
        t.check('longer than anything stored', "root = TrieNode()\ninsert(root, 'car')\nassert has_word(root, 'cars') is False", true),
        t.check('empty trie and empty word', "root = TrieNode()\nassert has_word(root, 'a') is False\nassert has_word(root, '') is False", true),
        t.check('searching adds nothing', "root = TrieNode()\ninsert(root, 'hi')\nhas_word(root, 'ho')\nassert list(root.children['h'].children) == ['i']", true),
      ],
      hints: ['Two ways to fail: the path breaks, or the path exists but no word stops there.', 'After the walk, the node you stand on already knows whether a word ends on it.'],
      note: 'Reaching a node proves the letters are a **path**. Only the `end` flag proves they are a **word**.',
      explanation: 'A broken path is False; a complete path is only as true as the end flag on its last node.',
      signature: 'trie:search-whole-word',
      minutes: 7,
      important: true,
    }),
    debug({
      id: 'tr-dbg-no-end',
      title: 'Debug: nothing is ever found',
      skills: ['trie_node', 'trie_search'],
      prompt:
        '`add_all(root, words)` should store every word of the list, so that afterwards `has_word` is `True` for exactly those words. `has_word` is correct. Make the tests pass.',
      brokenCode: `${NODE}


def add_all(root, words):
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]


def has_word(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return node.end`,
      solution: `${NODE}


def add_all(root, words):
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True


def has_word(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return node.end`,
      tests: [
        t.check('stored words are found', "root = TrieNode()\nadd_all(root, ['hi', 'him'])\nassert has_word(root, 'hi') is True\nassert has_word(root, 'him') is True"),
        t.check('only whole words count', "root = TrieNode()\nadd_all(root, ['hi', 'him'])\nassert has_word(root, 'h') is False, 'h was never added'"),
        t.check('one long word', "root = TrieNode()\nadd_all(root, ['tree'])\nassert has_word(root, 'tree') is True\nassert has_word(root, 'tre') is False and has_word(root, 't') is False", true),
        t.check('no words', "root = TrieNode()\nadd_all(root, [])\nassert has_word(root, '') is False", true),
      ],
      hints: ['The nodes are all there. What does `has_word` look at on its last line?', 'Where in `add_all` are you standing on the node for a finished word? Mind the indentation: once per word, not once per letter.'],
      explanation: 'The path was built but never marked. The flag is set after the inner loop, once per word; inside the loop it would mark every prefix as a word.',
      signature: 'debug:trie-insert-no-end',
      minutes: 4,
    }),
  ],
}

const trPrefix: PackSection = {
  id: 'tr-prefix',
  module: TRIES,
  title: 'Prefixes',
  summary: 'What a trie is for: everything that starts with these letters.',
  exercises: [
    code({
      id: 'tr-any-starts-with',
      title: 'Does anything start with this?',
      style: 'from-signature',
      skills: ['trie_search', 'early_return', 'string_iterate'],
      prompt:
        "Write `any_starts_with(root, prefix)`. Return `True` if at least one stored word begins with `prefix`. A stored word counts as starting with itself.\n\nWith `'car'` inserted: `'ca'` → `True`, `'car'` → `True`, `'cars'` → `False`, `'o'` → `False`.",
      starterCode: `${NODE}


${INSERT}


def any_starts_with(root, prefix):
    pass`,
      solution: `${NODE}


${INSERT}


def any_starts_with(root, prefix):
    node = root
    for ch in prefix:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return True`,
      tests: [
        t.check('starts of a stored word', "root = TrieNode()\ninsert(root, 'car')\nassert any_starts_with(root, 'ca') is True\nassert any_starts_with(root, 'car') is True"),
        t.check('paths that break', "root = TrieNode()\ninsert(root, 'car')\nassert any_starts_with(root, 'cars') is False\nassert any_starts_with(root, 'o') is False"),
        t.check('empty trie', "assert any_starts_with(TrieNode(), 'a') is False", true),
        t.check('several words', "root = TrieNode()\ninsert(root, 'dog')\ninsert(root, 'door')\nassert any_starts_with(root, 'do') is True\nassert any_starts_with(root, 'doo') is True\nassert any_starts_with(root, 'dot') is False", true),
      ],
      hints: ['Every node in the trie was created on the way to some word.', 'So if the walk does not break, what do you already know?'],
      note: 'Whole word: the path exists **and** `end` is set. Prefix: the path exists. One line of difference.',
      explanation: 'Nodes only exist because some word passes through them, so surviving the walk is the whole answer. The end flag is not consulted.',
      signature: 'trie:starts-with',
      minutes: 7,
    }),
    debug({
      id: 'tr-dbg-prefix-true',
      title: 'Debug: the bot obeys half a command',
      skills: ['trie_search', 'trie_node'],
      prompt:
        'A chat bot keeps its commands in a trie. `is_command(root, text)` should be `True` only when `text` is exactly one of the stored commands. Make the tests pass.',
      brokenCode: `${NODE}


${INSERT}


def is_command(root, text):
    node = root
    for ch in text:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return True`,
      solution: `${NODE}


${INSERT}


def is_command(root, text):
    node = root
    for ch in text:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return node.end`,
      tests: [
        t.check('real commands', "root = TrieNode()\ninsert(root, 'help')\ninsert(root, 'hello')\nassert is_command(root, 'help') is True\nassert is_command(root, 'hello') is True"),
        t.check('half a command', "root = TrieNode()\ninsert(root, 'help')\ninsert(root, 'hello')\nassert is_command(root, 'hel') is False, 'hel is not a command'"),
        t.check('nothing typed', "root = TrieNode()\ninsert(root, 'help')\nassert is_command(root, '') is False", true),
        t.check('too long, and unknown', "root = TrieNode()\ninsert(root, 'help')\nassert is_command(root, 'helps') is False\nassert is_command(root, 'stop') is False", true),
      ],
      hints: ['Which of the two questions is this code answering: "is it a word" or "does anything start with it"?'],
      explanation: 'Surviving the walk only proves a prefix. For an exact word the last node must carry the end flag.',
      signature: 'debug:trie-search-prefix-as-word',
      minutes: 4,
    }),
    code({
      id: 'tr-count-prefix',
      title: 'How many words start with this?',
      ...combine,
      difficulty: 3,
      style: 'from-signature',
      skills: ['trie_search', 'trie_node', 'recursion_return', 'accumulator'],
      prompt:
        'Two functions.\n\n`count_words(node)`: how many stored words end at `node` or anywhere below it. Recursive: this node counts 1 if it is a word end, plus whatever each child reports.\n\n`count_with_prefix(root, prefix)`: how many stored words begin with `prefix`. Walk down to the node the letters of `prefix` lead to, then count from there. If the path breaks, no word starts that way.\n\nWith `\'car\'`, `\'cart\'`, `\'cat\'`, `\'dog\'` inserted: `count_with_prefix(root, \'ca\')` → `3`, `\'car\'` → `2`, `\'x\'` → `0`.',
      starterCode: `${NODE}


${INSERT}


def count_words(node):
    pass


def count_with_prefix(root, prefix):
    pass`,
      solution: `${NODE}


${INSERT}


def count_words(node):
    total = 1 if node.end else 0
    for child in node.children.values():
        total += count_words(child)
    return total


def count_with_prefix(root, prefix):
    node = root
    for ch in prefix:
        if ch not in node.children:
            return 0
        node = node.children[ch]
    return count_words(node)`,
      tests: [
        t.check('count by prefix', "root = TrieNode()\nfor w in ['car', 'cart', 'cat', 'dog']:\n    insert(root, w)\nassert count_with_prefix(root, 'ca') == 3, f\"ca gave {count_with_prefix(root, 'ca')}\"\nassert count_with_prefix(root, 'car') == 2\nassert count_with_prefix(root, 'x') == 0"),
        t.check('count below a node', "root = TrieNode()\nfor w in ['car', 'cart', 'cat', 'dog']:\n    insert(root, w)\nassert count_words(root) == 4\nassert count_words(root.children['d']) == 1"),
        t.check('empty trie', "assert count_words(TrieNode()) == 0\nassert count_with_prefix(TrieNode(), 'a') == 0", true),
        t.check('empty prefix means every word', "root = TrieNode()\nfor w in ['a', 'ab', 'b']:\n    insert(root, w)\nassert count_with_prefix(root, '') == 3", true),
        t.check('prefix longer than any word', "root = TrieNode()\ninsert(root, 'car')\nassert count_with_prefix(root, 'cars') == 0\nassert count_with_prefix(root, 'car') == 1", true),
      ],
      hints: [
        '`count_words` has the shape of a tree recursion, except a node has any number of children instead of left and right.',
        'The children are the **values** of the `children` dict.',
        'A leaf needs no special case: the loop over its children simply does not run.',
        '`count_with_prefix` is the search walk; only the two return values change.',
      ],
      explanation: 'The walk finds the subtree; the recursion sums it. A node with no children returns just its own 0 or 1, so no explicit base case is needed.',
      signature: 'trie:count-with-prefix',
      minutes: 11,
    }),
    code({
      id: 'tr-words-with-prefix',
      title: 'Autocomplete',
      ...pattern,
      difficulty: 3,
      style: 'from-signature',
      skills: ['trie_search', 'trie_node', 'recursion_base_case', 'list_append'],
      prompt:
        'Two functions.\n\n`collect(node, text, found)`: `text` is the string of letters that leads to `node`. Append to the list `found` every stored word that ends at `node` or below it. Going down to a child adds that child\'s letter to `text`.\n\n`words_with_prefix(root, prefix)`: a **sorted** list of every stored word that begins with `prefix`.\n\nWith `\'car\'`, `\'cart\'`, `\'cat\'`, `\'dog\'` inserted: `words_with_prefix(root, \'ca\')` → `[\'car\', \'cart\', \'cat\']`',
      starterCode: `${NODE}


${INSERT}


def collect(node, text, found):
    pass


def words_with_prefix(root, prefix):
    pass`,
      solution: `${NODE}


${INSERT}


def collect(node, text, found):
    if node.end:
        found.append(text)
    for ch in node.children:
        collect(node.children[ch], text + ch, found)


def words_with_prefix(root, prefix):
    node = root
    for ch in prefix:
        if ch not in node.children:
            return []
        node = node.children[ch]
    found = []
    collect(node, prefix, found)
    return sorted(found)`,
      tests: [
        t.check('words under ca', "root = TrieNode()\nfor w in ['car', 'cart', 'cat', 'dog']:\n    insert(root, w)\nassert words_with_prefix(root, 'ca') == ['car', 'cart', 'cat'], f\"got {words_with_prefix(root, 'ca')}\""),
        t.check('one match, no match', "root = TrieNode()\nfor w in ['car', 'cart', 'cat', 'dog']:\n    insert(root, w)\nassert words_with_prefix(root, 'do') == ['dog']\nassert words_with_prefix(root, 'x') == []"),
        t.check('collect from the root', "root = TrieNode()\nfor w in ['b', 'ab', 'a']:\n    insert(root, w)\nfound = []\ncollect(root, '', found)\nassert sorted(found) == ['a', 'ab', 'b'], f'found {sorted(found)}'", true),
        t.check('the prefix is itself a word', "root = TrieNode()\nfor w in ['car', 'cart']:\n    insert(root, w)\nassert words_with_prefix(root, 'cart') == ['cart']\nassert words_with_prefix(root, 'car') == ['car', 'cart']", true),
        t.check('empty trie', "assert words_with_prefix(TrieNode(), 'a') == []\nassert words_with_prefix(TrieNode(), '') == []", true),
      ],
      hints: [
        'A node does not know which letters lead to it. That is why `text` travels down with the recursion.',
        'In `collect`: is this node a word end? Then `text` is a word. After that, visit every child with one more letter on `text`.',
        'Looping over `node.children` gives the letters; the child node is the value stored under each letter.',
        '`words_with_prefix`: walk to the prefix node (no node, no words), start an empty list, and collect from there with the prefix as the starting text.',
      ],
      explanation: 'Walk to the prefix, then a DFS that carries the letters so far. Every end flag met on the way is one finished word.',
      signature: 'trie:collect-with-prefix',
      minutes: 13,
    }),
  ],
}

// ── Tries: mastery check ─────────────────────────────────────────────────────

const trCheck: PackSection = {
  id: 'tr-check',
  module: TRIES,
  title: 'Tries check',
  summary: 'Four cold reps: the node, the insert walk, and the two kinds of search.',
  gate: true,
  exercises: [
    write({
      id: 'tr-chk-count-nodes',
      title: 'How big is the trie?',
      ...cold,
      difficulty: 3,
      skills: ['trie_node', 'string_iterate', 'dict_membership', 'accumulator'],
      prompt:
        'Write `class TrieNode` (fields `children` and `end`) and `count_nodes(words)`: build a trie holding every word, and return how many nodes it took, not counting the root.\n\n`count_nodes([\'tea\', \'ten\'])` → `4` (t, e, a, n)',
      starterCode: `${NODE_BLANK}


def count_nodes(words):
    pass`,
      solution: `${NODE}


def count_nodes(words):
    root = TrieNode()
    made = 0
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
                made += 1
            node = node.children[ch]
        node.end = True
    return made`,
      tests: [
        t.eq("count_nodes(['tea', 'ten'])", '4'),
        t.eq("count_nodes(['a', 'b'])", '2'),
        t.check('TrieNode has both fields', 'n = TrieNode()\nassert n.children == {} and n.end is False'),
        t.hidden('count_nodes([])', '0'),
        t.hidden("count_nodes(['go', 'go', 'go'])", '2'),
        t.hidden("count_nodes(['car', 'cart', 'ca'])", '4'),
        t.hidden("count_nodes(['ab', 'ba'])", '4'),
      ],
      hints: ['When exactly does the trie gain a node?'],
      explanation: 'A node is created only when a letter is missing on the current level, so that is the one place to count.',
      signature: 'trie:cold-count-nodes',
      minutes: 12,
    }),
    write({
      id: 'tr-chk-only-prefix',
      title: 'Started but not finished',
      ...cold,
      difficulty: 3,
      skills: ['trie_search', 'trie_node', 'early_return'],
      prompt:
        'Write `class TrieNode` (fields `children` and `end`) and `is_unfinished(root, text)`: `True` when the non-empty `text` is the beginning of a stored word but is **not** a stored word itself. Otherwise `False`.\n\nWith `\'go\'` and `\'gone\'` stored: `\'g\'` → `True`, `\'gon\'` → `True`, `\'go\'` → `False`, `\'gone\'` → `False`, `\'x\'` → `False`.',
      starterCode: `${NODE_BLANK}


def is_unfinished(root, text):
    pass`,
      solution: `${NODE}


def is_unfinished(root, text):
    node = root
    for ch in text:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return not node.end`,
      tests: [
        t.check('one stored word: go', "root = TrieNode()\ng = TrieNode()\no = TrieNode()\nroot.children['g'] = g\ng.children['o'] = o\no.end = True\nassert is_unfinished(root, 'g') is True\nassert is_unfinished(root, 'go') is False\nassert is_unfinished(root, 'x') is False"),
        t.check('go and gone', mk("root = _mk(['go', 'gone'])\nassert is_unfinished(root, 'gon') is True\nassert is_unfinished(root, 'gone') is False\nassert is_unfinished(root, 'go') is False\nassert is_unfinished(root, 'goner') is False"), true),
        t.check('empty trie', "assert is_unfinished(TrieNode(), 'a') is False", true),
        t.check('searching adds nothing', mk("root = _mk(['hi'])\nis_unfinished(root, 'ho')\nassert list(root.children['h'].children) == ['i']"), true),
      ],
      hints: ['Two separate facts about `text`: does its path exist, and does a word stop at the end of it?'],
      explanation: 'The path must exist, and the node it ends on must not be marked. Both questions are answered by one walk.',
      signature: 'trie:cold-prefix-not-word',
      minutes: 9,
    }),
    write({
      id: 'tr-chk-longest-word-start',
      title: 'The longest stored word at the front',
      ...cold,
      difficulty: 3,
      skills: ['trie_search', 'trie_node', 'slicing', 'enumerate'],
      prompt:
        'Write `class TrieNode` (fields `children` and `end`) and `longest_stored_start(root, text)`: the longest stored word that `text` begins with, or `\'\'` if there is none.\n\nWith `\'ca\'` and `\'cat\'` stored: `\'catalog\'` → `\'cat\'`, `\'cab\'` → `\'ca\'`, `\'cot\'` → `\'\'`.',
      starterCode: `${NODE_BLANK}


def longest_stored_start(root, text):
    pass`,
      solution: `${NODE}


def longest_stored_start(root, text):
    node = root
    best = ''
    for i, ch in enumerate(text):
        if ch not in node.children:
            return best
        node = node.children[ch]
        if node.end:
            best = text[:i + 1]
    return best`,
      tests: [
        t.check('ca and cat', "root = TrieNode()\nc = TrieNode()\na = TrieNode()\nt_node = TrieNode()\nroot.children['c'] = c\nc.children['a'] = a\na.children['t'] = t_node\na.end = True\nt_node.end = True\nassert longest_stored_start(root, 'catalog') == 'cat', f\"got {longest_stored_start(root, 'catalog')!r}\"\nassert longest_stored_start(root, 'cab') == 'ca'\nassert longest_stored_start(root, 'cot') == ''"),
        t.check('the text is itself a stored word', mk("root = _mk(['a', 'app', 'apple'])\nassert longest_stored_start(root, 'apple') == 'apple'\nassert longest_stored_start(root, 'application') == 'app'\nassert longest_stored_start(root, 'ap') == 'a'"), true),
        t.check('text shorter than every word', mk("root = _mk(['hello'])\nassert longest_stored_start(root, 'hel') == ''\nassert longest_stored_start(root, '') == ''"), true),
        t.check('empty trie', "assert longest_stored_start(TrieNode(), 'abc') == ''", true),
      ],
      hints: ['On the way down you may pass more than one word end. Which one do you want to remember?'],
      explanation: 'One walk along `text`, remembering the most recent end flag passed. When the path breaks, the last one remembered is the longest.',
      signature: 'trie:cold-longest-word-prefix-of-text',
      minutes: 11,
    }),
    write({
      id: 'tr-chk-forget',
      title: 'Forget a word',
      ...cold,
      difficulty: 3,
      skills: ['trie_search', 'trie_node', 'early_return'],
      prompt:
        'Write `class TrieNode` (fields `children` and `end`) and `forget(root, word)`: make `word` no longer count as stored, and return `True` if it was stored before the call, `False` if it was not. Leave the nodes where they are; longer words that pass through must still be stored.\n\nWith `\'go\'` and `\'gone\'` stored: `forget(root, \'go\')` → `True`, and afterwards `\'gone\'` is still stored but `\'go\'` is not. `forget(root, \'gon\')` → `False`.',
      starterCode: `${NODE_BLANK}


def forget(root, word):
    pass`,
      solution: `${NODE}


def forget(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            return False
        node = node.children[ch]
    was_stored = node.end
    node.end = False
    return was_stored`,
      tests: [
        t.check('forget the only word', "root = TrieNode()\nh = TrieNode()\ni = TrieNode()\nroot.children['h'] = h\nh.children['i'] = i\ni.end = True\nassert forget(root, 'hi') is True\nassert i.end is False\nassert forget(root, 'hi') is False, 'it was already forgotten'"),
        t.check('not a stored word', "root = TrieNode()\nh = TrieNode()\ni = TrieNode()\nroot.children['h'] = h\nh.children['i'] = i\ni.end = True\nassert forget(root, 'h') is False\nassert forget(root, 'ho') is False\nassert i.end is True"),
        t.check('longer words survive', mk(`${WORDS}\nroot = _mk(['go', 'gone', 'a'])\nassert forget(root, 'go') is True\nassert _words(root) == ['a', 'gone'], f'trie holds {_words(root)}'`), true),
        t.check('a path that is not a word', mk(`${WORDS}\nroot = _mk(['gone'])\nassert forget(root, 'gon') is False\nassert forget(root, 'goner') is False\nassert _words(root) == ['gone']`), true),
        t.check('empty trie', "assert forget(TrieNode(), 'a') is False", true),
      ],
      hints: ['What single thing makes a path count as a word?'],
      explanation: 'A word is a path plus a flag. Clearing the flag forgets the word and leaves every longer word untouched.',
      signature: 'trie:cold-unmark-word',
      minutes: 11,
    }),
  ],
}

// ── Tries: LC 208 ────────────────────────────────────────────────────────────

const br208: PackSection = {
  id: 'br-208',
  module: TRIES,
  title: 'Toward Implement Trie (Prefix Tree)',
  summary: 'The same walks, packaged as methods on a class that owns its root.',
  exercises: [
    code({
      id: 'b208-word-set',
      title: 'A trie inside a class',
      style: 'from-signature',
      skills: ['trie_node', 'trie_search', 'string_iterate'],
      prompt:
        'Same moves, new packaging: the trie lives **inside** an object. `WordSet()` creates its own root node in `__init__` and keeps it as `self.root`. The methods start their walk from `self.root` instead of being handed a root.\n\nFinish `WordSet`: `add(word)` stores a word; `has(word)` returns `True` only for a whole stored word.\n\n```python\nws = WordSet()\nws.add(\'tea\')\nws.has(\'tea\')   # True\nws.has(\'te\')    # False\n```',
      starterCode: `${NODE}


class WordSet:
    def __init__(self):
        pass

    def add(self, word):
        pass

    def has(self, word):
        pass`,
      solution: `${NODE}


class WordSet:
    def __init__(self):
        self.root = TrieNode()

    def add(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True

    def has(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.end`,
      tests: [
        t.check('add then has', "ws = WordSet()\nws.add('tea')\nassert ws.has('tea') is True\nassert ws.has('te') is False\nassert ws.has('ten') is False"),
        t.check('two sets do not share words', "a = WordSet()\nb = WordSet()\na.add('hi')\nassert a.has('hi') is True\nassert b.has('hi') is False, 'a word added to one set appeared in another'"),
        t.check('nothing added yet', "ws = WordSet()\nassert ws.has('a') is False\nassert ws.has('') is False", true),
        t.check('nested words', "ws = WordSet()\nws.add('cart')\nassert ws.has('car') is False\nws.add('car')\nassert ws.has('car') is True and ws.has('cart') is True and ws.has('carts') is False", true),
      ],
      hints: [
        'In `__init__`, make one `TrieNode` and store it on `self`.',
        'Each method is a function you have already written, with one change: where the walk starts.',
        'Inside a method, the object\'s own fields are reached through `self.`',
      ],
      note: 'A method is a function written inside a class, indented under it. Its first parameter, `self`, is the object it was called on: `ws.add(\'tea\')` runs `add` with `self` being `ws` and `word` being `\'tea\'`. You never pass `self` yourself.',
      explanation: 'The root moved from a parameter to a field. `node = self.root` is the only line that differs from the function versions.',
      signature: 'trie:class-add-has',
      minutes: 12,
    }),
    write({
      id: 'b208-prefix-tally',
      title: 'Count by prefix, from a blank class',
      ...pattern,
      difficulty: 3,
      skills: ['trie_node', 'trie_search', 'string_iterate', 'accumulator'],
      transfer: true,
      prompt:
        'Write `PrefixTally` from blank classes. `add(word)` records a word; the same word may be added several times and counts every time. `count(prefix)` returns how many recorded words begin with the non-empty `prefix`.\n\n`count` must stay quick however many words have been recorded: one walk along the letters of `prefix`, without looking through the words and without exploring anything beyond those letters. The starter\'s `TrieNode` is empty on purpose: decide what a node has to remember.\n\n```python\npt = PrefixTally()\npt.add(\'tea\')\npt.add(\'ten\')\npt.add(\'to\')\npt.count(\'te\')   # 2\npt.count(\'t\')    # 3\npt.count(\'x\')    # 0\n```',
      starterCode: `class TrieNode:
    def __init__(self):
        pass


class PrefixTally:
    def __init__(self):
        pass

    def add(self, word):
        pass

    def count(self, prefix):
        pass`,
      solution: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.passed = 0


class PrefixTally:
    def __init__(self):
        self.root = TrieNode()

    def add(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            node.passed += 1

    def count(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return 0
            node = node.children[ch]
        return node.passed`,
      tests: [
        t.check('tea, ten, to', "pt = PrefixTally()\npt.add('tea')\npt.add('ten')\npt.add('to')\nassert pt.count('te') == 2, f\"te gave {pt.count('te')}\"\nassert pt.count('t') == 3\nassert pt.count('x') == 0"),
        t.check('a whole word is its own prefix', "pt = PrefixTally()\npt.add('tea')\nassert pt.count('tea') == 1\nassert pt.count('teas') == 0"),
        t.check('the same word twice counts twice', "pt = PrefixTally()\npt.add('go')\npt.add('go')\npt.add('gone')\nassert pt.count('go') == 3\nassert pt.count('gon') == 1", true),
        t.check('nothing added', "pt = PrefixTally()\nassert pt.count('a') == 0", true),
        t.check('two tallies are separate', "a = PrefixTally()\nb = PrefixTally()\na.add('hi')\nassert a.count('h') == 1 and b.count('h') == 0", true),
      ],
      hints: [
        'Three things to write: the node, the class that owns a root, and two walks.',
        'Give every node a number: how many added words have passed through it. Keep it up to date in `add`. This node needs no end flag.',
        'A word "passes through" every node on its path. When, during `add`, are you standing on each of them?',
        '`count` is a search walk. What does the node at the end of the prefix already know?',
      ],
      explanation: 'Bumping a number on every node the insert walk lands on turns "how many words start with this" into a single walk and a read.',
      signature: 'trie:class-prefix-tally',
      minutes: 15,
    }),
  ],
}

// ── Tries: LC 211 ────────────────────────────────────────────────────────────

const br211: PackSection = {
  id: 'br-211',
  module: TRIES,
  title: 'Toward Design Add and Search Words Data Structure',
  summary: 'Search by recursion, so that one position can try every child.',
  exercises: [
    code({
      id: 'b211-has-from',
      title: 'The search walk, recursively',
      style: 'from-signature',
      skills: ['trie_search', 'recursion_base_case', 'string_index'],
      prompt:
        'So far the search walk was a loop. Write it **recursively**: `has_from(node, word, i)` answers "starting at `node`, do the letters from position `i` of `word` onward lead to the end of a stored word?"\n\n- when `i` has reached `len(word)` there are no letters left, so the answer is this node\'s end flag\n- otherwise look at the letter `word[i]`: with no such child the answer is `False`; with one, ask the same question of that child at `i + 1`\n\nWith `\'car\'` inserted: `has_from(root, \'car\', 0)` → `True`, `has_from(root, \'ca\', 0)` → `False`.',
      starterCode: `${NODE}


${INSERT}


def has_from(node, word, i):
    pass`,
      solution: `${NODE}


${INSERT}


def has_from(node, word, i):
    if i == len(word):
        return node.end
    ch = word[i]
    if ch not in node.children:
        return False
    return has_from(node.children[ch], word, i + 1)`,
      tests: [
        t.check('whole words only', "root = TrieNode()\ninsert(root, 'car')\nassert has_from(root, 'car', 0) is True\nassert has_from(root, 'ca', 0) is False\nassert has_from(root, 'cat', 0) is False"),
        t.check('starting further down', "root = TrieNode()\ninsert(root, 'car')\nc = root.children['c']\nassert has_from(c, 'car', 1) is True, 'from the c node, the letters a r remain'"),
        t.check('longer than the stored word', "root = TrieNode()\ninsert(root, 'car')\nassert has_from(root, 'cars', 0) is False", true),
        t.check('empty trie and empty word', "root = TrieNode()\nassert has_from(root, 'a', 0) is False\nassert has_from(root, '', 0) is False", true),
        t.check('nested words', "root = TrieNode()\ninsert(root, 'go')\ninsert(root, 'gone')\nassert has_from(root, 'go', 0) is True and has_from(root, 'gon', 0) is False and has_from(root, 'gone', 0) is True", true),
      ],
      hints: [
        'The base case comes first: no letters left.',
        'Otherwise handle exactly one letter here and let the recursive call deal with the rest.',
        'The recursive call moves both things on: the node becomes the child, the position goes up by one.',
      ],
      note: 'A loop keeps `node` in a variable. The recursive version passes it along: each call stands on one node and looks at one letter.',
      explanation: 'One call per letter: the node and the position travel as arguments. In this shape a single position can branch, which a plain loop cannot do.',
      signature: 'trie:search-recursive-index',
      minutes: 7,
    }),
    code({
      id: 'b211-has-length',
      title: 'Any letter will do',
      style: 'from-signature',
      skills: ['trie_wildcard', 'recursion_base_case', 'early_return'],
      prompt:
        'Now a search where you do not know the letters at all. Write `has_length(node, n)`: `True` if, starting at `node`, some path of exactly `n` letters ends on a stored word.\n\n- `n == 0`: no letters left, so the answer is this node\'s end flag\n- otherwise you cannot know which letter to follow, so try **every** child with `n - 1`; one success is enough\n\nWith `\'car\'` and `\'to\'` inserted: `has_length(root, 2)` → `True`, `has_length(root, 3)` → `True`, `has_length(root, 1)` → `False`.',
      starterCode: `${NODE}


${INSERT}


def has_length(node, n):
    pass`,
      solution: `${NODE}


${INSERT}


def has_length(node, n):
    if n == 0:
        return node.end
    for child in node.children.values():
        if has_length(child, n - 1):
            return True
    return False`,
      tests: [
        t.check('car and to', "root = TrieNode()\ninsert(root, 'car')\ninsert(root, 'to')\nassert has_length(root, 2) is True\nassert has_length(root, 3) is True\nassert has_length(root, 1) is False"),
        t.check('the first branch is not the only branch', "root = TrieNode()\ninsert(root, 'a')\ninsert(root, 'bcd')\nassert has_length(root, 3) is True, 'the 3-letter word is under the second child'\nassert has_length(root, 2) is False"),
        t.check('too long', "root = TrieNode()\ninsert(root, 'car')\nassert has_length(root, 4) is False", true),
        t.check('empty trie', "root = TrieNode()\nassert has_length(root, 0) is False\nassert has_length(root, 1) is False", true),
        t.check('from a node further down', "root = TrieNode()\ninsert(root, 'car')\nassert has_length(root.children['c'], 2) is True\nassert has_length(root.children['c'], 3) is False", true),
      ],
      hints: [
        'The child nodes are the values of `node.children`.',
        'Inside the loop, return only on a success. A child that fails says nothing about the next child.',
        'What is the answer once every child has been tried and none succeeded?',
      ],
      note: 'Try every child: `True` as soon as one works, `False` only after all of them have failed.',
      explanation: 'With no letter to follow, every child is a candidate. Returning True inside the loop and False after it is the "any of these" shape.',
      signature: 'trie:wildcard-every-position',
      minutes: 7,
    }),
    debug({
      id: 'b211-dbg-first-child',
      title: 'Debug: the wildcard gives up early',
      skills: ['trie_wildcard', 'trie_search', 'early_return'],
      prompt:
        '`matches(node, pattern, i)` should say whether some stored word fits `pattern` from position `i` on. In a pattern, `?` is a wildcard: it stands for any single letter and every other character must match exactly.\n\nWith `\'bat\'` and `\'mad\'` stored: `\'?ad\'` → `True`, `\'ma?\'` → `True`, `\'??\'` → `False`.\n\nMake the tests pass.',
      brokenCode: `${NODE}


${INSERT}


def matches(node, pattern, i):
    if i == len(pattern):
        return node.end
    ch = pattern[i]
    if ch == '?':
        for child in node.children.values():
            return matches(child, pattern, i + 1)
        return False
    if ch not in node.children:
        return False
    return matches(node.children[ch], pattern, i + 1)`,
      solution: `${NODE}


${INSERT}


def matches(node, pattern, i):
    if i == len(pattern):
        return node.end
    ch = pattern[i]
    if ch == '?':
        for child in node.children.values():
            if matches(child, pattern, i + 1):
                return True
        return False
    if ch not in node.children:
        return False
    return matches(node.children[ch], pattern, i + 1)`,
      tests: [
        t.check('a wildcard at the front', "root = TrieNode()\ninsert(root, 'bat')\ninsert(root, 'mad')\nassert matches(root, '?ad', 0) is True, '?ad should match mad'"),
        t.check('a wildcard at the back, and the wrong length', "root = TrieNode()\ninsert(root, 'bat')\ninsert(root, 'mad')\nassert matches(root, 'ma?', 0) is True\nassert matches(root, '??', 0) is False"),
        t.check('all wildcards', "root = TrieNode()\ninsert(root, 'a')\ninsert(root, 'bcd')\nassert matches(root, '???', 0) is True\nassert matches(root, '?', 0) is True\nassert matches(root, '??', 0) is False", true),
        t.check('no wildcards', "root = TrieNode()\ninsert(root, 'bat')\nassert matches(root, 'bat', 0) is True\nassert matches(root, 'cat', 0) is False\nassert matches(root, 'ba', 0) is False", true),
        t.check('wildcards that cannot match', "root = TrieNode()\ninsert(root, 'bat')\ninsert(root, 'mad')\nassert matches(root, 'b?d', 0) is False\nassert matches(root, '?a?s', 0) is False\nassert matches(TrieNode(), '?', 0) is False", true),
      ],
      hints: ['In the failing test, which child of the root is tried first, and what happens straight after?', 'How many children does the loop get through before the function is over?'],
      explanation: 'A bare `return` inside the loop ends the search at the first child, whatever it said. Return only on success; False comes after every child has had its turn.',
      signature: 'debug:trie-wildcard-return-first-child',
      minutes: 6,
    }),
    write({
      id: 'b211-pattern-counter',
      title: 'How many words fit the pattern?',
      ...pattern,
      difficulty: 4,
      skills: ['trie_wildcard', 'trie_node', 'trie_search', 'recursion_return'],
      transfer: true,
      prompt:
        'Write `PatternCounter` from blank classes. `add(word)` stores a word (adding the same word again changes nothing). `count(pattern)` returns **how many** stored words fit `pattern`, where `?` stands for any single letter and every other character must match exactly.\n\n```python\npc = PatternCounter()\npc.add(\'bat\')\npc.add(\'bad\')\npc.add(\'mad\')\npc.count(\'?ad\')   # 2\npc.count(\'ba?\')   # 2\npc.count(\'???\')   # 3\npc.count(\'b?\')    # 0\n```\n\nA pattern only fits words of exactly its own length. You may add methods or functions of your own besides `add` and `count`.',
      starterCode: `class TrieNode:
    def __init__(self):
        pass


class PatternCounter:
    def __init__(self):
        pass

    def add(self, word):
        pass

    def count(self, pattern):
        pass`,
      solution: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False


class PatternCounter:
    def __init__(self):
        self.root = TrieNode()

    def add(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True

    def count(self, pattern):
        return self.count_from(self.root, pattern, 0)

    def count_from(self, node, pattern, i):
        if i == len(pattern):
            return 1 if node.end else 0
        ch = pattern[i]
        if ch == '?':
            total = 0
            for child in node.children.values():
                total += self.count_from(child, pattern, i + 1)
            return total
        if ch not in node.children:
            return 0
        return self.count_from(node.children[ch], pattern, i + 1)`,
      tests: [
        t.check('bat, bad, mad', "pc = PatternCounter()\npc.add('bat')\npc.add('bad')\npc.add('mad')\nassert pc.count('?ad') == 2, f\"?ad gave {pc.count('?ad')}\"\nassert pc.count('ba?') == 2\nassert pc.count('???') == 3\nassert pc.count('b?') == 0"),
        t.check('no wildcard', "pc = PatternCounter()\npc.add('bat')\nassert pc.count('bat') == 1\nassert pc.count('bag') == 0\nassert pc.count('ba') == 0"),
        t.check('the same word twice counts once', "pc = PatternCounter()\npc.add('hi')\npc.add('hi')\nassert pc.count('h?') == 1\nassert pc.count('??') == 1", true),
        t.check('nothing stored', "pc = PatternCounter()\nassert pc.count('?') == 0\nassert pc.count('a') == 0", true),
        t.check('different lengths', "pc = PatternCounter()\nfor w in ['a', 'ab', 'abc', 'xbc']:\n    pc.add(w)\nassert pc.count('?') == 1\nassert pc.count('??') == 1\nassert pc.count('?bc') == 2\nassert pc.count('a??') == 1\nassert pc.count('????') == 0", true),
        t.check('two counters are separate', "a = PatternCounter()\nb = PatternCounter()\na.add('hi')\nassert a.count('??') == 1 and b.count('??') == 0", true),
      ],
      note: 'A class may have more methods than the ones asked for. Inside the class, one method calls another through `self`: `self.helper(x, y)` runs `helper` on the same object.',
      hints: [
        'Node, class with a root, and `add` are the ones you know. All the new work is in `count`.',
        'Write a recursive helper that takes a node and a position. The helper answers: "from this node, how many stored words fit the pattern from position `i` on?" What is that number when no positions are left?',
        'An exact letter leads to at most one child. A `?` leads to all of them: what do you do with their answers when the question is "how many"?',
        'A method calls another method of the same object through `self.`',
      ],
      explanation: 'The yes/no search asks whether any child succeeds; counting adds up what every child reports. The base case turns the end flag into 1 or 0.',
      signature: 'trie:class-wildcard-count',
      minutes: 16,
    }),
  ],
}

// ── the pack ─────────────────────────────────────────────────────────────────

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'
const HEAD = { name: 'head', is: 'the first node of a linked list' }
const ROOT = { name: 'root', is: 'the top node of a trie. It stands for "no letters yet".' }

export const pack: Pack = {
  sections: [br141, br19, br143, br23, trNode, trInsert, trSearch, trPrefix, trCheck, br208, br211],

  bridges: [
    {
      lc: 141,
      title: 'Linked List Cycle',
      unit: 'Linked lists',
      section: 'br-141',
      mode: 'bridge-first',
      prerequisiteSkills: ['linked_list_traversal', 'while_loop', 'fast_slow'],
      blocks: [
        { label: 'walk a list node by node', skills: ['linked_list_traversal', 'while_loop'], evidence: ['d05-ll-middle', 'd05-ll-last'] },
        { label: 'move two pointers at different speeds', skills: ['fast_slow'], reps: ['b141-middle'] },
        { label: 'compare the pointers after they move', skills: ['fast_slow'], reps: ['b141-dbg-check-first'] },
        { label: 'tell a loop from an ending', skills: ['fast_slow', 'while_loop'], reps: ['b141-jump-loop'] },
      ],
    },
    {
      lc: 19,
      title: 'Remove Nth Node From End of List',
      unit: 'Linked lists',
      section: 'br-19',
      mode: 'bridge-first',
      prerequisiteSkills: ['linked_list_traversal', 'linked_list_reassignment', 'dummy_node', 'fast_slow'],
      blocks: [
        { label: 'give one pointer a head start of k', skills: ['fast_slow', 'linked_list_traversal'], reps: ['b19-kth-from-end'] },
        { label: 'put a dummy in front of the head', skills: ['dummy_node'], evidence: ['d05-dummy-remove'] },
        { label: 'stop one node before the target', skills: ['fast_slow', 'dummy_node'], reps: ['b19-dbg-chop'] },
        { label: 'rewire at the landing spot', skills: ['linked_list_reassignment', 'fast_slow'], reps: ['b19-insert-from-end'] },
      ],
    },
    {
      lc: 143,
      title: 'Reorder List',
      unit: 'Linked lists',
      section: 'br-143',
      mode: 'bridge-first',
      prerequisiteSkills: ['linked_list_traversal', 'linked_list_reassignment', 'fast_slow'],
      blocks: [
        { label: 'weave two lists together', skills: ['linked_list_reassignment'], reps: ['b143-weave', 'b143-dbg-weave'] },
        { label: 'cut the list at its middle', skills: ['fast_slow', 'linked_list_traversal'], reps: ['b143-split'] },
        { label: 'reverse a list in place', skills: ['linked_list_reassignment', 'linked_list_traversal'], evidence: ['cap-reverse-linked-list'] },
        { label: 'cut, then weave, in place', skills: ['fast_slow', 'linked_list_reassignment'], reps: ['b143-shuffle-halves'] },
        { label: 'cut, reverse, then walk both halves', skills: ['fast_slow', 'linked_list_reassignment'], reps: ['b143-end-pair-sums'] },
      ],
    },
    {
      lc: 23,
      title: 'Merge k Sorted Lists',
      unit: 'Linked lists',
      section: 'br-23',
      mode: 'bridge-first',
      prerequisiteSkills: ['dummy_node', 'linked_list_traversal', 'linked_list_reassignment', 'while_loop', 'list_index'],
      blocks: [
        { label: 'merge two sorted lists', skills: ['dummy_node', 'linked_list_traversal', 'linked_list_reassignment'], evidence: ['cap-merge-two-lists'] },
        { label: 'fold many lists into one', skills: ['linked_list_traversal', 'list_iterate'], reps: ['b23-fold'] },
        { label: 'pair up neighbours for one round', skills: ['list_index', 'range'], reps: ['b23-next-round'] },
        { label: 'repeat rounds until one list is left', skills: ['while_loop', 'list_index'], reps: ['b23-dbg-rounds', 'b23-merge-arrays'] },
      ],
    },
    {
      lc: 208,
      title: 'Implement Trie (Prefix Tree)',
      unit: 'Tries',
      section: 'br-208',
      mode: 'bridge-first',
      prerequisiteSkills: ['trie_node', 'trie_search', 'dict_membership', 'string_iterate'],
      blocks: [
        { label: 'make a node with children and an end flag', skills: ['trie_node'], evidence: ['tr-node-class', 'tr-build-trie'] },
        { label: 'insert a word letter by letter', skills: ['trie_node', 'string_iterate'], evidence: ['tr-insert', 'tr-build-trie'] },
        { label: 'tell a whole word from a prefix', skills: ['trie_search'], evidence: ['tr-has-word', 'tr-any-starts-with'] },
        { label: 'keep the root inside a class', skills: ['trie_node', 'trie_search'], reps: ['b208-word-set', 'b208-prefix-tally'] },
      ],
    },
    {
      lc: 211,
      title: 'Design Add and Search Words Data Structure',
      unit: 'Tries',
      section: 'br-211',
      mode: 'bridge-first',
      prerequisiteSkills: ['trie_node', 'trie_search', 'trie_wildcard', 'recursion_base_case'],
      blocks: [
        { label: 'store words in a trie inside a class', skills: ['trie_node', 'trie_search'], evidence: ['b208-word-set'] },
        { label: 'search recursively, one position per call', skills: ['trie_search', 'recursion_base_case'], reps: ['b211-has-from'] },
        { label: 'try every child on a wildcard', skills: ['trie_wildcard'], reps: ['b211-has-length', 'b211-dbg-first-child'] },
        { label: 'mix exact letters with wildcards', skills: ['trie_wildcard', 'trie_search'], reps: ['b211-pattern-counter'] },
      ],
    },
  ],

  units: {
    Tries: { ladder: ['tr-node', 'tr-insert', 'tr-search', 'tr-prefix'], check: 'tr-check' },
  },

  briefs: {
    // ── LC 141 ──
    'b141-middle': {
      inputs: [{ ...HEAD, is: 'the first node of a linked list with at least one node' }],
      returns: 'the **value** of the middle node. With an even number of nodes, the second of the two middle ones.',
      catch: 'One pointer jumps two nodes at a time. What has to be true just before each jump so that it cannot crash?',
    },
    'b141-dbg-check-first': {
      task: 'It answers `True` far too often. Make it tell a list that ends from one that loops.',
      inputs: [{ ...HEAD, is: 'the first node of a linked list, or `None`. The last node may point back to an earlier node.' }],
      returns: '`True` if the list loops, `False` if it ends.',
      catch: 'Where are the two pointers the very first time they are compared?',
    },
    'b141-jump-loop': {
      inputs: [{ name: 'jumps', is: 'a non-empty list of numbers. `jumps[i]` is the index you go to from index `i`; `-1` means the walk stops.' }],
      returns: '`True` if a walk starting at index 0 goes on forever, `False` if it reaches a `-1`.',
      catch: 'A walk can go round and round without ever coming back to index 0: `[1, 2, 3, 1]` loops.',
    },

    // ── LC 19 ──
    'b19-kth-from-end': {
      inputs: [HEAD, { name: 'k', is: 'a position counted from the end: `1` is the last node. Never larger than the length.' }],
      returns: 'the **value** of that node.',
      catch: 'When the leading pointer has just fallen off the end, how far behind it is the other one?',
    },
    'b19-dbg-chop': {
      task: 'It is right for some values of `k` and crashes for another. Make it right for all of them.',
      inputs: [HEAD, { name: 'k', is: 'how many nodes to cut off the end. From 1 up to the whole length.' }],
      returns: 'the head of what remains, or `None` when every node was cut.',
      catch: 'Which node should the trailing pointer stop on when the whole list is being cut off?',
    },
    'b19-insert-from-end': {
      inputs: [
        HEAD,
        { name: 'k', is: 'a position counted from the end: `1` is the last node. Never larger than the length.' },
        { name: 'val', is: 'the value for the new node' },
      ],
      returns: 'the head of the list after the insert. It is a different node when the new one goes in front of the old head.',
      catch: 'You need the node **before** the insertion point. Is there always one?',
    },

    // ── LC 143 ──
    'b143-weave': {
      inputs: [
        { name: 'a', is: 'the head of the first list, or `None`. Its nodes come first in each pair.' },
        { name: 'b', is: 'the head of the second list, or `None`. Same length as `a`, or one node shorter.' },
      ],
      returns: 'the head of the woven list, which is the original first node of `a`.',
      catch: 'Each turn overwrites two links. What do you need to have kept before that?',
    },
    'b143-dbg-weave': {
      task: 'The tests report a list that never ends. Make it produce b1, a1, b2, a2, … and stop.',
      inputs: [
        { name: 'a', is: 'the head of one list, or `None`' },
        { name: 'b', is: 'the head of the other list, or `None`. Its nodes come first. Same length as `a`, or one longer.' },
      ],
      returns: 'the head of the woven list, which is the first node of `b`.',
      catch: 'Follow one turn of the loop on paper. Does every saved variable hold what its name says?',
    },
    'b143-split': {
      inputs: [{ ...HEAD, is: 'the first node of a linked list with at least one node' }],
      returns: 'the head of the **second half**, or `None` when the list has one node. Afterwards `head` leads only the first half.',
      catch: 'After you find the split point, is the first half actually disconnected from the second?',
    },
    'b143-shuffle-halves': {
      inputs: [{ ...HEAD, is: 'the first node of a linked list, or `None`' }],
      returns: 'nothing. The list itself is rearranged: first-half and second-half nodes alternate.',
      catch: 'What does `weave` do if the first half still runs on into the second?',
    },
    'b143-end-pair-sums': {
      inputs: [{ ...HEAD, is: 'the first node of a linked list with at least one node' }],
      returns: 'a Python list of numbers: outermost pair first, working inward; the unpaired middle value last when the length is odd.',
      catch: 'You can only walk forward. How do you get the last node, then the one before it, then the one before that?',
    },

    // ── LC 23 ──
    'b23-fold': {
      inputs: [{ name: 'lists', is: 'a Python list of linked-list heads. Each linked list is sorted. An entry may be `None`, and the Python list itself may be empty.' }],
      returns: 'the head of one sorted linked list holding every node, or `None` when there are no nodes.',
      catch: 'What do you hold before the first merge has happened?',
    },
    'b23-next-round': {
      inputs: [{ name: 'scores', is: 'a list of numbers, possibly empty, possibly of odd length' }],
      returns: 'a new list: the larger of each neighbouring pair, plus the last one unchanged when it has no partner.',
      catch: 'With five scores, what is the partner of the one at index 4?',
    },
    'b23-dbg-rounds': {
      task: 'With some inputs a whole list disappears from the result. Make every node come through.',
      inputs: [{ name: 'lists', is: 'a Python list of heads of sorted linked lists. Entries may be `None`; the list may be empty.' }],
      returns: 'the head of one sorted linked list with every node, or `None`.',
      catch: 'Compare a run with two lists against a run with three. Which indexes does the pairing loop visit?',
    },
    'b23-merge-arrays': {
      inputs: [{ name: 'arrays', is: 'a list of Python lists of numbers, each sorted ascending. Inner lists may be empty; the outer list may be empty.' }],
      returns: 'one new sorted list containing every number, duplicates included.',
      catch: 'Two different kinds of input have nothing in them. What should each give back?',
    },

    // ── Trie ladder ──
    'tr-nested-trace': {
      task: PREDICT,
      catch: 'After the fifth line, which dict is `node`? Each `in` only looks at one level.',
    },
    'tr-add-path': {
      inputs: [
        { name: 'tree', is: 'a dict of dicts: letter → the dict of letters that can follow. It may already hold other paths.' },
        { name: 'word', is: 'a string of letters to add as a path, possibly empty' },
      ],
      returns: 'the same `tree`, now containing a path for `word`. Existing paths are untouched.',
      catch: 'If a letter is already there, what would assigning a new empty dict do to everything below it?',
    },
    'tr-node-class': {
      task: 'Fill in `__init__` so that every new node gets its own two fields.',
      returns: 'nothing: `__init__` only sets the node up. `TrieNode()` then gives a node with an empty `children` dict and `end` set to `False`.',
      catch: 'The fields belong to the node being created. How does `__init__` refer to that node?',
    },
    'tr-dbg-shared': {
      task: 'A brand new node turns out to have children already. Make every node start empty.',
      inputs: [
        { name: 'parent', is: 'an existing trie node' },
        { name: 'ch', is: 'the letter for the new child' },
      ],
      returns: 'the new child node.',
      catch: 'Count the dicts: how many `{}` are created when the code makes three nodes?',
    },
    'tr-step': {
      inputs: [
        { name: 'node', is: 'a trie node' },
        { name: 'ch', is: 'one letter' },
      ],
      returns: 'the child node for that letter: the existing one if there is one, otherwise a newly created and stored one.',
      catch: 'What is lost if you create a new node when one is already there?',
    },
    'tr-insert': {
      inputs: [ROOT, { name: 'word', is: 'the word to store, at least one letter' }],
      returns: 'nothing. The trie under `root` is changed.',
      catch: 'After the loop, which node are you standing on, and what does it need to remember?',
    },
    'tr-dbg-no-advance': {
      task: 'The trie comes out one level deep however long the word is. Make it one node per letter, each below the last.',
      inputs: [ROOT, { name: 'word', is: 'the word to store' }],
      returns: 'nothing. The trie under `root` is changed.',
      catch: 'Print or picture `node` on each turn of the loop. Does it ever change?',
    },
    'tr-build-trie': {
      inputs: [{ name: 'words', is: 'a list of words, possibly empty, possibly with repeats' }],
      returns: 'the root `TrieNode` of a trie that holds every word.',
      catch: 'Each word starts its walk in the same place. Where?',
    },
    'tr-find-node': {
      inputs: [ROOT, { name: 'text', is: 'letters to follow from the root. They may or may not lead anywhere.' }],
      returns: 'the node the letters lead to, or `None` if the path breaks. Empty `text` leads to `root` itself.',
      catch: 'This is a question, not an insert. What must it never do to the trie?',
    },
    'tr-has-word': {
      inputs: [ROOT, { name: 'word', is: 'the word to look for' }],
      returns: '`True` if exactly this word was inserted, otherwise `False`.',
      catch: 'With `cart` stored, the letters `car` lead to a node. Is `car` a stored word?',
    },
    'tr-dbg-no-end': {
      task: '`has_word` answers `False` for words that were just added. Fix the adding, not the asking.',
      inputs: [ROOT, { name: 'words', is: 'the list of words to store' }],
      returns: 'nothing. Afterwards `has_word` should be `True` for each of the words and `False` for their beginnings.',
      catch: 'What does `has_word` read on its last line, and who was supposed to set it?',
    },
    'tr-any-starts-with': {
      inputs: [ROOT, { name: 'prefix', is: 'the opening letters to look for' }],
      returns: '`True` if at least one stored word begins with these letters (a word begins with itself), otherwise `False`.',
      catch: 'Why does a node exist in a trie at all?',
    },
    'tr-dbg-prefix-true': {
      task: 'The bot accepts the first few letters of a command as if it were the command. Make it accept exact commands only.',
      inputs: [ROOT, { name: 'text', is: 'what the user typed' }],
      returns: '`True` only when `text` is exactly a stored command.',
      catch: 'Getting to the end of the walk proves one thing. Which thing?',
    },
    'tr-count-prefix': {
      inputs: [
        { name: 'node', is: '(for `count_words`) any trie node' },
        ROOT,
        { name: 'prefix', is: 'the opening letters. May be empty, which means every word.' },
      ],
      returns: '`count_words`: how many stored words end at that node or below it. `count_with_prefix`: how many stored words begin with `prefix`.',
      catch: 'A node can be the end of one word and also on the way to longer ones. Is it counted in both roles?',
    },
    'tr-words-with-prefix': {
      inputs: [
        { name: 'node', is: '(for `collect`) the node to search from' },
        { name: 'text', is: '(for `collect`) the letters that lead from the root to `node`' },
        { name: 'found', is: '(for `collect`) a list to append the words to' },
        ROOT,
        { name: 'prefix', is: 'the opening letters to complete' },
      ],
      returns: '`collect` returns nothing and fills `found`. `words_with_prefix` returns a sorted list of the stored words that begin with `prefix`.',
      catch: 'A node holds no letters of its own. Where does the spelling of a word come from when you reach its end?',
    },

    // ── Tries check ──
    'tr-chk-count-nodes': {
      inputs: [{ name: 'words', is: 'a list of words, possibly empty, possibly with repeats' }],
      returns: 'a whole number: how many nodes the trie for these words has, leaving out the root.',
      catch: 'Words that share a beginning share nodes.',
    },
    'tr-chk-only-prefix': {
      inputs: [ROOT, { name: 'text', is: 'one or more letters' }],
      returns: '`True` if some stored word starts with `text` and `text` is not itself stored. Otherwise `False`.',
      catch: 'There are two different ways for the answer to be `False`.',
    },
    'tr-chk-longest-word-start': {
      inputs: [ROOT, { name: 'text', is: 'a string, possibly empty, usually longer than the stored words' }],
      returns: 'a string: the longest stored word found at the very start of `text`, or an empty string.',
      catch: 'The walk can carry on past a word end and then break. What should come back then?',
    },
    'tr-chk-forget': {
      inputs: [ROOT, { name: 'word', is: 'the word to forget. It may not be stored at all.' }],
      returns: '`True` if the word was stored until now, `False` if it was not.',
      catch: 'Other, longer words may run through the same nodes. What is the smallest change that forgets just this one?',
    },

    // ── LC 208 ──
    'b208-word-set': {
      task: 'Fill in the three methods of `WordSet`. `TrieNode` is already written.',
      inputs: [{ name: 'word', is: 'the word to store (in `add`) or to look for (in `has`)' }],
      returns: '`add` returns nothing. `has` returns `True` for a whole stored word, otherwise `False`.',
      catch: 'Two `WordSet` objects must not see each other\'s words. Where does each one get its root?',
    },
    'b208-prefix-tally': {
      inputs: [
        { name: 'word', is: 'a word to record. Recording it again counts again.' },
        { name: 'prefix', is: 'one or more opening letters' },
      ],
      returns: '`add` returns nothing. `count` returns how many recorded words begin with `prefix`.',
      catch: '`go` added twice and `gone` once makes `count(\'go\')` 3. What would have to be remembered, and where, for one short walk to know that?',
    },

    // ── LC 211 ──
    'b211-has-from': {
      inputs: [
        { name: 'node', is: 'the trie node this call is standing on' },
        { name: 'word', is: 'the whole word being looked for' },
        { name: 'i', is: 'how many letters of `word` have been matched already; `word[i]` is the next one' },
      ],
      returns: '`True` if the rest of the word, from position `i`, leads from `node` to a word end. Otherwise `False`.',
      catch: 'What does it mean when `i` equals the length of the word, and what is the answer then?',
    },
    'b211-has-length': {
      inputs: [
        { name: 'node', is: 'the trie node to start from' },
        { name: 'n', is: 'how many more letters the word must have, `0` or more' },
      ],
      returns: '`True` if some stored word ends exactly `n` letters below `node`, otherwise `False`.',
      catch: 'If the first child you try has no such word, is the answer `False`?',
    },
    'b211-dbg-first-child': {
      task: 'A pattern with `?` sometimes fails although a stored word fits it. Make `?` consider every possibility.',
      inputs: [
        { name: 'node', is: 'the trie node this call is standing on' },
        { name: 'pattern', is: 'letters and `?` marks; each `?` stands for any one letter' },
        { name: 'i', is: 'the position in `pattern` to match next' },
      ],
      returns: '`True` if some stored word fits the pattern from here on, otherwise `False`.',
      catch: 'How many times can the body of the `for` loop run before the function has returned?',
    },
    'b211-pattern-counter': {
      inputs: [
        { name: 'word', is: 'a word to store. Storing it twice is the same as once.' },
        { name: 'pattern', is: 'letters and `?` marks; each `?` stands for any one letter' },
      ],
      returns: '`add` returns nothing. `count` returns how many stored words have the pattern\'s length and agree with it at every position that is not `?`.',
      catch: 'A `?` can lead down several branches that all end in a match. What happens to their separate answers?',
    },
  },

  primers: [
    {
      id: 'fast-slow-pointers',
      title: 'Fast and slow pointers',
      skills: ['fast_slow'],
      what: 'Two pointers walk the **same** linked list at different speeds. `slow` takes one step while `fast` takes two, so when `fast` runs out of list `slow` has covered half of it; and if the list loops back on itself, `fast` comes round and lands on `slow`. A second form gives one pointer a head start of `k` nodes and then moves both one step at a time, so they stay exactly `k` apart.',
      model: 'Two runners: on a straight road the fast one simply finishes first; on a circular track it catches the slow one from behind.',
      syntax: [
        { code: 'slow = head\nfast = head', note: 'Both start at the front.' },
        { code: 'while fast and fast.next:', note: '`fast` jumps two nodes, so it and the node after it must both exist.' },
        { code: '    slow = slow.next\n    fast = fast.next.next', note: 'One step and two steps, every turn.' },
        { code: '    if slow is fast:', note: 'The same node (`is`, not equal values). Checked **after** moving.' },
        { code: 'for _ in range(k):\n    lead = lead.next', note: 'The other form: a head start of `k` nodes.' },
        { code: 'while lead:\n    lead = lead.next\n    trail = trail.next', note: 'Then both move together, `k` apart, until the leader runs out.' },
      ],
      example: {
        code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    head = None
    for v in reversed(values):
        head = ListNode(v, head)
    return head

def report(head):
    slow = head
    fast = head
    turns = 0
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        turns += 1
    # fast fell off the end (even length) or is on the last node (odd)
    kind = 'even' if fast is None else 'odd'
    print(turns, 'turns,', kind, 'length')

report(build([10, 20, 30, 40, 50, 60]))
report(build([10, 20, 30, 40, 50]))
report(build([10]))`,
        output: `3 turns, even length
2 turns, odd length
0 turns, odd length`,
      },
      gotchas: [
        '`while fast.next:` crashes on an empty list, and `while fast:` crashes on the second half of the double step. You need both checks, in that order.',
        'Both pointers start on the same node, so comparing them **before** the first move always says "met".',
        'Compare nodes with `is`. Two different nodes can hold the same value.',
        'Where `fast` starts decides where `slow` stops: both on `head` leaves `slow` on the middle; `fast` on `head.next` leaves `slow` one node earlier.',
        'With a head start, an off-by-one in the gap lands you on the node itself instead of the one before it. Starting from a dummy shifts everything back by one.',
      ],
    },
    {
      id: 'tries',
      title: 'Tries (prefix trees)',
      skills: ['trie_node', 'trie_search'],
      what: 'A **trie** stores words letter by letter in a tree. Each node has a dict `children` (letter → next node) and a flag `end` that is `True` when a word stops there. Words with the same beginning share the same nodes, so "is this word stored?" and "does anything start with these letters?" each cost one step per letter, however many words there are.',
      model: 'A set of signposted paths: every letter is a turn, words that start alike walk the same road, and a flag is planted wherever a word finishes.',
      syntax: [
        { code: 'class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.end = False', note: 'The node. `class` defines a new kind of object and `TrieNode()` makes one. Python runs `__init__` on every new object; `self` is that object, so `self.children = {}` gives each node a dict of its own.' },
        { code: 'node = root', note: 'Every walk starts at the root, which stands for "no letters yet".' },
        { code: 'if ch not in node.children:\n    node.children[ch] = TrieNode()', note: 'Inserting: create the child only when it is missing.' },
        { code: 'node = node.children[ch]', note: 'Step down. Used by inserting and searching alike.' },
        { code: 'node.end = True', note: 'After the last letter of an insert: a word stops here.' },
        { code: 'if ch not in node.children:\n    return False', note: 'Searching: a missing child means the path does not exist.' },
        { code: 'return node.end', note: 'Whole word: the path exists **and** a word stops on it. For a prefix, the path existing is enough.' },
      ],
      example: {
        code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

# dialling codes, digit by digit
root = TrieNode()
for dial in ['44', '441', '49']:
    node = root
    for digit in dial:
        if digit not in node.children:
            node.children[digit] = TrieNode()
        node = node.children[digit]
    node.end = True

four = root.children['4']
print(sorted(root.children))               # all three share the first 4
print(sorted(four.children))
print(four.end)                            # '4' alone is not a code
print(four.children['4'].end)              # '44' is
print('1' in four.children['4'].children)  # and '441' carries on below it`,
        output: `['4']
['4', '9']
False
True
True`,
      },
      gotchas: [
        'Forgetting `node.end = True` after an insert: the path is there but no search ever finds the word.',
        'Returning `True` at the end of a whole-word search. Reaching a node only proves a prefix; the word is real only if `end` is set.',
        'Forgetting to step down (`node = node.children[ch]`): every letter ends up as a child of the root.',
        'Writing `children = {}` directly under `class`, or as a default argument: that one dict is shared by every node.',
        'Creating nodes while searching. A search only reads.',
      ],
    },
    {
      id: 'trie-wildcard',
      title: 'Trie search with a wildcard',
      skills: ['trie_wildcard'],
      what: 'When a pattern position can be **any** letter, a loop that follows one child is not enough: the search has to branch. Write it recursively with the node and the position as arguments. An ordinary letter follows its one child; a wildcard tries **every** child from the next position. The base case is the end of the pattern, where the node\'s `end` flag gives the answer.',
      model: 'At a fork with no signpost you send a scout down every road; each scout carries on reading the rest of the pattern from where it stands.',
      syntax: [
        { code: 'def dfs(node, i):', note: 'Standing on `node`, about to match position `i`.' },
        { code: '    if i == len(pattern):\n        return node.end', note: 'Base case: nothing left to match. A word must stop exactly here.' },
        { code: '    ch = pattern[i]', note: 'One position per call.' },
        { code: "    if ch == '.':\n        for child in node.children.values():\n            if dfs(child, i + 1):\n                return True\n        return False", note: 'Wildcard: every child gets a turn. `True` on the first success, `False` only after all fail.' },
        { code: '    if ch not in node.children:\n        return False\n    return dfs(node.children[ch], i + 1)', note: 'Ordinary letter: one child or nothing.' },
      ],
      example: {
        code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

root = TrieNode()
for plate in ['123', '173', '129', '45']:
    node = root
    for digit in plate:
        if digit not in node.children:
            node.children[digit] = TrieNode()
        node = node.children[digit]
    node.end = True

# list the stored plates that fit a pattern; '#' is any one digit
def fitting(node, pattern, i, text, found):
    if i == len(pattern):
        if node.end:
            found.append(text)
        return
    ch = pattern[i]
    if ch == '#':
        for digit in sorted(node.children):
            fitting(node.children[digit], pattern, i + 1, text + digit, found)
    elif ch in node.children:
        fitting(node.children[ch], pattern, i + 1, text + ch, found)

for pattern in ['1#3', '##', '12#', '9#']:
    found = []
    fitting(root, pattern, 0, '', found)
    print(pattern, found)`,
        output: `1#3 ['123', '173']
## ['45']
12# ['123', '129']
9# []`,
      },
      gotchas: [
        '`return dfs(child, i + 1)` inside the loop stops at the first child, whatever it answered. Return only when a child succeeds.',
        'Forgetting `return False` after the loop: the function falls off the end and returns `None`.',
        'A base case that returns `True`: the pattern running out only helps if a word ends on this node.',
        'Passing `i` instead of `i + 1` to the recursive call: the same position is matched forever.',
      ],
    },
  ],
}
