import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { debug, output, write, t } from '@/data/exercises/build'

/**
 * Sliding window and binary search: the two mastery checks, and the bridges to
 * LC 424, LC 76, LC 153 and LC 33.
 */

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'

// ───────────────────────────────────────────── Sliding window check
const windowCheck: PackSection = {
  id: 'd4w-check',
  module: '2026-10-04',
  title: 'Sliding window check',
  summary: 'Five cold windows from a bare signature: fixed size, grow and shrink, and state kept in a set or dict.',
  gate: true,
  exercises: [
    write({
      id: 'd4w-ck-quietest-start',
      title: 'Quietest stretch',
      skills: ['sliding_window', 'state_tracking', 'range'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt:
        '`noise` is a list of hourly noise readings and `1 <= k <= len(noise)`.\n\nWrite `quietest_start(noise, k)`: the **index where the quietest stretch of `k` hours in a row begins** (the stretch with the smallest total). On a tie, the earliest one. One pass.\n\n`quietest_start([5, 1, 2, 8, 1, 1], 2)` → `4`',
      starterCode: `def quietest_start(noise, k):
    pass`,
      solution: `def quietest_start(noise, k):
    total = sum(noise[:k])
    best = total
    best_start = 0
    for right in range(k, len(noise)):
        total += noise[right] - noise[right - k]
        if total < best:
            best = total
            best_start = right - k + 1
    return best_start`,
      tests: [
        t.eq('quietest_start([5, 1, 2, 8, 1, 1], 2)', '4'),
        t.eq('quietest_start([3], 1)', '0'),
        t.hidden('quietest_start([2, 2, 2], 2)', '0'),
        t.hidden('quietest_start([4, -1, -3, 5], 2)', '1'),
        t.hidden('quietest_start([1, 2, 3], 3)', '0'),
        t.hidden('quietest_start([9, 8, 7, 1], 1)', '3'),
      ],
      hints: ['When the stretch moves one hour along, how much of the total actually changes?'],
      explanation: 'A fixed window: one reading enters, one leaves, and the total is updated rather than re-added. The start of the window ending at `right` is `right - k + 1`.',
      signature: 'check:window-fixed-best-start',
      minutes: 9,
      important: true,
    }),
    write({
      id: 'd4w-ck-few-misses',
      title: 'Hot streak',
      skills: ['sliding_window', 'while_loop', 'state_tracking'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt:
        "`shots` is a string of `'H'` (hit) and `'M'` (miss).\n\nWrite `longest_few_misses(shots, k)`: the length of the longest stretch of shots in a row that contains **at most `k` misses**.\n\n`longest_few_misses('HHMHHHMH', 1)` → `6`",
      starterCode: `def longest_few_misses(shots, k):
    pass`,
      solution: `def longest_few_misses(shots, k):
    left = 0
    misses = 0
    best = 0
    for right in range(len(shots)):
        if shots[right] == 'M':
            misses += 1
        while misses > k:
            if shots[left] == 'M':
                misses -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
      tests: [
        t.eq("longest_few_misses('HHMHHHMH', 1)", '6'),
        t.eq("longest_few_misses('MMM', 0)", '0'),
        t.hidden("longest_few_misses('', 2)", '0'),
        t.hidden("longest_few_misses('HHH', 0)", '3'),
        t.hidden("longest_few_misses('MHM', 2)", '3'),
        t.hidden("longest_few_misses('MHMHM', 1)", '3'),
      ],
      hints: ['What single number tells you whether the current stretch is still allowed?'],
      explanation: 'Grow on the right; while the stretch holds too many misses, let shots go on the left. The state is one counter.',
      signature: 'check:window-variable-counter',
      minutes: 10,
      important: true,
    }),
    write({
      id: 'd4w-ck-shortest-reaching',
      title: 'Shortest walk to the goal',
      skills: ['sliding_window', 'while_loop', 'slicing', 'state_tracking'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 4,
      prompt:
        '`steps` is a list of positive step counts, one per day, and `goal` is a positive number.\n\nWrite `shortest_reaching(steps, goal)`: the **shortest run of days in a row** whose steps add up to at least `goal`, returned as a list. On a tie, the earliest run. If no run reaches the goal, return `[]`.\n\n`shortest_reaching([2, 3, 1, 2, 4, 3], 7)` → `[4, 3]`',
      starterCode: `def shortest_reaching(steps, goal):
    pass`,
      solution: `def shortest_reaching(steps, goal):
    left = 0
    total = 0
    best = []
    for right in range(len(steps)):
        total += steps[right]
        while total >= goal:
            if not best or right - left + 1 < len(best):
                best = steps[left:right + 1]
            total -= steps[left]
            left += 1
    return best`,
      tests: [
        t.eq('shortest_reaching([2, 3, 1, 2, 4, 3], 7)', '[4, 3]'),
        t.eq('shortest_reaching([1, 1], 5)', '[]'),
        t.hidden('shortest_reaching([], 3)', '[]'),
        t.hidden('shortest_reaching([1, 4, 4], 4)', '[4]'),
        t.hidden('shortest_reaching([5, 1, 1], 5)', '[5]'),
        t.hidden('shortest_reaching([1, 2, 3], 6)', '[1, 2, 3]'),
        t.hidden('shortest_reaching([3, 1, 3], 4)', '[3, 1]'),
      ],
      hints: ['Once a run reaches the goal, it may still reach it after losing days from its front. Keep checking.'],
      explanation: 'For a shortest window the roles flip: you shrink while the window is **valid**, and you record inside the shrink loop, before each item leaves.',
      signature: 'check:window-shortest-valid-slice',
      minutes: 10,
      important: true,
    }),
    write({
      id: 'd4w-ck-all-different',
      title: 'Codes with no repeats',
      skills: ['window_state', 'sliding_window', 'frequency_map', 'enumerate'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 4,
      prompt:
        "`s` is a string and `k >= 1`.\n\nWrite `count_all_different(s, k)`: how many substrings of length `k` are made of `k` **different** characters. Do not rebuild anything per substring.\n\n`count_all_different('abcab', 3)` → `3` (`'abc'`, `'bca'`, `'cab'`)",
      starterCode: `def count_all_different(s, k):
    pass`,
      solution: `def count_all_different(s, k):
    counts = {}
    found = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        if right >= k:
            old = s[right - k]
            counts[old] -= 1
            if counts[old] == 0:
                del counts[old]
        if right >= k - 1 and len(counts) == k:
            found += 1
    return found`,
      tests: [
        t.eq("count_all_different('abcab', 3)", '3'),
        t.eq("count_all_different('aab', 2)", '1'),
        t.hidden("count_all_different('', 2)", '0'),
        t.hidden("count_all_different('ab', 3)", '0'),
        t.hidden("count_all_different('aaaa', 1)", '4'),
        t.hidden("count_all_different('abac', 3)", '1'),
        t.hidden("count_all_different('abcabc', 4)", '0'),
      ],
      hints: ['You need to know how many different characters are inside right now. What has to happen to a character whose count drops to zero?'],
      explanation: 'A fixed window with a count map updated on both edges. Deleting keys at zero keeps `len(counts)` equal to the number of different characters inside.',
      signature: 'check:window-fixed-count-map',
      minutes: 11,
      important: true,
    }),
    write({
      id: 'd4w-ck-fresh-streak',
      title: 'No song twice',
      skills: ['window_state', 'sliding_window', 'set_add', 'set_membership'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt:
        "`songs` is a list of song names in the order they were played.\n\nWrite `longest_fresh_streak(songs)`: the length of the longest stretch of plays in a row in which **no song is played twice**.\n\n`longest_fresh_streak(['a', 'b', 'a', 'c', 'd'])` → `4`",
      starterCode: `def longest_fresh_streak(songs):
    pass`,
      solution: `def longest_fresh_streak(songs):
    playing = set()
    left = 0
    best = 0
    for right in range(len(songs)):
        while songs[right] in playing:
            playing.remove(songs[left])
            left += 1
        playing.add(songs[right])
        best = max(best, right - left + 1)
    return best`,
      tests: [
        t.eq("longest_fresh_streak(['a', 'b', 'a', 'c', 'd'])", '4'),
        t.eq("longest_fresh_streak(['x', 'x'])", '1'),
        t.hidden('longest_fresh_streak([])', '0'),
        t.hidden("longest_fresh_streak(['q'])", '1'),
        t.hidden("longest_fresh_streak(['a', 'b', 'b', 'a'])", '2'),
        t.hidden("longest_fresh_streak(['a', 'b', 'c'])", '3'),
        t.hidden("longest_fresh_streak(['t', 'm', 'm', 'z', 'u', 'x', 't'])", '5'),
      ],
      hints: ['When the next song is already in the stretch, the stretch has to lose plays from its front until it is not.'],
      explanation: 'The set always holds exactly the songs inside the window, so "is this one already here?" is one lookup.',
      signature: 'check:window-variable-set',
      minutes: 9,
      important: true,
    }),
  ],
}

// ───────────────────────────────────────────── LC 424
const toward424: PackSection = {
  id: 'br-424',
  module: '2026-10-04',
  title: 'Toward Longest Repeating Character Replacement',
  summary: 'Judge a window by its counts: its length minus its most common letter is what would have to change.',
  exercises: [
    output({
      id: 'b424-trace-valid',
      title: 'Trace: how many would have to change',
      skills: ['window_counts', 'frequency_map'],
      difficulty: 2,
      prompt: 'This window only grows. Predict the output: for each step, its size, the count of its most common letter, and whether one change is enough to make it all one letter.',
      code: `s = 'AABBA'
k = 1
counts = {}
left = 0
for right in range(len(s)):
    counts[s[right]] = counts.get(s[right], 0) + 1
    size = right - left + 1
    top = max(counts.values())
    print(right, size, top, size - top <= k)`,
      expectedOutput: '0 1 1 True\n1 2 2 True\n2 3 2 True\n3 4 2 False\n4 5 3 False',
      note: 'Keep the most common letter and change the rest. So a window needs `size - top` changes, where `top = max(counts.values())`.',
      explanation: 'At `right = 3` the window is `AABB`: the best you can do is keep two letters and change two, which is more than `k`.',
      signature: 'trace:window-size-minus-top',
      minutes: 2.5,
    }),
    write({
      id: 'b424-changes-needed',
      title: 'Changes to make it one letter',
      skills: ['window_counts', 'frequency_map', 'dict_get'],
      difficulty: 2,
      prompt:
        "`s` is a string of letters.\n\nWrite `changes_needed(s)`: the smallest number of characters you would have to change so that **every** character of `s` is the same. An empty string needs `0`.\n\n`changes_needed('AABAB')` → `2` (change both `B`s)",
      starterCode: `def changes_needed(s):
    pass`,
      solution: `def changes_needed(s):
    if not s:
        return 0
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return len(s) - max(counts.values())`,
      tests: [
        t.eq("changes_needed('AABAB')", '2'),
        t.eq("changes_needed('ZZZ')", '0'),
        t.hidden("changes_needed('')", '0'),
        t.hidden("changes_needed('A')", '0'),
        t.hidden("changes_needed('ABC')", '2'),
        t.hidden("changes_needed('ABAB')", '2'),
      ],
      hints: ['Which letter would you keep? Everything else has to change.', 'Count the letters, then take the largest count with `max(counts.values())`.'],
      explanation: 'Length minus the most common count. `max()` of an empty dict raises, which is why the empty string is handled first.',
      signature: 'counts:length-minus-max',
      minutes: 5,
    }),
    write({
      id: 'b424-fixable-windows',
      title: 'Which windows can be fixed',
      skills: ['window_counts', 'window_state', 'sliding_window', 'enumerate'],
      difficulty: 3,
      prompt:
        "`s` is a string of letters.\n\nWrite `fixable_windows(s, size, k)`: how many substrings of length `size` could be turned into one repeated letter by changing **at most `k`** characters. `size >= 1`; a string shorter than `size` has none. Keep one count map and update it on both edges.\n\n`fixable_windows('AABAB', 3, 1)` → `3` (`AAB`, `ABA` and `BAB` each need one change)",
      starterCode: `def fixable_windows(s, size, k):
    pass`,
      solution: `def fixable_windows(s, size, k):
    counts = {}
    found = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        if right >= size:
            counts[s[right - size]] -= 1
        if right >= size - 1 and size - max(counts.values()) <= k:
            found += 1
    return found`,
      tests: [
        t.eq("fixable_windows('AABAB', 3, 1)", '3'),
        t.eq("fixable_windows('ABCA', 3, 1)", '0'),
        t.hidden("fixable_windows('', 2, 1)", '0'),
        t.hidden("fixable_windows('AB', 3, 5)", '0'),
        t.hidden("fixable_windows('AAAA', 2, 0)", '3'),
        t.hidden("fixable_windows('ABAB', 2, 0)", '0'),
        t.hidden("fixable_windows('ABBBA', 4, 1)", '2'),
      ],
      hints: [
        'The window has a fixed length, so the only thing that changes is its counts.',
        'Add the entering letter; once the window is full, lower the count of the letter that just fell out.',
        'A full window can be fixed when `size - max(counts.values()) <= k`.',
      ],
      explanation: 'The validity test reads only the counts, so it costs the same however long the window is. A letter left at count 0 does no harm to `max`.',
      signature: 'window:fixed-size-minus-max',
      minutes: 8,
    }),
    debug({
      id: 'b424-dbg-left-order',
      title: 'Debug: one typo allowed',
      skills: ['window_counts', 'sliding_window', 'while_loop'],
      difficulty: 3,
      prompt:
        "`longest_one_typo(s)` should return the length of the longest stretch of `s` that is a single repeated letter except for **at most one** other character.\n\n`longest_one_typo('aabcc')` → `3`. Some answers come out too long. Fix it.",
      brokenCode: `def longest_one_typo(s):
    counts = {}
    left = 0
    best = 0
    for right in range(len(s)):
        counts[s[right]] = counts.get(s[right], 0) + 1
        while (right - left + 1) - max(counts.values()) > 1:
            left += 1
            counts[s[left]] -= 1
        best = max(best, right - left + 1)
    return best`,
      solution: `def longest_one_typo(s):
    counts = {}
    left = 0
    best = 0
    for right in range(len(s)):
        counts[s[right]] = counts.get(s[right], 0) + 1
        while (right - left + 1) - max(counts.values()) > 1:
            counts[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
      tests: [
        t.eq("longest_one_typo('aabcc')", '3'),
        t.eq("longest_one_typo('aabab')", '4'),
        t.eq("longest_one_typo('abcabc')", '2'),
        t.hidden("longest_one_typo('')", '0'),
        t.hidden("longest_one_typo('z')", '1'),
        t.hidden("longest_one_typo('aaaa')", '4'),
        t.hidden("longest_one_typo('abbbcbb')", '6'),
      ],
      hints: ['After the first shrink, print `counts` and compare it with the letters really inside `s[left:right + 1]`.', 'Which letter is leaving the window: the one at the old `left` or the new one?'],
      explanation: 'The letter that leaves is the one at `left` **before** it moves. Moving first lowers the count of a letter that is still inside, so the counts stop describing the window.',
      signature: 'debug:window-counts-left-order',
      minutes: 5,
    }),
    write({
      id: 'b424-longest-agreeing',
      title: 'Longest near-unanimous run',
      skills: ['window_counts', 'sliding_window', 'window_state', 'state_tracking'],
      transfer: true,
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 4,
      important: true,
      prompt:
        "`votes` is a list of answers in the order they were cast. A recount may overturn **at most `k`** of them.\n\nWrite `longest_agreeing(votes, k)`: the length of the longest run of votes in a row that could be made unanimous. No votes gives `0`.\n\n`longest_agreeing(['y', 'n', 'y', 'y', 'n', 'n'], 1)` → `4` (the first four, overturning the one `'n'`)",
      starterCode: `def longest_agreeing(votes, k):
    pass`,
      solution: `def longest_agreeing(votes, k):
    counts = {}
    left = 0
    best = 0
    for right in range(len(votes)):
        counts[votes[right]] = counts.get(votes[right], 0) + 1
        while (right - left + 1) - max(counts.values()) > k:
            counts[votes[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
      tests: [
        t.eq("longest_agreeing(['y', 'n', 'y', 'y', 'n', 'n'], 1)", '4'),
        t.eq("longest_agreeing(['a', 'b', 'c'], 0)", '1'),
        t.hidden('longest_agreeing([], 2)', '0'),
        t.hidden("longest_agreeing(['y'], 0)", '1'),
        t.hidden("longest_agreeing(['y', 'n', 'y', 'n'], 2)", '4'),
        t.hidden("longest_agreeing(['a', 'a', 'b', 'b', 'b', 'a', 'a'], 2)", '5'),
        t.hidden("longest_agreeing(['x', 'x', 'x'], 0)", '3'),
      ],
      hints: [
        'A run can be made unanimous when the votes that disagree with its most common answer number at most `k`.',
        'Window state: a count map. Add the vote on the right.',
        'While `(right - left + 1) - max(counts.values()) > k`, lower the count of the vote at `left`, then move `left`.',
        'After the loop the window is valid: measure it.',
      ],
      explanation: 'The grow and shrink template with a new validity test: window length minus the most common count. With a small set of possible values, `max(counts.values())` is a constant amount of work.',
      signature: 'window:variable-size-minus-max',
      minutes: 10,
    }),
  ],
}

// ───────────────────────────────────────────── LC 76
const toward76: PackSection = {
  id: 'br-76',
  module: '2026-10-04',
  title: 'Toward Minimum Window Substring',
  summary: 'A need map, a tally of needs already met, and a shrink that keeps the smallest window found.',
  exercises: [
    write({
      id: 'b76-need-map',
      title: 'What is needed',
      skills: ['window_counts', 'frequency_map', 'tuples'],
      difficulty: 2,
      prompt:
        "`t` is a string listing the characters a window must contain, repeats included (it can be empty).\n\nWrite `need_map(t)` that returns two things as a tuple: a dict of character → how many are needed, and **how many different characters** are needed.\n\n`need_map('aab')` → `({'a': 2, 'b': 1}, 2)`",
      starterCode: `def need_map(t):
    pass`,
      solution: `def need_map(t):
    need = {}
    for ch in t:
        need[ch] = need.get(ch, 0) + 1
    return need, len(need)`,
      tests: [
        t.eq("need_map('aab')", "({'a': 2, 'b': 1}, 2)"),
        t.eq("need_map('')", '({}, 0)'),
        t.hidden("need_map('zzz')", "({'z': 3}, 1)"),
        t.hidden("need_map('abc')", "({'a': 1, 'b': 1, 'c': 1}, 3)"),
      ],
      hints: ['The first part is a frequency map of `t`.', 'The second part is how many keys that map has.'],
      explanation: 'Two `a`s are one **need** with a size of 2. The number of needs is the number of keys, not the length of `t`.',
      signature: 'counts:need-map-and-size',
      minutes: 3.5,
    }),
    write({
      id: 'b76-covers',
      title: 'Does the window cover it?',
      skills: ['window_counts', 'dict_get', 'early_return'],
      difficulty: 2,
      prompt:
        "`window` and `need` are both dicts of character → count.\n\nWrite `covers(window, need)`: `True` if the window holds **at least** the needed number of every needed character. Extra characters and spare copies are fine.\n\n`covers({'a': 2, 'b': 1, 'x': 4}, {'a': 2, 'b': 1})` → `True`\n`covers({'a': 1, 'b': 1}, {'a': 2})` → `False`",
      starterCode: `def covers(window, need):
    pass`,
      solution: `def covers(window, need):
    for ch in need:
        if window.get(ch, 0) < need[ch]:
            return False
    return True`,
      tests: [
        t.eq("covers({'a': 2, 'b': 1, 'x': 4}, {'a': 2, 'b': 1})", 'True'),
        t.eq("covers({'a': 1, 'b': 1}, {'a': 2})", 'False'),
        t.hidden('covers({}, {})', 'True'),
        t.hidden("covers({}, {'a': 1})", 'False'),
        t.hidden("covers({'a': 3}, {'a': 2})", 'True'),
        t.hidden("covers({'b': 2}, {'a': 1, 'b': 2})", 'False'),
      ],
      hints: ['Walk the needs, not the window.', 'A needed character may be missing from the window altogether: read its count safely.'],
      explanation: 'This is the definition of a valid window. It costs one pass over `need` every time it is asked, which is what the next reps remove.',
      signature: 'counts:window-covers-need',
      minutes: 4,
    }),
    write({
      id: 'b76-add-right',
      title: 'A character enters',
      skills: ['window_counts', 'window_state', 'dict_membership'],
      difficulty: 3,
      prompt:
        "`window` and `need` are dicts of character → count: what the window holds now, and what is required. Checking every need on every step is slow, so keep a number instead: `formed` = how many needs are met right now. `ch` is the character entering the window.\n\nWrite `add_right(ch, window, need, formed)`: add `ch` to the `window` counts, and return the new `formed`. It goes up by one only at the moment `ch` **reaches** its needed count.\n\n`add_right('a', {'a': 1}, {'a': 2, 'b': 1}, 0)` → `1`\n`add_right('a', {'a': 2}, {'a': 2}, 1)` → `1` (a spare copy changes nothing)",
      starterCode: `def add_right(ch, window, need, formed):
    pass`,
      solution: `def add_right(ch, window, need, formed):
    window[ch] = window.get(ch, 0) + 1
    if ch in need and window[ch] == need[ch]:
        formed += 1
    return formed`,
      tests: [
        t.eq("add_right('a', {'a': 1}, {'a': 2, 'b': 1}, 0)", '1'),
        t.eq("add_right('a', {'a': 2}, {'a': 2}, 1)", '1'),
        t.eq("add_right('x', {}, {'a': 1}, 0)", '0'),
        t.hidden("add_right('b', {}, {'b': 1}, 2)", '3'),
        t.hidden("add_right('a', {}, {'a': 2}, 0)", '0'),
        t.check('the window counts are updated', "w = {'a': 1}\nassert add_right('a', w, {'a': 2}, 0) == 1\nassert w == {'a': 2}\nw = {}\nadd_right('x', w, {'a': 1}, 0)\nassert w == {'x': 1}", true),
      ],
      hints: ['Count the character first, whether it is needed or not.', 'Then two questions: is it needed at all, and has its count just become exactly the needed number?'],
      explanation: '`==` picks out the one step where a need goes from unmet to met. With `>=` every spare copy would be tallied again and `formed` would overshoot.',
      signature: 'counts:formed-on-enter',
      minutes: 4,
      important: true,
    }),
    write({
      id: 'b76-drop-left',
      title: 'A character leaves',
      skills: ['window_counts', 'window_state', 'dict_membership'],
      difficulty: 3,
      prompt:
        "`window` and `need` are dicts of character → count: what the window holds now, and what is required. `formed` is how many needs are met right now. `ch` is in the window and is about to leave from the left.\n\nWrite `drop_left(ch, window, need, formed)`: lower its count in `window` and return the new `formed`. It goes down by one only when losing this copy **breaks** a need that was met.\n\n`drop_left('a', {'a': 2}, {'a': 2}, 1)` → `0`\n`drop_left('a', {'a': 3}, {'a': 2}, 1)` → `1` (there was a spare)",
      starterCode: `def drop_left(ch, window, need, formed):
    pass`,
      solution: `def drop_left(ch, window, need, formed):
    if ch in need and window[ch] == need[ch]:
        formed -= 1
    window[ch] -= 1
    return formed`,
      tests: [
        t.eq("drop_left('a', {'a': 2}, {'a': 2}, 1)", '0'),
        t.eq("drop_left('a', {'a': 3}, {'a': 2}, 1)", '1'),
        t.eq("drop_left('x', {'x': 1, 'a': 1}, {'a': 1}, 1)", '1'),
        t.hidden("drop_left('b', {'a': 1, 'b': 1}, {'a': 1, 'b': 1}, 2)", '1'),
        t.hidden("drop_left('a', {'a': 1}, {'a': 2}, 0)", '0'),
        t.check('the window counts are updated', "w = {'a': 3}\nassert drop_left('a', w, {'a': 2}, 1) == 1\nassert w == {'a': 2}\nw = {'x': 2}\ndrop_left('x', w, {'a': 1}, 0)\nassert w == {'x': 1}", true),
      ],
      hints: ['A met need breaks when the window holds exactly the needed number and one of them goes.', 'Does it matter whether you compare the counts before or after lowering?'],
      explanation: 'Holding exactly the needed count **before** the removal means the need is about to be broken. Comparing after the removal would need a different test (`<`), and mixing the two is the usual slip.',
      signature: 'counts:formed-on-leave',
      minutes: 4,
      important: true,
    }),
    debug({
      id: 'b76-dbg-formed-early',
      title: 'Debug: covered too soon',
      skills: ['window_counts', 'frequency_map', 'enumerate', 'early_return'],
      difficulty: 3,
      stage: 'debug',
      prompt:
        "`first_cover_end(s, t)` grows a window from the start of `s` and should return the first index `right` at which `s[0..right]` contains every character of `t`, repeats included. It returns `-1` if that never happens. `t` is not empty.\n\n`first_cover_end('aab', 'ab')` → `2`. Fix it.",
      brokenCode: `def first_cover_end(s, t):
    need = {}
    for ch in t:
        need[ch] = need.get(ch, 0) + 1
    window = {}
    formed = 0
    for right, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1
        if ch in need and window[ch] >= need[ch]:
            formed += 1
        if formed == len(need):
            return right
    return -1`,
      solution: `def first_cover_end(s, t):
    need = {}
    for ch in t:
        need[ch] = need.get(ch, 0) + 1
    window = {}
    formed = 0
    for right, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1
        if ch in need and window[ch] == need[ch]:
            formed += 1
        if formed == len(need):
            return right
    return -1`,
      tests: [
        t.eq("first_cover_end('aab', 'ab')", '2'),
        t.eq("first_cover_end('xaybz', 'ab')", '3'),
        t.hidden("first_cover_end('abc', 'd')", '-1'),
        t.hidden("first_cover_end('', 'a')", '-1'),
        t.hidden("first_cover_end('aaab', 'aab')", '3'),
        t.hidden("first_cover_end('bba', 'ab')", '2'),
        t.hidden("first_cover_end('aaa', 'ab')", '-1'),
      ],
      hints: ["Trace `formed` by hand for `'aab'` and `'ab'`. What is it after the second `a`?", 'How many times should one need be able to add to `formed`?'],
      explanation: 'A spare copy also satisfies `>=`, so one need was tallied twice and `formed` reached the total with `b` still missing. `==` is true exactly once per need while the window only grows.',
      signature: 'debug:formed-ge-vs-eq',
      minutes: 5,
    }),
    write({
      id: 'b76-shortest-piece',
      title: 'Keep the shortest so far',
      skills: ['state_tracking', 'slicing', 'tuples', 'window_counts'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt:
        "`spans` is a list of `(left, right)` pairs, each marking a piece `s[left..right]` with **both ends included**.\n\nWrite `shortest_piece(s, spans)`: the text of the shortest piece. On a tie, the first one listed. With no spans, return `''`.\n\nTrack two numbers as you go, the best length and where it starts, and slice once at the end.\n\n`shortest_piece('abcdefg', [(0, 3), (2, 3), (4, 6)])` → `'cd'`",
      starterCode: `def shortest_piece(s, spans):
    pass`,
      solution: `def shortest_piece(s, spans):
    best_len = float('inf')
    best_left = 0
    for left, right in spans:
        if right - left + 1 < best_len:
            best_len = right - left + 1
            best_left = left
    if best_len == float('inf'):
        return ''
    return s[best_left:best_left + best_len]`,
      tests: [
        t.eq("shortest_piece('abcdefg', [(0, 3), (2, 3), (4, 6)])", "'cd'"),
        t.eq("shortest_piece('abc', [])", "''"),
        t.hidden("shortest_piece('abcd', [(0, 1), (2, 3)])", "'ab'"),
        t.hidden("shortest_piece('abc', [(1, 1)])", "'b'"),
        t.hidden("shortest_piece('hello', [(0, 4)])", "'hello'"),
        t.hidden("shortest_piece('abcdef', [(0, 5), (3, 5), (1, 2)])", "'bc'"),
      ],
      hints: [
        "Start the best length at `float('inf')` so the first real piece always beats it.",
        'A piece with both ends included has length `right - left + 1`.',
        'If the best length never changed, nothing was found.',
      ],
      explanation: 'Slicing inside the loop would copy text every time a better piece turns up. Two numbers are enough, and a best length still at infinity is the "nothing found" signal.',
      signature: 'state:shortest-span-then-slice',
      minutes: 7,
    }),
    write({
      id: 'b76-shortest-with-all',
      title: 'Shortest stretch with every required letter',
      skills: ['window_counts', 'sliding_window', 'window_state', 'state_tracking'],
      transfer: true,
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 5,
      important: true,
      prompt:
        "`s` is a string (it can be empty) and `required` is a non-empty **set** of characters (each is needed once; there are no repeats to worry about).\n\nWrite `shortest_with_all(s, required)`: the shortest substring of `s` that contains every character in `required`. On a tie, the earliest. If there is none, return `''`.\n\n`shortest_with_all('xaybzab', {'a', 'b'})` → `'ab'`",
      starterCode: `def shortest_with_all(s, required):
    pass`,
      solution: `def shortest_with_all(s, required):
    window = {}
    formed = 0
    best_len = float('inf')
    best_left = 0
    left = 0
    for right, ch in enumerate(s):
        if ch in required:
            window[ch] = window.get(ch, 0) + 1
            if window[ch] == 1:
                formed += 1
        while formed == len(required):
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best_left = left
            out = s[left]
            if out in required:
                window[out] -= 1
                if window[out] == 0:
                    formed -= 1
            left += 1
    if best_len == float('inf'):
        return ''
    return s[best_left:best_left + best_len]`,
      tests: [
        t.eq("shortest_with_all('xaybzab', {'a', 'b'})", "'ab'"),
        t.eq("shortest_with_all('abc', {'a', 'z'})", "''"),
        t.eq("shortest_with_all('axxbxa', {'a', 'b'})", "'bxa'"),
        t.hidden("shortest_with_all('', {'a'})", "''"),
        t.hidden("shortest_with_all('a', {'a'})", "'a'"),
        t.hidden("shortest_with_all('aaab', {'a', 'b'})", "'ab'"),
        t.hidden("shortest_with_all('abca', {'a', 'b', 'c'})", "'abc'"),
        t.hidden("shortest_with_all('bbb', {'b'})", "'b'"),
        t.hidden("shortest_with_all('cabwefgewcwaefgcf', {'c', 'a', 'e'})", "'cwae'"),
      ],
      hints: [
        'Two phases per step: grow on the right until nothing is missing, then shrink on the left for as long as nothing is missing.',
        'Keep counts of the required characters inside the window, and `formed` = how many of them are present at least once.',
        'While `formed == len(required)`: compare this window with the best so far, then let `s[left]` go and move `left`.',
        'When a required character’s count falls to 0 it is missing again, so `formed` goes down and the shrinking stops.',
      ],
      explanation: 'Every window is recorded while it is still valid, just before its left character leaves. Counts are still needed even without repeats in `required`: the window may hold three `a`s, and only losing the last one breaks it.',
      signature: 'window:shortest-cover-of-set',
      minutes: 16,
    }),
  ],
}

// ───────────────────────────────────────────── Binary search check
const searchCheck: PackSection = {
  id: 'd05s-check',
  module: '2026-10-05',
  title: 'Binary search check',
  summary: 'Four cold searches from a bare signature: exact match, first position, last position, and a range of answers.',
  gate: true,
  exercises: [
    write({
      id: 'd05s-ck-page-of',
      title: 'Find the word',
      skills: ['binary_search', 'mid_calc', 'search_invariant'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt:
        "`words` is a list of different words in alphabetical order. Strings compare with `<` and `==` just like numbers.\n\nWrite `page_of(words, word)`: the index of `word`, or `-1` if it is not there. O(log n).\n\n`page_of(['ant', 'bee', 'cat', 'dog'], 'cat')` → `2`",
      starterCode: `def page_of(words, word):
    pass`,
      solution: `def page_of(words, word):
    lo, hi = 0, len(words) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if words[mid] == word:
            return mid
        elif words[mid] < word:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
      tests: [
        t.eq("page_of(['ant', 'bee', 'cat', 'dog'], 'cat')", '2'),
        t.eq("page_of(['ant', 'bee', 'cat', 'dog'], 'cow')", '-1'),
        t.hidden("page_of([], 'ant')", '-1'),
        t.hidden("page_of(['ant'], 'ant')", '0'),
        t.hidden("page_of(['ant', 'bee', 'cat', 'dog'], 'ant')", '0'),
        t.hidden("page_of(['ant', 'bee', 'cat', 'dog'], 'dog')", '3'),
        t.hidden("page_of(['ant', 'bee'], 'zebra')", '-1'),
      ],
      hints: ['Before each loop, say which indexes could still hold the word. When is that range empty?'],
      explanation: 'The inclusive template: the word, if present, is always in `lo..hi`, and the loop runs while that range has at least one index.',
      signature: 'check:bs-exact-strings',
      minutes: 8,
      important: true,
    }),
    write({
      id: 'd05s-ck-count-below',
      title: 'How many scored lower',
      skills: ['binary_search', 'search_invariant', 'mid_calc'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt:
        '`scores` is sorted from low to high and may contain repeats.\n\nWrite `count_below(scores, cutoff)`: how many scores are **strictly less than** `cutoff`. O(log n).\n\n`count_below([10, 20, 20, 30], 20)` → `1`',
      starterCode: `def count_below(scores, cutoff):
    pass`,
      solution: `def count_below(scores, cutoff):
    lo, hi = 0, len(scores) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if scores[mid] < cutoff:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo`,
      tests: [
        t.eq('count_below([10, 20, 20, 30], 20)', '1'),
        t.eq('count_below([10, 20, 30], 25)', '2'),
        t.hidden('count_below([], 5)', '0'),
        t.hidden('count_below([5, 5, 5], 5)', '0'),
        t.hidden('count_below([1, 2, 3], 10)', '3'),
        t.hidden('count_below([-3, -1, 0], -1)', '1'),
        t.hidden('count_below([7], 7)', '0'),
      ],
      hints: ['The count you want is also a position in the list. Which one?'],
      explanation: 'The number of smaller scores is the index of the first score that is not smaller. With no early return on a match, `lo` ends exactly there.',
      signature: 'check:bs-first-at-least-as-count',
      minutes: 7,
      important: true,
    }),
    write({
      id: 'd05s-ck-last-affordable',
      title: 'Priciest you can afford',
      skills: ['binary_search', 'search_invariant', 'state_tracking'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt:
        '`prices` is sorted from low to high and may contain repeats.\n\nWrite `last_affordable(prices, budget)`: the index of the **last** price that is at most `budget`, or `-1` if even the cheapest costs more. O(log n).\n\n`last_affordable([3, 5, 5, 9], 5)` → `2`',
      starterCode: `def last_affordable(prices, budget):
    pass`,
      solution: `def last_affordable(prices, budget):
    lo, hi = 0, len(prices) - 1
    best = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if prices[mid] <= budget:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best`,
      tests: [
        t.eq('last_affordable([3, 5, 5, 9], 5)', '2'),
        t.eq('last_affordable([3, 5, 9], 2)', '-1'),
        t.hidden('last_affordable([], 1)', '-1'),
        t.hidden('last_affordable([4], 4)', '0'),
        t.hidden('last_affordable([1, 2, 3], 100)', '2'),
        t.hidden('last_affordable([2, 2, 2], 2)', '2'),
        t.hidden('last_affordable([3, 5, 9], 8)', '1'),
      ],
      hints: ['An affordable price is a candidate, but there may be a later one. What do you do with a candidate before moving on?'],
      explanation: 'Remember the candidate and keep searching to the right of it. The last candidate remembered is the boundary.',
      signature: 'check:bs-last-at-most',
      minutes: 8,
      important: true,
    }),
    write({
      id: 'd05s-ck-staircase',
      title: 'Tallest staircase',
      skills: ['binary_search', 'search_invariant', 'mid_calc'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 4,
      prompt:
        'A staircase with `h` steps uses 1 block for the first step, 2 for the second, and so on: `h * (h + 1) // 2` blocks in all.\n\nWrite `tallest_staircase(blocks)` for `blocks >= 0`: the largest `h` you can build completely. No `math`, and no loop that tries every height.\n\n`tallest_staircase(8)` → `3` (6 blocks used, 2 left over)',
      starterCode: `def tallest_staircase(blocks):
    pass`,
      solution: `def tallest_staircase(blocks):
    lo, hi = 0, blocks
    best = 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * (mid + 1) // 2 <= blocks:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best`,
      tests: [
        t.eq('tallest_staircase(8)', '3'),
        t.eq('tallest_staircase(6)', '3'),
        t.eq('tallest_staircase(5)', '2'),
        t.hidden('tallest_staircase(0)', '0'),
        t.hidden('tallest_staircase(1)', '1'),
        t.hidden('tallest_staircase(2)', '1'),
        t.hidden('tallest_staircase(10)', '4'),
        t.hidden('tallest_staircase(10 ** 12)', '1414213'),
      ],
      hints: ['There is no list here. But if a height can be built, so can every smaller one. What does that let you halve?'],
      explanation: 'The possible answers `0..blocks` go "fits, fits, fits, too big, too big". That single flip is all binary search needs: the list is the range of answers.',
      signature: 'check:bs-answer-range-triangular',
      minutes: 9,
      important: true,
    }),
  ],
}

// ───────────────────────────────────────────── LC 153
const toward153: PackSection = {
  id: 'br-153',
  module: '2026-10-05',
  title: 'Toward Find Minimum in Rotated Sorted Array',
  summary: 'One comparison of the middle with the right end says which side the smallest value is on.',
  exercises: [
    output({
      id: 'b153-trace-drop',
      title: 'Trace: closing in on the drop',
      skills: ['rotated_search', 'search_invariant'],
      difficulty: 2,
      prompt: 'A sorted list was cut and its front moved to the back. Predict the output: `mid`, then the new `lo` and `hi`, each step.',
      code: `nums = [4, 5, 6, 7, 0, 1, 2]
lo, hi = 0, len(nums) - 1
while lo < hi:
    mid = (lo + hi) // 2
    if nums[mid] > nums[hi]:
        lo = mid + 1
    else:
        hi = mid
    print(mid, lo, hi)
print(lo)`,
      expectedOutput: '3 4 6\n5 4 5\n4 4 4\n4',
      note: 'If `nums[mid] > nums[hi]`, the values fall somewhere to the right of `mid`, so the smallest is in `mid + 1..hi`. Otherwise `mid..hi` is rising, so the smallest is at `mid` or to its left.',
      explanation: '`hi = mid` keeps `mid` because it may be the smallest itself. That is why the loop is `while lo < hi`: it stops when one index is left.',
      signature: 'trace:rotated-min-bounds',
      minutes: 2.5,
    }),
    write({
      id: 'b153-narrow',
      title: 'One step toward the smallest',
      skills: ['rotated_search', 'mid_calc', 'tuples'],
      difficulty: 2,
      prompt:
        '`nums` is a **rotated** sorted list of different values: a sorted list whose front was cut off and moved to the back, like `[4, 5, 6, 7, 0, 1, 2]`. The smallest value is somewhere in `nums[lo..hi]` (both ends included), with `lo < hi`.\n\nWrite `narrow(nums, lo, hi)`: look at the middle once and return the new `(lo, hi)` that still holds the smallest value.\n\n`narrow([4, 5, 6, 7, 0, 1, 2], 0, 6)` → `(4, 6)`\n`narrow([4, 5, 6, 7, 0, 1, 2], 4, 6)` → `(4, 5)`',
      starterCode: `def narrow(nums, lo, hi):
    pass`,
      solution: `def narrow(nums, lo, hi):
    mid = (lo + hi) // 2
    if nums[mid] > nums[hi]:
        return mid + 1, hi
    return lo, mid`,
      tests: [
        t.eq('narrow([4, 5, 6, 7, 0, 1, 2], 0, 6)', '(4, 6)'),
        t.eq('narrow([4, 5, 6, 7, 0, 1, 2], 4, 6)', '(4, 5)'),
        t.hidden('narrow([1, 2, 3], 0, 2)', '(0, 1)'),
        t.hidden('narrow([2, 1], 0, 1)', '(1, 1)'),
        t.hidden('narrow([3, 4, 5, 1, 2], 0, 4)', '(3, 4)'),
        t.hidden('narrow([5, 1, 2, 3, 4], 0, 4)', '(0, 2)'),
      ],
      hints: ['Compare the middle value with the value at the right end.', 'If the middle is bigger, it cannot be the smallest. If it is not, it still might be.'],
      explanation: 'The two branches are not mirror images: one drops `mid` (`mid + 1`), the other keeps it (`mid`). That asymmetry is the whole move.',
      signature: 'rotated:narrow-min-once',
      minutes: 4.5,
    }),
    debug({
      id: 'b153-dbg-skip-mid',
      title: 'Debug: where the list was cut',
      skills: ['rotated_search', 'search_invariant', 'while_loop'],
      difficulty: 3,
      prompt:
        '`rotation_point(nums)` takes a rotated sorted list of different values and should return the **index** of its smallest value. A list that was never rotated gives `0`.\n\n`rotation_point([6, 7, 0, 1, 2])` → `2`. Fix it.',
      brokenCode: `def rotation_point(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo`,
      solution: `def rotation_point(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
      tests: [
        t.eq('rotation_point([6, 7, 0, 1, 2])', '2'),
        t.eq('rotation_point([4, 5, 6, 7, 0, 1, 2])', '4'),
        t.eq('rotation_point([2, 3, 1])', '2'),
        t.hidden('rotation_point([1, 2, 3])', '0'),
        t.hidden('rotation_point([9])', '0'),
        t.hidden('rotation_point([2, 1])', '1'),
        t.hidden('rotation_point([5, 1, 2, 3, 4])', '1'),
        t.hidden('rotation_point([-1, 0, 4, -9, -5])', '3'),
      ],
      hints: ['Trace `[6, 7, 0, 1, 2]`. On the first step `mid` is 2. Where is the smallest value?', 'In the branch where the middle is not bigger than the right end, can the middle be ruled out?'],
      explanation: 'When `nums[mid] <= nums[hi]`, `mid` may be the smallest itself. `hi = mid - 1` throws it away; `hi = mid` keeps it, and `while lo < hi` still ends because `mid < hi`.',
      signature: 'debug:rotated-min-hi-mid',
      minutes: 4.5,
    }),
    write({
      id: 'b153-peak-mini',
      title: 'The reading just before the reset',
      skills: ['rotated_search', 'search_invariant', 'binary_search', 'list_index'],
      transfer: true,
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 4,
      important: true,
      prompt:
        '`readings` is a non-empty list of different numbers from a counter that only climbs, except that it may have reset to a low value **once** and climbed again from there: `[4, 5, 6, 7, 0, 1, 2]`. The readings after a reset are all lower than the ones before it.\n\nWrite `peak_reading(readings)`: the **largest** reading, in O(log n).\n\n`peak_reading([4, 5, 6, 7, 0, 1, 2])` → `7`\n`peak_reading([1, 2, 3])` → `3`',
      starterCode: `def peak_reading(readings):
    pass`,
      solution: `def peak_reading(readings):
    lo, hi = 0, len(readings) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if readings[mid] > readings[hi]:
            lo = mid + 1
        else:
            hi = mid
    return readings[lo - 1]`,
      tests: [
        t.eq('peak_reading([4, 5, 6, 7, 0, 1, 2])', '7'),
        t.eq('peak_reading([1, 2, 3])', '3'),
        t.hidden('peak_reading([9])', '9'),
        t.hidden('peak_reading([2, 1])', '2'),
        t.hidden('peak_reading([5, 1, 2, 3, 4])', '5'),
        t.hidden('peak_reading([-3, -2, -9, -5])', '-2'),
        t.hidden('peak_reading([2, 3, 4, 5, 1])', '5'),
      ],
      hints: [
        'Finding the largest directly is awkward. Where does it sit compared with the smallest?',
        'Close in on the smallest: compare the middle with the right end; drop the middle in one branch, keep it in the other.',
        'The largest is one place to the left of the smallest.',
        'If the smallest is at index 0, what does index `-1` give you in Python?',
      ],
      explanation: 'The largest value sits just before the drop, so find the smallest and step back one. With no reset the smallest is at index 0, and index `-1` wraps round to the last reading, which is the largest.',
      signature: 'rotated:max-via-min-index',
      minutes: 8,
    }),
  ],
}

// ───────────────────────────────────────────── LC 33
const toward33: PackSection = {
  id: 'br-33',
  module: '2026-10-05',
  title: 'Toward Search in Rotated Sorted Array',
  summary: 'One half is always sorted. Ask whether the target is inside it, and keep the half that can still hold it.',
  exercises: [
    write({
      id: 'b33-sorted-half',
      title: 'Which half is sorted',
      skills: ['rotated_search', 'mid_calc', 'conditionals'],
      difficulty: 2,
      prompt:
        "`nums` is a rotated sorted list of different values: a sorted list whose front was moved to the back. `lo` and `hi` are the two ends of the range being searched, both included. Cut `nums[lo..hi]` at its middle index `mid`: at least one of `lo..mid` and `mid..hi` rises all the way.\n\nWrite `sorted_half(nums, lo, hi)`: `'left'` if `nums[lo..mid]` is sorted, otherwise `'right'`.\n\n`sorted_half([4, 5, 6, 7, 0, 1, 2], 0, 6)` → `'left'`\n`sorted_half([6, 7, 0, 1, 2, 4, 5], 0, 6)` → `'right'`",
      starterCode: `def sorted_half(nums, lo, hi):
    pass`,
      solution: `def sorted_half(nums, lo, hi):
    mid = (lo + hi) // 2
    if nums[lo] <= nums[mid]:
        return 'left'
    return 'right'`,
      tests: [
        t.eq('sorted_half([4, 5, 6, 7, 0, 1, 2], 0, 6)', "'left'"),
        t.eq('sorted_half([6, 7, 0, 1, 2, 4, 5], 0, 6)', "'right'"),
        t.hidden('sorted_half([3, 1], 0, 1)', "'left'"),
        t.hidden('sorted_half([1, 2, 3], 0, 2)', "'left'"),
        t.hidden('sorted_half([5, 1, 2, 3, 4], 0, 4)', "'right'"),
        t.hidden('sorted_half([4, 5, 6, 7, 0, 1, 2], 4, 6)', "'left'"),
      ],
      hints: ['The drop can only be in one half. A half with no drop starts lower than it ends.', 'With two items left, `mid` equals `lo`. A half of one item counts as sorted.'],
      explanation: 'If the left end is not above the middle, there is no drop between them. `<=` rather than `<` because `lo` and `mid` are the same index when two items remain.',
      signature: 'rotated:which-half-sorted',
      minutes: 4,
    }),
    write({
      id: 'b33-next-bounds',
      title: 'Keep the half that can hold it',
      skills: ['rotated_search', 'search_invariant', 'conditionals', 'tuples'],
      difficulty: 4,
      important: true,
      prompt:
        '`nums` is a rotated sorted list of different values: a sorted list whose front was moved to the back. You are looking for `target` in `nums[lo..hi]` (both ends included), and you have already checked that `nums[mid]`, the value at the middle index `(lo + hi) // 2`, is **not** it.\n\nWrite `next_bounds(nums, lo, hi, target)`: the `(lo, hi)` to search next. Find the sorted half; if `target` lies between its two ends, keep that half, otherwise keep the other. Either way `mid` itself is dropped.\n\n`next_bounds([4, 5, 6, 7, 0, 1, 2], 0, 6, 5)` → `(0, 2)`\n`next_bounds([4, 5, 6, 7, 0, 1, 2], 0, 6, 0)` → `(4, 6)`',
      starterCode: `def next_bounds(nums, lo, hi, target):
    pass`,
      solution: `def next_bounds(nums, lo, hi, target):
    mid = (lo + hi) // 2
    if nums[lo] <= nums[mid]:
        if nums[lo] <= target < nums[mid]:
            return lo, mid - 1
        return mid + 1, hi
    if nums[mid] < target <= nums[hi]:
        return mid + 1, hi
    return lo, mid - 1`,
      tests: [
        t.eq('next_bounds([4, 5, 6, 7, 0, 1, 2], 0, 6, 5)', '(0, 2)'),
        t.eq('next_bounds([4, 5, 6, 7, 0, 1, 2], 0, 6, 0)', '(4, 6)'),
        t.eq('next_bounds([6, 7, 0, 1, 2, 4, 5], 0, 6, 4)', '(4, 6)'),
        t.hidden('next_bounds([6, 7, 0, 1, 2, 4, 5], 0, 6, 7)', '(0, 2)'),
        t.hidden('next_bounds([3, 1], 0, 1, 1)', '(1, 1)'),
        t.hidden('next_bounds([4, 5, 6, 7, 0, 1, 2], 0, 6, 4)', '(0, 2)'),
        t.hidden('next_bounds([1, 2, 3, 4, 5], 0, 4, 9)', '(3, 4)'),
        t.hidden('next_bounds([6, 7, 0, 1, 2, 4, 5], 0, 6, 5)', '(4, 6)'),
      ],
      hints: [
        'First decide which half is sorted: a half with no drop in it starts no higher than it ends.',
        'Only a sorted half can answer "is the target in here?" from its two ends.',
        'Python lets you chain: `a <= x < b`. The end at `mid` is already ruled out; the far end is not.',
        'If the target is not inside the sorted half, it can only be in the other one.',
      ],
      explanation: 'You never reason about the half with the drop in it. You test the sorted half, whose ends tell you everything, and take the other half by elimination.',
      signature: 'rotated:keep-half-with-target',
      minutes: 8,
    }),
    debug({
      id: 'b33-dbg-equal-end',
      title: 'Debug: is it in the rotated list?',
      skills: ['rotated_search', 'search_invariant', 'binary_search'],
      difficulty: 3,
      prompt:
        '`in_rotated(nums, target)` should return `True` if `target` is in the rotated sorted list `nums` (different values), otherwise `False`, in O(log n).\n\n`in_rotated([4, 5, 6, 7, 0, 1, 2], 4)` → `True`. It misses some values that are there. Fix it.',
      brokenCode: `def in_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return True
        if nums[lo] <= nums[mid]:
            if nums[lo] < target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target < nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return False`,
      solution: `def in_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return True
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return False`,
      tests: [
        t.eq('in_rotated([4, 5, 6, 7, 0, 1, 2], 4)', 'True'),
        t.eq('in_rotated([6, 7, 0, 1, 2, 4, 5], 5)', 'True'),
        t.eq('in_rotated([4, 5, 6, 7, 0, 1, 2], 3)', 'False'),
        t.hidden('in_rotated([], 1)', 'False'),
        t.hidden('in_rotated([1], 1)', 'True'),
        t.hidden('in_rotated([4, 5, 6, 7, 0, 1, 2], 0)', 'True'),
        t.hidden('in_rotated([4, 5, 6, 7, 0, 1, 2], 2)', 'True'),
        t.hidden('in_rotated([1, 2, 3, 4, 5], 1)', 'True'),
        t.hidden('in_rotated([3, 1], 3)', 'True'),
      ],
      hints: ['Trace the first test. Which half is sorted, and is 4 inside it?', 'Each sorted half has one end that has been ruled out and one that has not.'],
      explanation: 'Only `nums[mid]` has been checked. The far end of the sorted half is still a possible home for the target, so that side of the range test must allow equality.',
      signature: 'debug:rotated-range-inclusive-end',
      minutes: 6,
    }),
    write({
      id: 'b33-slot-mini',
      title: 'Find the hour on a night shift',
      skills: ['rotated_search', 'binary_search', 'search_invariant', 'mid_calc'],
      transfer: true,
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 4,
      important: true,
      prompt:
        'A shift log lists the hours (0 to 23) at which checks were made, in the order they happened. The shift may run past midnight, so the hours rise, may wrap round to a small number once, and rise again: `[14, 18, 22, 3, 7, 9]`. No hour appears twice.\n\nWrite `slot_of(hours, hour)`: the index of `hour` in the log, or `-1` if no check was made then. O(log n).\n\n`slot_of([14, 18, 22, 3, 7, 9], 3)` → `3`\n`slot_of([14, 18, 22, 3, 7, 9], 5)` → `-1`',
      starterCode: `def slot_of(hours, hour):
    pass`,
      solution: `def slot_of(hours, hour):
    lo, hi = 0, len(hours) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if hours[mid] == hour:
            return mid
        if hours[lo] <= hours[mid]:
            if hours[lo] <= hour < hours[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if hours[mid] < hour <= hours[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
      tests: [
        t.eq('slot_of([14, 18, 22, 3, 7, 9], 3)', '3'),
        t.eq('slot_of([14, 18, 22, 3, 7, 9], 18)', '1'),
        t.eq('slot_of([14, 18, 22, 3, 7, 9], 5)', '-1'),
        t.hidden('slot_of([], 4)', '-1'),
        t.hidden('slot_of([8], 8)', '0'),
        t.hidden('slot_of([8], 2)', '-1'),
        t.hidden('slot_of([3, 1], 1)', '1'),
        t.hidden('slot_of([1, 2, 3, 4], 4)', '3'),
        t.hidden('slot_of([22, 3, 7, 9, 14, 18], 22)', '0'),
        t.hidden('slot_of([22, 3, 7, 9, 14, 18], 18)', '5'),
        t.hidden('slot_of([14, 18, 22, 3, 7, 9], 23)', '-1'),
      ],
      hints: [
        'It is an ordinary search for one value, so the range is inclusive and a match returns straight away.',
        'After a miss at the middle, one of the two halves is sorted. Which comparison tells you?',
        'Ask whether the hour lies inside the sorted half, counting its far end but not the middle.',
        'Inside: keep that half. Not inside: keep the other. Both drop the middle.',
      ],
      explanation: 'Same list shape as the smallest-value search, different invariant: here the target is in `lo..hi` or nowhere, a match returns at once, and both branches drop `mid`, so the loop is `while lo <= hi`.',
      signature: 'rotated:search-target',
      minutes: 13,
    }),
  ],
}

export const pack: Pack = {
  sections: [windowCheck, toward424, toward76, searchCheck, toward153, toward33],
  units: {
    'Sliding window': { check: 'd4w-check' },
    'Binary search': { check: 'd05s-check' },
  },
  bridges: [
    {
      lc: 424,
      title: 'Longest Repeating Character Replacement',
      unit: 'Sliding window',
      section: 'br-424',
      mode: 'bridge-first',
      prerequisiteSkills: ['sliding_window', 'window_state', 'frequency_map', 'window_counts'],
      blocks: [
        { label: 'grow and shrink a window that carries a count map', skills: ['sliding_window', 'window_state', 'frequency_map'], evidence: ['d4-ws-two-kinds', 'd4-ws-k-kinds'] },
        { label: 'work out how many letters would have to change', skills: ['window_counts', 'frequency_map'], reps: ['b424-trace-valid', 'b424-changes-needed'] },
        { label: 'keep the counts true as the window slides', skills: ['window_counts', 'window_state'], reps: ['b424-fixable-windows', 'b424-dbg-left-order'] },
        { label: 'shrink while too many changes are needed', skills: ['window_counts', 'sliding_window'], reps: ['b424-longest-agreeing'] },
      ],
    },
    {
      lc: 76,
      title: 'Minimum Window Substring',
      unit: 'Sliding window',
      section: 'br-76',
      mode: 'bridge-first',
      prerequisiteSkills: ['sliding_window', 'window_state', 'frequency_map', 'window_counts', 'state_tracking'],
      blocks: [
        { label: 'count what the target needs', skills: ['frequency_map', 'window_counts'], reps: ['b76-need-map'], evidence: ['d4-ws-anagram-window'] },
        { label: 'check that a window covers every need', skills: ['window_counts', 'dict_get'], reps: ['b76-covers'] },
        { label: 'tally the needs met as characters enter and leave', skills: ['window_counts', 'window_state'], reps: ['b76-add-right', 'b76-drop-left', 'b76-dbg-formed-early'] },
        { label: 'shrink while the window is still valid', skills: ['sliding_window', 'while_loop'], evidence: ['d4w-ck-shortest-reaching', 'd4-win-debug-shrink'] },
        { label: 'remember the smallest window found', skills: ['state_tracking', 'slicing'], reps: ['b76-shortest-piece'] },
        { label: 'grow until covered, then shrink and record', skills: ['window_counts', 'sliding_window', 'state_tracking'], reps: ['b76-shortest-with-all'] },
      ],
    },
    {
      lc: 153,
      title: 'Find Minimum in Rotated Sorted Array',
      unit: 'Binary search',
      section: 'br-153',
      mode: 'bridge-first',
      prerequisiteSkills: ['binary_search', 'mid_calc', 'search_invariant', 'rotated_search'],
      blocks: [
        { label: 'halve a range with lo, mid and hi', skills: ['binary_search', 'mid_calc'], evidence: ['cap-binary-search', 'd05s-ck-page-of'] },
        { label: 'keep mid in range and loop while lo < hi', skills: ['search_invariant'], evidence: ['d05-var-dbg-lower'] },
        { label: 'compare the middle with the right end', skills: ['rotated_search'], reps: ['b153-trace-drop', 'b153-narrow'] },
        { label: 'close in on the smallest value', skills: ['rotated_search', 'search_invariant'], reps: ['b153-dbg-skip-mid', 'b153-peak-mini'] },
      ],
    },
    {
      lc: 33,
      title: 'Search in Rotated Sorted Array',
      unit: 'Binary search',
      section: 'br-33',
      mode: 'bridge-first',
      prerequisiteSkills: ['binary_search', 'mid_calc', 'search_invariant', 'rotated_search'],
      blocks: [
        { label: 'search an inclusive range for one value', skills: ['binary_search', 'mid_calc'], evidence: ['cap-binary-search', 'd05s-ck-page-of'] },
        { label: 'compare the middle with an end of the range', skills: ['rotated_search'], evidence: ['b153-narrow', 'b153-peak-mini'] },
        { label: 'tell which half is sorted', skills: ['rotated_search'], reps: ['b33-sorted-half'] },
        { label: 'test whether the target lies inside the sorted half', skills: ['rotated_search', 'search_invariant'], reps: ['b33-next-bounds', 'b33-dbg-equal-end'] },
        { label: 'search a rotated list for a target', skills: ['rotated_search', 'binary_search'], reps: ['b33-slot-mini'] },
      ],
    },
  ],
  briefs: {
    // ── Sliding window check ─────────────────────────────────────────────────
    'd4w-ck-quietest-start': {
      inputs: [
        { name: 'noise', is: 'a list of numbers, one reading per hour. Readings can be negative.' },
        { name: 'k', is: 'how many hours in a row a stretch covers. Never more than the list holds.' },
      ],
      returns: 'a number: the **index** of the first hour of the stretch with the smallest total. Not the total itself.',
      catch: 'You are asked where the stretch starts, but your loop probably knows where it ends. How do you get from one to the other?',
    },
    'd4w-ck-few-misses': {
      inputs: [
        { name: 'shots', is: "a string made only of `'H'` and `'M'`. It can be empty." },
        { name: 'k', is: 'the most misses a stretch may contain. It can be `0`.' },
      ],
      returns: 'a number: the length of the longest stretch with at most `k` misses in it.',
      catch: 'With `k = 0` and nothing but misses, the answer is `0`. Does your stretch know how to be empty?',
    },
    'd4w-ck-shortest-reaching': {
      inputs: [
        { name: 'steps', is: 'a list of positive numbers, one per day. It can be empty.' },
        { name: 'goal', is: 'the total a run of days has to reach (a positive number)' },
      ],
      returns: 'a **list**: the days of the shortest run that adds up to at least `goal`, or `[]` if no run does.',
      catch: 'The first run that reaches the goal is rarely the shortest. And when two are equally short, which one are you asked for?',
    },
    'd4w-ck-all-different': {
      inputs: [
        { name: 's', is: 'a string. It can be shorter than `k`.' },
        { name: 'k', is: 'the length of each substring to look at (at least 1)' },
      ],
      returns: 'a number: how many of the length-`k` substrings have no character twice.',
      catch: 'Do not count anything before the first full substring has been read.',
    },
    'd4w-ck-fresh-streak': {
      inputs: [{ name: 'songs', is: 'a list of song names in play order. Names can repeat; the list can be empty.' }],
      returns: 'a number: the length of the longest stretch of plays with no song in it twice.',
      catch: 'When a repeat arrives, the earlier copy may not be at the very front of the stretch. What else has to go?',
    },

    // ── LC 424 ───────────────────────────────────────────────────────────────
    'b424-trace-valid': {
      task: PREDICT,
      catch: 'Keep a table of `counts` after each step. `top` is the biggest number in it, whichever letter owns it.',
    },
    'b424-changes-needed': {
      inputs: [{ name: 's', is: 'a string. It can be empty.' }],
      returns: 'a number: the fewest characters to change so the whole string is one repeated character.',
      catch: 'What does `max()` do when it is handed nothing at all?',
    },
    'b424-fixable-windows': {
      inputs: [
        { name: 's', is: 'a string' },
        { name: 'size', is: 'the length of every window (at least 1). It can be longer than `s`.' },
        { name: 'k', is: 'the most changes allowed inside one window' },
      ],
      returns: 'a number: how many windows of that length need at most `k` changes to become one repeated letter.',
      catch: 'A window only counts once it is full. Which value of `right` is the first full one?',
    },
    'b424-dbg-left-order': {
      task: 'It should measure the longest stretch that is one repeated letter apart from at most one odd character. Make it right.',
      inputs: [{ name: 's', is: 'a string. It can be empty.' }],
      returns: 'a number: the length of that longest stretch.',
      catch: 'The counts are supposed to describe exactly the letters inside the window. Check whether they still do after a shrink.',
    },
    'b424-longest-agreeing': {
      inputs: [
        { name: 'votes', is: 'a list of answers (short strings), in the order they were cast. It can be empty.' },
        { name: 'k', is: 'how many votes a recount may overturn. It can be `0`.' },
      ],
      returns: 'a number: the length of the longest run of votes that would all agree after overturning at most `k` of them.',
      catch: 'You do not have to decide which answer wins. Which votes in a run are the cheapest to leave alone?',
    },

    // ── LC 76 ────────────────────────────────────────────────────────────────
    'b76-need-map': {
      inputs: [{ name: 't', is: 'a string of required characters. The same character can be listed more than once.' }],
      returns: 'a **tuple** of two things: a dict (character → how many are needed), then the number of different characters needed.',
      catch: "For `'aab'` the second number is 2, not 3. What are you counting?",
    },
    'b76-covers': {
      inputs: [
        { name: 'window', is: 'a dict: character → how many of it the window holds. It may hold characters nobody needs.' },
        { name: 'need', is: 'a dict: character → how many of it are required' },
      ],
      returns: '`True` if every requirement is met, otherwise `False`.',
      catch: 'A required character may not be a key of `window` at all.',
    },
    'b76-add-right': {
      inputs: [
        { name: 'ch', is: 'the character entering the window on the right' },
        { name: 'window', is: 'a dict: character → count inside the window, **before** `ch` is added. Change it in place.' },
        { name: 'need', is: 'a dict: character → how many are required' },
        { name: 'formed', is: 'how many requirements were fully met before `ch` arrived' },
      ],
      returns: 'a number: how many requirements are fully met now.',
      catch: 'A third `a` when only two are needed must leave the tally alone. Which comparison is true once and only once?',
    },
    'b76-drop-left': {
      inputs: [
        { name: 'ch', is: 'the character leaving the window on the left. It is in `window`.' },
        { name: 'window', is: 'a dict: character → count inside the window, **before** `ch` is removed. Change it in place.' },
        { name: 'need', is: 'a dict: character → how many are required' },
        { name: 'formed', is: 'how many requirements were fully met before `ch` left' },
      ],
      returns: 'a number: how many requirements are still fully met.',
      catch: 'Losing a spare copy breaks nothing. How do you tell a spare from a copy the window cannot do without?',
    },
    'b76-dbg-formed-early': {
      task: 'It should report the first position at which the growing window holds everything `t` asks for. It reports too early. Make it right.',
      inputs: [
        { name: 's', is: 'the string the window grows across, from index 0' },
        { name: 't', is: 'the required characters, repeats included. Not empty.' },
      ],
      returns: 'a number: the first index where the window from the start covers `t`, or `-1` if it never does.',
      catch: 'Follow `formed` step by step on a string that opens with the same letter twice.',
    },
    'b76-shortest-piece': {
      inputs: [
        { name: 's', is: 'a string' },
        { name: 'spans', is: 'a list of `(left, right)` index pairs. Each marks a piece of `s`, and **both** ends belong to the piece. The list can be empty.' },
      ],
      returns: "a **string**: the text of the shortest piece, or `''` when there are no spans.",
      catch: 'A slice leaves out its end index, but these spans include theirs.',
    },
    'b76-shortest-with-all': {
      inputs: [
        { name: 's', is: 'a string. It can be empty.' },
        { name: 'required', is: 'a non-empty set of characters. Each must appear at least once in the answer.' },
      ],
      returns: "a **string**: the shortest stretch of `s` containing every required character, or `''` if no stretch does.",
      catch: 'The window may hold several copies of a required character. Losing one of them is not always a problem. When is it?',
    },

    // ── Binary search check ──────────────────────────────────────────────────
    'd05s-ck-page-of': {
      inputs: [
        { name: 'words', is: 'a list of different words in alphabetical order. It can be empty.' },
        { name: 'word', is: 'the word to look for. It may not be in the list.' },
      ],
      returns: 'a number: the index of `word`, or `-1`.',
      catch: 'When one candidate index is left, does your loop still look at it?',
    },
    'd05s-ck-count-below': {
      inputs: [
        { name: 'scores', is: 'a list of numbers sorted low to high. Repeats allowed; it can be empty.' },
        { name: 'cutoff', is: 'a number. It may or may not be one of the scores.' },
      ],
      returns: 'a number: how many scores are strictly below `cutoff`.',
      catch: 'A score equal to the cutoff does not count. If several scores equal it, none of them do.',
    },
    'd05s-ck-last-affordable': {
      inputs: [
        { name: 'prices', is: 'a list of numbers sorted low to high. Repeats allowed; it can be empty.' },
        { name: 'budget', is: 'the most you can pay' },
      ],
      returns: 'a number: the index of the last price that is at most `budget`, or `-1` when nothing is affordable.',
      catch: 'A price exactly equal to the budget is affordable. If it appears twice, which index is wanted?',
    },
    'd05s-ck-staircase': {
      inputs: [{ name: 'blocks', is: 'a whole number, 0 or more: how many blocks you have' }],
      returns: 'a number: the height of the tallest staircase you can finish. Leftover blocks are fine.',
      catch: '`blocks` can be `0`, and it can be enormous. A loop that tries heights one at a time is not what is asked for.',
    },

    // ── LC 153 ───────────────────────────────────────────────────────────────
    'b153-trace-drop': {
      task: PREDICT,
      catch: 'One branch moves past `mid`, the other stops on it. Check which branch runs before writing each line.',
    },
    'b153-narrow': {
      inputs: [
        { name: 'nums', is: 'a sorted list of different numbers whose front may have been moved to the back' },
        { name: 'lo', is: 'the left end of the range that still holds the smallest value' },
        { name: 'hi', is: 'the right end of that range (included). It is greater than `lo`.' },
      ],
      returns: 'a **tuple** `(lo, hi)`: the smaller range that still holds the smallest value after one look at the middle.',
      catch: 'In one of the two cases the middle value might itself be the smallest. Does your new range still include it?',
    },
    'b153-dbg-skip-mid': {
      task: 'It should find the index of the smallest value in a rotated sorted list. For some lists it lands on the wrong index. Make it right.',
      inputs: [{ name: 'nums', is: 'a non-empty sorted list of different numbers whose front may have been moved to the back' }],
      returns: 'a number: the index of the smallest value (`0` if the list was never rotated).',
      catch: 'Find a step where `mid` is sitting right on the smallest value, and watch what happens to it.',
    },
    'b153-peak-mini': {
      inputs: [{ name: 'readings', is: 'a non-empty list of different numbers that rises, may fall once to a low value, and rises again. It may never fall at all.' }],
      returns: 'a number: the largest reading.',
      catch: 'What if the counter never reset? Make sure the answer is still the last reading.',
    },

    // ── LC 33 ────────────────────────────────────────────────────────────────
    'b33-sorted-half': {
      inputs: [
        { name: 'nums', is: 'a sorted list of different numbers whose front may have been moved to the back' },
        { name: 'lo', is: 'the left end of the range being looked at' },
        { name: 'hi', is: 'the right end of the range (included)' },
      ],
      returns: "a **string**: `'left'` if the part from `lo` to the middle rises all the way, otherwise `'right'`.",
      catch: 'With two items in the range, the middle index and `lo` are the same index. What should the answer be then?',
    },
    'b33-next-bounds': {
      inputs: [
        { name: 'nums', is: 'a sorted list of different numbers whose front may have been moved to the back' },
        { name: 'lo', is: 'the left end of the range still being searched' },
        { name: 'hi', is: 'the right end of that range (included)' },
        { name: 'target', is: 'the value being looked for. It is **not** the value at the middle index; it may not be in the list at all.' },
      ],
      returns: 'a **tuple** `(lo, hi)`: the half to search next, with the middle index left out.',
      catch: 'The target can be equal to the value at the far end of the sorted half. Is that inside or outside?',
    },
    'b33-dbg-equal-end': {
      task: 'It should say whether a value is in a rotated sorted list. It says `False` for some values that are there. Make it right.',
      inputs: [
        { name: 'nums', is: 'a sorted list of different numbers whose front may have been moved to the back. It can be empty.' },
        { name: 'target', is: 'the value to look for' },
      ],
      returns: '`True` if `target` is in `nums`, otherwise `False`.',
      catch: 'Which positions has the code actually looked at by the time it tests the range? Only those are ruled out.',
    },
    'b33-slot-mini': {
      inputs: [
        { name: 'hours', is: 'a list of different hours (0 to 23) that rises, may wrap round to a small number once, and rises again. It can be empty.' },
        { name: 'hour', is: 'the hour to look for' },
      ],
      returns: 'a number: the index of `hour` in the log, or `-1` if it is not there.',
      catch: 'A log with two entries, or one that never wraps, still has to work. Which half is "sorted" when the range is that small?',
    },
  },
  primers: [
    {
      id: 'window-counts',
      title: 'Judging a window by its counts',
      skills: ['window_counts'],
      what: 'Some windows cannot be judged by **what** is inside, only by **how many of each**. Keep a count map of the window and ask your question of the counts, never of the window itself. Two questions cover most problems: "how many items are not the most common one?" and "does the window hold at least what I need of every required item?"',
      model: 'A tally sheet pinned to the window: items are ticked on as they enter and off as they leave, and every decision is read from the sheet.',
      syntax: [
        { code: 'counts[x] = counts.get(x, 0) + 1', note: 'Right edge: tick the entering item on.' },
        { code: 'counts[items[left]] -= 1\nleft += 1', note: 'Left edge: tick the leaving item off, then move.' },
        { code: 'size = right - left + 1', note: 'How many items the window holds.' },
        { code: 'size - max(counts.values())', note: 'How many items are not the most common one.' },
        { code: 'need[ch] = need.get(ch, 0) + 1', note: 'What is required, counted once before the loop.' },
        { code: 'if ch in need and counts[ch] == need[ch]:\n    formed += 1', note: 'This requirement has just been met.' },
        { code: 'formed == len(need)', note: 'Every requirement is met.' },
      ],
      example: {
        code: `# One basket of fruit, read two ways from its counts
basket = ['kiwi', 'fig', 'kiwi', 'kiwi', 'plum']
counts = {}
for fruit in basket:
    counts[fruit] = counts.get(fruit, 0) + 1
print(counts)

most = max(counts.values())
print(len(basket) - most, 'are not the most common fruit')

need = {'kiwi': 2, 'plum': 1, 'pear': 1}
formed = 0
for fruit in need:
    if counts.get(fruit, 0) >= need[fruit]:
        formed += 1
print(formed, 'of', len(need), 'needs met')`,
        output: `{'kiwi': 3, 'fig': 1, 'plum': 1}
2 are not the most common fruit
2 of 3 needs met`,
      },
      gotchas: [
        '`max(counts.values())` raises `ValueError` on an empty dict. Tick something on before you ask.',
        'Tick the leaving item off **before** `left += 1`. Moving first takes a count away from an item that is still inside.',
        'When a tally of met needs is updated one item at a time, use `==` at the moment the needed count is reached. With `>=` every spare copy is tallied again.',
        'On the left edge, compare the counts **before** lowering: holding exactly the needed number means this removal breaks the need.',
      ],
    },
    {
      id: 'rotated-search',
      title: 'Searching a rotated sorted list',
      skills: ['rotated_search'],
      what: 'Take a sorted list, cut it once and move the front to the back: `[30, 40, 50, 10, 20]`. It is now two rising runs with a single **drop** between them. Binary search still works, because wherever `mid` lands, the drop can only be on one side of it, so the other side is plainly sorted. Comparing `nums[mid]` with one end tells you which side that is.',
      model: 'A staircase that climbs, falls off a ledge once, and climbs again. One look at the middle and one end tells you which side the ledge is on.',
      syntax: [
        { code: 'nums[mid] > nums[hi]', note: 'True: the drop, and the smallest value, are right of `mid`.' },
        { code: 'lo = mid + 1', note: '`mid` is bigger than something, so it is not the smallest.' },
        { code: 'hi = mid', note: '`mid` may be the smallest itself: keep it in range.' },
        { code: 'while lo < hi:', note: 'The loop that goes with `hi = mid`: stop at one index.' },
        { code: 'nums[lo] <= nums[mid]', note: 'True: `lo..mid` has no drop, so it is sorted.' },
        { code: 'nums[lo] <= target < nums[mid]', note: 'Chained comparison: is `target` inside that sorted half?' },
      ],
      example: {
        code: `nums = [30, 40, 50, 10, 20]
lo, hi = 0, len(nums) - 1
mid = (lo + hi) // 2
print(mid, nums[mid])
print(nums[mid] > nums[hi])           # the drop is right of mid
print(nums[lo] <= nums[mid])          # so lo..mid is sorted
print(nums[lo] <= 40 < nums[mid])     # 40 is inside the sorted half
print(nums[lo] <= 10 < nums[mid])     # 10 is not: it must be on the other side`,
        output: `2 50
True
True
True
False`,
      },
      gotchas: [
        'When hunting the smallest value, compare `mid` with `nums[hi]`. Comparing with `nums[lo]` gives the wrong answer on a list that was never rotated.',
        '`hi = mid - 1` can throw away the smallest value. In that branch `mid` is still a candidate.',
        '`hi = mid` paired with `while lo <= hi` never ends. That update needs `while lo < hi`.',
        'When searching for a target, only `mid` has been ruled out. The far end of the sorted half can still be the target, so that comparison allows equality.',
      ],
    },
  ],
}
