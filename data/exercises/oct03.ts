import type { DayModule } from '@/lib/types'
import { choice, output, fill, code, reorder, capstone, explain, t } from '@/data/exercises/build'

const cold = { stage: 'retrieval' as const, repType: 'cold' as const }

export const day: DayModule = {
  date: '2026-10-03',
  short: 'Pointers',
  title: 'Strings + two pointers',
  focus: 'Read strings by index and slice, clean them with string methods, then walk left/right pointers and running state to solve scans in one pass.',
  sections: [
    // ───────────────────────────────────────────── Warm-up
    {
      id: 'd3-warmup',
      title: 'Warm-up',
      summary: 'Cold recall of yesterday: frequency maps, sets, index maps, Two Sum.',
      exercises: [
        output({
          id: 'd3-warm-trace-get',
          title: 'Trace a .get() count',
          skills: ['frequency_map', 'dict_get', 'len'],
          ...cold,
          prompt: 'What does this print?',
          code: `counts = {}
for w in ["a", "b", "a", "c", "a"]:
    counts[w] = counts.get(w, 0) + 1
print(counts["a"], counts.get("z", 0), len(counts))`,
          expectedOutput: '3 0 3',
          explanation: "`.get(w, 0)` returns 0 for a new key, so each word starts at 1. `.get('z', 0)` never raises and does not insert 'z'.",
          signature: 'trace:freq-map-get',
          minutes: 2,
        }),
        code({
          id: 'd3-warm-char-counts',
          title: 'Count characters',
          skills: ['frequency_map', 'dict_get', 'string_iterate'],
          ...cold,
          prompt: "Write `char_counts(s)` that returns a dict mapping each character of `s` to how many times it appears.",
          starterCode: `def char_counts(s):
    pass`,
          solution: `def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts`,
          tests: [t.eq('char_counts("banana")', '{"b": 1, "a": 3, "n": 2}'), t.eq('char_counts("")', '{}'), t.hidden('char_counts("aaa")', '{"a": 3}')],
          hints: ['Start with an empty dict and visit every character.', 'counts[ch] = counts.get(ch, 0) + 1'],
          signature: 'freq-map:count-chars',
          minutes: 4,
        }),
        code({
          id: 'd3-warm-has-dup',
          title: 'Any duplicate?',
          skills: ['set_add', 'set_membership', 'early_return'],
          ...cold,
          prompt: 'Write `has_duplicate(nums)`: return `True` as soon as a value repeats, otherwise `False`. One pass, using a set.',
          starterCode: `def has_duplicate(nums):
    pass`,
          solution: `def has_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False`,
          tests: [t.eq('has_duplicate([1, 2, 3, 1])', 'True'), t.eq('has_duplicate([1, 2, 3])', 'False'), t.hidden('has_duplicate([])', 'False'), t.hidden('has_duplicate([-1, -1])', 'True')],
          hints: ['Remember what you have already seen.', 'Check `x in seen` before `seen.add(x)`.'],
          signature: 'set:seen-early-return',
          minutes: 4,
        }),
        code({
          id: 'd3-warm-first-index',
          title: 'First index of each value',
          skills: ['index_map', 'enumerate', 'dict_membership'],
          ...cold,
          prompt: 'Write `first_index(nums)` returning a dict from each value to the index where it **first** appears.',
          starterCode: `def first_index(nums):
    pass`,
          solution: `def first_index(nums):
    first = {}
    for i, x in enumerate(nums):
        if x not in first:
            first[x] = i
    return first`,
          tests: [t.eq('first_index([5, 3, 5, 7, 3])', '{5: 0, 3: 1, 7: 3}'), t.eq('first_index([])', '{}'), t.hidden('first_index([9, 9, 9])', '{9: 0}')],
          hints: ['A plain `first[x] = i` would keep the last index.', 'Only assign when `x not in first`.'],
          signature: 'index-map:first-seen',
          minutes: 4,
        }),
        code({
          id: 'd3-warm-two-sum',
          title: 'Two Sum from memory',
          skills: ['index_map', 'complement', 'enumerate', 'dict_membership', 'hash_reasoning'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `two_sum(nums, target)` returning `[i, j]` (i < j) of the two numbers that add to `target`. Exactly one answer exists. One pass with a dict.',
          starterCode: `def two_sum(nums, target):
    pass`,
          solution: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []`,
          tests: [t.eq('two_sum([2, 7, 11, 15], 9)', '[0, 1]'), t.eq('two_sum([3, 2, 4], 6)', '[1, 2]'), t.hidden('two_sum([3, 3], 6)', '[0, 1]'), t.hidden('two_sum([-4, 1, 9, 4], 0)', '[0, 3]')],
          hints: ['For each number, what other number do you need?', 'Map value → index for everything seen so far.', 'Check the complement before storing the current number.'],
          signature: 'two-sum:one-pass',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────────────────────── Strings
    {
      id: 'd3-strings',
      title: 'Strings',
      summary: 'Index into strings (including negative indexes) and loop over characters.',
      exercises: [
        choice({
          id: 'd3-str-negative-index',
          title: 'Negative index',
          skills: ['string_index'],
          prompt: 'What is `word[-2]`?',
          code: `word = "python"`,
          options: ['o', 'n', 'h', 'IndexError'],
          answer: 0,
          note: '`s[-1]` is the last character, `s[-2]` the one before it. `s[-k]` is `s[len(s) - k]`.',
          explanation: 'Negative indexes count from the end: -1 is "n", -2 is "o".',
          signature: 'recognize:string-negative-index',
          minutes: 1,
        }),
        output({
          id: 'd3-str-trace-index',
          title: 'Trace string indexes',
          skills: ['string_index', 'len'],
          prompt: 'What does this print?',
          code: `s = "interview"
print(s[0], s[3], s[-1])
print(len(s), s[len(s) - 1])`,
          expectedOutput: 'i e w\n9 w',
          explanation: 'Indexes start at 0, so `s[3]` is the fourth character. The last valid index is `len(s) - 1`, the same character as `s[-1]`.',
          signature: 'trace:string-index',
          minutes: 2,
        }),
        choice({
          id: 'd3-str-immutable',
          title: 'Strings cannot change',
          skills: ['string_index'],
          prompt: 'What happens when this runs?',
          code: `s = "cat"
s[0] = "b"`,
          options: ['s becomes "bat"', 'TypeError: strings do not support item assignment', 'IndexError', 'Nothing happens'],
          answer: 1,
          note: 'Strings are immutable. Build a new string (slicing, `+`, `"".join(list)`) or work on a list of characters.',
          explanation: 'You cannot assign into a string. To "edit" one, build a new string such as `"b" + s[1:]`.',
          signature: 'recognize:string-immutable',
          minutes: 1,
        }),
        output({
          id: 'd3-str-trace-loop',
          title: 'Trace a character loop',
          skills: ['string_iterate', 'conditionals', 'accumulator'],
          prompt: 'What does this print?',
          code: `count = 0
for ch in "Mississippi":
    if ch == "s":
        count += 1
print(count)`,
          expectedOutput: '4',
          explanation: '`for ch in s` yields one character at a time. The capital "M" is not "s", and there are four lowercase "s".',
          signature: 'trace:string-loop-count',
          minutes: 2,
        }),
        code({
          id: 'd3-str-count-vowels',
          title: 'Count vowels',
          skills: ['string_iterate', 'conditionals', 'accumulator'],
          prompt: 'Write `count_vowels(s)` for a lowercase string: return how many characters are one of `a e i o u`.',
          starterCode: `def count_vowels(s):
    pass`,
          solution: `def count_vowels(s):
    count = 0
    for ch in s:
        if ch in "aeiou":
            count += 1
    return count`,
          tests: [t.eq('count_vowels("banana")', '3'), t.eq('count_vowels("sky")', '0'), t.hidden('count_vowels("")', '0'), t.hidden('count_vowels("education")', '5')],
          hints: ['Loop over characters with a counter.', '`ch in "aeiou"` checks whether ch is a vowel.'],
          note: '`x in some_string` checks for a substring, so `ch in "aeiou"` is a quick vowel test.',
          signature: 'string:count-matching',
          minutes: 4,
        }),
        code({
          id: 'd3-str-same-ends',
          title: 'Same first and last',
          skills: ['string_index', 'conditionals', 'edge_cases'],
          prompt: 'Write `same_ends(s)`: `True` if the first and last characters are equal. An empty string returns `False`.',
          starterCode: `def same_ends(s):
    pass`,
          solution: `def same_ends(s):
    if not s:
        return False
    return s[0] == s[-1]`,
          tests: [t.eq('same_ends("level")', 'True'), t.eq('same_ends("ab")', 'False'), t.hidden('same_ends("a")', 'True'), t.hidden('same_ends("")', 'False')],
          hints: ['What does `s[0]` do on an empty string?', 'Guard with `if not s: return False` first.'],
          explanation: 'Guarding the empty string first avoids an IndexError. A single character is both first and last, so it matches itself.',
          signature: 'string:ends-compare',
          minutes: 4,
        }),
        code({
          id: 'd3-str-mirror-pairs',
          title: 'Mirror index pairs',
          skills: ['string_index', 'range', 'len', 'list_append'],
          difficulty: 3,
          prompt: "Write `mirror_pairs(s)` returning a list of tuples `(s[i], s[mirror])` for each position `i` in the first half of `s`, where `mirror` is the matching position counted from the end. The middle character of an odd-length string is not paired.\n\n`mirror_pairs('abcd')` → `[('a', 'd'), ('b', 'c')]`",
          starterCode: `def mirror_pairs(s):
    pairs = []
    for i in range(len(s) // 2):
        # the index that mirrors i
        pass
    return pairs`,
          solution: `def mirror_pairs(s):
    pairs = []
    for i in range(len(s) // 2):
        j = len(s) - 1 - i
        pairs.append((s[i], s[j]))
    return pairs`,
          tests: [t.eq('mirror_pairs("abcd")', '[("a", "d"), ("b", "c")]'), t.eq('mirror_pairs("abc")', '[("a", "c")]'), t.hidden('mirror_pairs("")', '[]'), t.hidden('mirror_pairs("x")', '[]')],
          hints: ['Index 0 mirrors the last index, index 1 the one before it.', 'The mirror of i is `len(s) - 1 - i` (or `-1 - i`).'],
          explanation: 'Every palindrome check is really this: compare position i with position `len(s) - 1 - i`. Two pointers just keep both indexes in variables.',
          signature: 'string:mirror-index',
          minutes: 7,
          important: true,
        }),
        code({
          id: 'd3-str-first-digit',
          title: 'Index of the first digit',
          skills: ['string_iterate', 'enumerate', 'string_methods', 'early_return'],
          prompt: 'Write `first_digit_index(s)` that returns the index of the first digit character in `s`, or `-1` if there is none. Use `ch.isdigit()`.',
          starterCode: `def first_digit_index(s):
    pass`,
          solution: `def first_digit_index(s):
    for i, ch in enumerate(s):
        if ch.isdigit():
            return i
    return -1`,
          tests: [t.eq('first_digit_index("abc4d5")', '3'), t.eq('first_digit_index("none")', '-1'), t.hidden('first_digit_index("")', '-1'), t.hidden('first_digit_index("7up")', '0')],
          hints: ['You need the index and the character.', '`for i, ch in enumerate(s):` then return early.'],
          signature: 'string:enumerate-find',
          minutes: 4,
        }),
      ],
    },

    // ───────────────────────────────────────────── Slicing
    {
      id: 'd3-slicing',
      title: 'Slicing',
      summary: 's[a:b] excludes b; [::-1] reverses; slices never raise.',
      exercises: [
        choice({
          id: 'd3-slice-end-exclusive',
          title: 'The end is excluded',
          skills: ['slicing'],
          prompt: 'What is `s[1:4]`?',
          code: `s = "abcdef"`,
          options: ['bcd', 'bcde', 'abcd', 'abc'],
          answer: 0,
          note: '`s[a:b]` takes indexes a, a+1, …, b-1. Its length is `b - a`.',
          explanation: 'Indexes 1, 2 and 3: "bcd". Index 4 is excluded, so the slice has 4 - 1 = 3 characters.',
          signature: 'recognize:slice-end-exclusive',
          minutes: 1,
        }),
        output({
          id: 'd3-slice-trace',
          title: 'Trace four slices',
          skills: ['slicing'],
          prompt: 'What does this print?',
          code: `s = "algorithm"
print(s[:3])
print(s[3:])
print(s[-3:])
print(s[::-1])`,
          expectedOutput: 'alg\norithm\nthm\nmhtirogla',
          explanation: '`s[:3]` and `s[3:]` split the string at index 3 with no overlap. `s[-3:]` is the last three characters. `[::-1]` walks backwards with step -1.',
          signature: 'trace:slice-basic',
          minutes: 2,
        }),
        output({
          id: 'd3-slice-trace-edges',
          title: 'Slice edge cases',
          skills: ['slicing', 'len'],
          difficulty: 2,
          prompt: 'What does this print?',
          code: `s = "code"
print(s[1:1] == "")
print(s[2:100])
print(s[::2])
print(len(s[0:len(s)]))`,
          expectedOutput: 'True\nde\ncd\n4',
          explanation: 'An empty range gives "". Slices clamp out-of-range ends instead of raising. A step of 2 takes every other character.',
          signature: 'trace:slice-edges',
          minutes: 2.5,
        }),
        fill({
          id: 'd3-slice-fill-reverse',
          title: 'Reverse by slicing',
          skills: ['slicing'],
          prompt: 'Fill the blank so `reverse(s)` returns `s` backwards.',
          starterCode: `def reverse(s):
    return s[____]`,
          solution: `def reverse(s):
    return s[::-1]`,
          tests: [t.eq('reverse("abc")', '"cba"'), t.eq('reverse("")', '""')],
          hints: ['Start and stop left empty, step of -1.'],
          signature: 'fill:slice-reverse',
          minutes: 2,
        }),
        code({
          id: 'd3-slice-is-mirror',
          title: 'Palindrome in one line',
          skills: ['slicing', 'functions'],
          prompt: 'Write `is_mirror(s)` in a single `return` line: `True` if `s` reads the same backwards.',
          starterCode: `def is_mirror(s):
    pass`,
          solution: `def is_mirror(s):
    return s == s[::-1]`,
          tests: [t.eq('is_mirror("racecar")', 'True'), t.eq('is_mirror("ab")', 'False'), t.hidden('is_mirror("")', 'True'), t.hidden('is_mirror("Aa")', 'False')],
          explanation: 'Simple and correct, but it builds a reversed copy: O(n) extra space. The two-pointer version later today uses O(1).',
          signature: 'slice:reverse-compare',
          minutes: 4,
          important: true,
        }),
        code({
          id: 'd3-slice-inner',
          title: 'Drop the ends',
          skills: ['slicing'],
          prompt: 'Write `inner(s)` returning `s` without its first and last characters. Strings of length 0–2 give `""`.',
          starterCode: `def inner(s):
    pass`,
          solution: `def inner(s):
    return s[1:-1]`,
          tests: [t.eq('inner("[abc]")', '"abc"'), t.eq('inner("ab")', '""'), t.hidden('inner("a")', '""'), t.hidden('inner("")', '""')],
          hints: ['Start at 1, stop one before the end.', 'A negative stop index works in slices too.'],
          explanation: '`s[1:-1]` never raises: when the start is past the stop, the slice is just empty.',
          signature: 'slice:drop-ends',
          minutes: 4,
        }),
        code({
          id: 'd3-slice-rotate',
          title: 'Rotate left',
          skills: ['slicing', 'len', 'edge_cases'],
          difficulty: 3,
          prompt: 'Write `rotate_left(s, k)`: move the first `k` characters to the end. `k` may be larger than `len(s)` (wrap around). Empty string → `""`.\n\n`rotate_left("abcde", 2)` → `"cdeab"`',
          starterCode: `def rotate_left(s, k):
    pass`,
          solution: `def rotate_left(s, k):
    if not s:
        return ""
    k = k % len(s)
    return s[k:] + s[:k]`,
          tests: [t.eq('rotate_left("abcde", 2)', '"cdeab"'), t.eq('rotate_left("abcde", 0)', '"abcde"'), t.hidden('rotate_left("abcde", 7)', '"cdeab"'), t.hidden('rotate_left("", 3)', '""'), t.hidden('rotate_left("ab", 2)', '"ab"')],
          hints: ['The result is two slices glued together.', '`s[k:] + s[:k]`', 'Wrap k with `k % len(s)`, but guard the empty string first (modulo by zero).'],
          signature: 'slice:rotate',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────────────────────── String methods
    {
      id: 'd3-methods',
      title: 'String methods',
      summary: '.lower(), .isalnum(), .split() and .join() to clean and rebuild text.',
      exercises: [
        choice({
          id: 'd3-meth-isalnum',
          title: 'What is alphanumeric?',
          skills: ['string_methods'],
          prompt: 'For which character does `ch.isalnum()` return `False`?',
          options: ['"7"', '"Q"', '"z"', '","'],
          answer: 3,
          note: '`.isalnum()` is True for letters and digits. `.isalpha()` letters only, `.isdigit()` digits only. Spaces and punctuation are False.',
          explanation: 'Letters (any case) and digits are alphanumeric; punctuation and spaces are not.',
          signature: 'recognize:isalnum',
          minutes: 1,
        }),
        output({
          id: 'd3-meth-trace',
          title: 'Trace lower, split, join',
          skills: ['string_methods'],
          prompt: 'What does this print?',
          code: `s = "Hello, World"
print(s.lower())
print(s.split())
print("-".join(["a", "b", "c"]))
print(s)`,
          expectedOutput: "hello, world\n['Hello,', 'World']\na-b-c\nHello, World",
          explanation: 'String methods return new strings; `s` itself is unchanged. `.split()` splits on whitespace and keeps punctuation attached. `sep.join(list)` puts sep between items.',
          signature: 'trace:string-methods',
          minutes: 2,
        }),
        output({
          id: 'd3-meth-trace-split',
          title: 'Split collapses spaces',
          skills: ['string_methods', 'list_index'],
          prompt: 'What does this print?',
          code: `words = "  the   quick fox ".split()
print(len(words))
print(" ".join(words))
print(words[-1].upper())`,
          expectedOutput: '3\nthe quick fox\nFOX',
          explanation: 'With no argument, `.split()` drops leading/trailing whitespace and treats runs of spaces as one separator.',
          signature: 'trace:split-join',
          minutes: 2,
        }),
        fill({
          id: 'd3-meth-fill-join',
          title: 'Join the kept letters',
          skills: ['string_methods', 'list_append'],
          prompt: 'Fill the blank so `keep_letters` returns only the letters of `s`, in order, as a string.',
          starterCode: `def keep_letters(s):
    letters = []
    for ch in s:
        if ch.isalpha():
            letters.append(ch)
    return ____`,
          solution: `def keep_letters(s):
    letters = []
    for ch in s:
        if ch.isalpha():
            letters.append(ch)
    return "".join(letters)`,
          tests: [t.eq('keep_letters("a1b2c3")', '"abc"'), t.eq('keep_letters("123")', '""')],
          hints: ['Join with an empty separator.'],
          note: 'Building a list then `"".join(parts)` is the idiomatic way to build a string piece by piece.',
          signature: 'fill:join-list',
          minutes: 2,
        }),
        code({
          id: 'd3-meth-clean',
          title: 'Clean a phrase',
          skills: ['string_methods', 'string_iterate', 'list_append'],
          prompt: 'Write `clean(s)`: return `s` lowercased with every character that is not a letter or digit removed.\n\n`clean("A man, a plan")` → `"amanaplan"`',
          starterCode: `def clean(s):
    pass`,
          solution: `def clean(s):
    kept = []
    for ch in s:
        if ch.isalnum():
            kept.append(ch.lower())
    return "".join(kept)`,
          tests: [t.eq('clean("A man, a plan")', '"amanaplan"'), t.eq('clean("Hi 5!")', '"hi5"'), t.hidden('clean("")', '""'), t.hidden('clean("?! ,")', '""')],
          hints: ['Keep some characters, drop others, then build a string.', '`.isalnum()` decides, `.lower()` normalizes.', 'Append kept characters to a list, `"".join` at the end.'],
          signature: 'string:clean-alnum',
          minutes: 4,
          important: true,
        }),
        code({
          id: 'd3-meth-reverse-words',
          title: 'Reverse word order',
          skills: ['string_methods', 'slicing'],
          prompt: 'Write `reverse_words(s)` returning the words of `s` in reverse order, separated by single spaces. Extra spaces in the input disappear.\n\n`reverse_words("  the sky  is blue ")` → `"blue is sky the"`',
          starterCode: `def reverse_words(s):
    pass`,
          solution: `def reverse_words(s):
    return " ".join(s.split()[::-1])`,
          tests: [t.eq('reverse_words("the sky is blue")', '"blue is sky the"'), t.eq('reverse_words("  the sky  is blue ")', '"blue is sky the"'), t.hidden('reverse_words("")', '""'), t.hidden('reverse_words("one")', '"one"')],
          hints: ['Split into a list of words first.', 'Reverse the list with a slice, then join with a space.'],
          signature: 'string:split-reverse-join',
          minutes: 4,
        }),
        code({
          id: 'd3-meth-word-counts',
          title: 'Word frequency',
          skills: ['string_methods', 'frequency_map', 'dict_get'],
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `word_counts(s)` that counts words case-insensitively. Words are separated by whitespace.\n\n`word_counts("The cat the hat")` → `{"the": 2, "cat": 1, "hat": 1}`',
          starterCode: `def word_counts(s):
    pass`,
          solution: `def word_counts(s):
    counts = {}
    for w in s.lower().split():
        counts[w] = counts.get(w, 0) + 1
    return counts`,
          tests: [t.eq('word_counts("The cat the hat")', '{"the": 2, "cat": 1, "hat": 1}'), t.eq('word_counts("")', '{}'), t.hidden('word_counts("a A a")', '{"a": 3}')],
          hints: ['Normalize case before splitting.', 'Then it is yesterday’s frequency map over a list of words.'],
          signature: 'freq-map:count-words',
          minutes: 4,
        }),
        code({
          id: 'd3-meth-clean-mirror',
          title: 'Clean, then compare',
          skills: ['string_methods', 'slicing'],
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `is_clean_mirror(s)`: ignoring case and anything that is not a letter or digit, does `s` read the same backwards? Build a cleaned string and compare it with its reverse.',
          starterCode: `def is_clean_mirror(s):
    pass`,
          solution: `def is_clean_mirror(s):
    cleaned = "".join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]`,
          tests: [t.eq('is_clean_mirror("Step on no pets!")', 'True'), t.eq('is_clean_mirror("Hello")', 'False'), t.hidden('is_clean_mirror("")', 'True'), t.hidden('is_clean_mirror("1a2")', 'False'), t.hidden('is_clean_mirror(".,")', 'True')],
          hints: ['Two steps: clean, then check.', 'Reuse your `clean` logic, then `cleaned == cleaned[::-1]`.'],
          explanation: 'Correct in O(n) time but O(n) extra space for the cleaned copy. Interviewers often ask for the O(1)-space two-pointer version next.',
          signature: 'palindrome:clean-slice',
          minutes: 4,
        }),
      ],
    },

    // ───────────────────────────────────────────── Two pointers
    {
      id: 'd3-two-pointers',
      title: 'Two pointers',
      summary: 'left and right indexes walking toward each other in a while loop.',
      exercises: [
        choice({
          id: 'd3-tp-loop-condition',
          title: 'When do the pointers stop?',
          skills: ['two_pointer', 'while_loop'],
          prompt: 'You compare `s[left]` with `s[right]`, starting at both ends. Which loop header is right?',
          options: ['while left < right:', 'while left <= len(s):', 'while right > 0:', 'for left in range(right):'],
          answer: 0,
          note: 'Opposite-end pointers: `left, right = 0, len(s) - 1` then `while left < right:`. When they meet, the middle character has nothing to compare with.',
          explanation: 'Once left reaches right, every pair has been compared. `left <= right` also works but compares the middle character with itself.',
          signature: 'recognize:two-pointer-condition',
          minutes: 1,
        }),
        output({
          id: 'd3-tp-trace-pairs',
          title: 'Trace pointers on "racecar"',
          skills: ['two_pointer', 'while_loop', 'string_index'],
          prompt: 'What does this print?',
          code: `s = "racecar"
left, right = 0, len(s) - 1
while left < right:
    print(left, right, s[left], s[right])
    left += 1
    right -= 1
print("met at", left)`,
          expectedOutput: '0 6 r r\n1 5 a a\n2 4 c c\nmet at 3',
          explanation: 'Each step moves both pointers one place inward. With 7 characters they meet at the middle index 3, which is never compared.',
          signature: 'trace:two-pointer-inward',
          minutes: 2,
        }),
        fill({
          id: 'd3-tp-fill-move',
          title: 'Move both pointers',
          skills: ['two_pointer', 'while_loop'],
          prompt: 'Fill the two blanks so the loop makes progress.',
          starterCode: `def ends_match(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        ____
        ____
    return True`,
          solution: `def ends_match(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True`,
          tests: [t.eq('ends_match("abba")', 'True'), t.eq('ends_match("abca")', 'False'), t.hidden('ends_match("")', 'True')],
          hints: ['Without these lines the loop never ends.', 'left moves right, right moves left.'],
          signature: 'fill:two-pointer-step',
          minutes: 2,
        }),
        code({
          id: 'd3-tp-palindrome-plain',
          title: 'Palindrome with pointers',
          skills: ['two_pointer', 'while_loop', 'string_index', 'early_return'],
          prompt: 'Write `is_pal(s)` with two pointers (no slicing, no reversed copy). Compare characters exactly as they are.',
          starterCode: `def is_pal(s):
    pass`,
          solution: `def is_pal(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True`,
          tests: [t.eq('is_pal("level")', 'True'), t.eq('is_pal("levels")', 'False'), t.hidden('is_pal("")', 'True'), t.hidden('is_pal("z")', 'True'), t.hidden('is_pal("abBA")', 'False')],
          hints: ['Start at both ends.', '`while left < right:` compare, return False on mismatch.', 'Move both pointers inward after a match.'],
          signature: 'two-pointer:palindrome',
          minutes: 4,
          important: true,
        }),
        code({
          id: 'd3-tp-swap-reverse',
          title: 'Reverse a list in place',
          skills: ['two_pointer', 'list_index', 'tuples'],
          prompt: 'Write `reverse_in_place(nums)` that reverses the list **in place** by swapping from both ends, then returns it. Do not use slicing or `.reverse()`.',
          starterCode: `def reverse_in_place(nums):
    pass`,
          solution: `def reverse_in_place(nums):
    left, right = 0, len(nums) - 1
    while left < right:
        nums[left], nums[right] = nums[right], nums[left]
        left += 1
        right -= 1
    return nums`,
          tests: [
            t.eq('reverse_in_place([1, 2, 3])', '[3, 2, 1]'),
            t.eq('reverse_in_place([])', '[]'),
            t.check('modifies the same list', 'a = [1, 2, 3, 4]\nreverse_in_place(a)\nassert a == [4, 3, 2, 1], a', true),
            t.hidden('reverse_in_place([7, 8])', '[8, 7]'),
          ],
          hints: ['Swap the two ends, then move inward.', 'Python swaps in one line: `a[i], a[j] = a[j], a[i]`.'],
          signature: 'two-pointer:swap-reverse',
          minutes: 4,
        }),
        code({
          id: 'd3-tp-mismatches',
          title: 'Changes to make a palindrome',
          skills: ['two_pointer', 'while_loop', 'accumulator'],
          prompt: 'Write `changes_needed(s)`: the number of character changes needed to make `s` a palindrome. Each mirror pair that differs needs exactly one change.',
          starterCode: `def changes_needed(s):
    pass`,
          solution: `def changes_needed(s):
    left, right = 0, len(s) - 1
    changes = 0
    while left < right:
        if s[left] != s[right]:
            changes += 1
        left += 1
        right -= 1
    return changes`,
          tests: [t.eq('changes_needed("abcd")', '2'), t.eq('changes_needed("abca")', '1'), t.hidden('changes_needed("")', '0'), t.hidden('changes_needed("racecar")', '0'), t.hidden('changes_needed("ab")', '1')],
          hints: ['Same pointer walk as a palindrome check.', 'Instead of returning on a mismatch, count it.'],
          signature: 'two-pointer:count-mismatch',
          minutes: 4,
        }),
        code({
          id: 'd3-tp-first-mismatch',
          title: 'First mismatching pair',
          skills: ['two_pointer', 'while_loop', 'tuples', 'early_return'],
          prompt: 'Write `first_mismatch(s)`: walking inward from both ends, return the pair of indexes `(left, right)` of the first characters that differ, or `None` if `s` is a palindrome.',
          starterCode: `def first_mismatch(s):
    pass`,
          solution: `def first_mismatch(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return (left, right)
        left += 1
        right -= 1
    return None`,
          tests: [t.eq('first_mismatch("abcxba")', '(2, 3)'), t.eq('first_mismatch("abca")', '(1, 2)'), t.hidden('first_mismatch("aa")', 'None'), t.hidden('first_mismatch("")', 'None'), t.hidden('first_mismatch("xy")', '(0, 1)')],
          signature: 'two-pointer:first-mismatch',
          minutes: 4,
        }),
        reorder({
          id: 'd3-tp-reorder-palindrome',
          title: 'Rebuild the pointer check',
          skills: ['two_pointer', 'while_loop'],
          prompt: 'Put the lines in order to build a two-pointer palindrome check.',
          lines: [
            'def is_pal(s):',
            '    left, right = 0, len(s) - 1',
            '    while left < right:',
            '        if s[left] != s[right]:',
            '            return False',
            '        left += 1',
            '        right -= 1',
            '    return True',
          ],
          tests: [t.eq('is_pal("noon")', 'True'), t.eq('is_pal("moon")', 'False'), t.hidden('is_pal("")', 'True')],
          signature: 'reorder:two-pointer-palindrome',
          minutes: 3,
        }),
      ],
    },

    // ───────────────────────────────────────────── Move one pointer
    {
      id: 'd3-pointer-updates',
      title: 'Move one pointer',
      summary: 'On a sorted array, a comparison decides which single pointer moves.',
      exercises: [
        choice({
          id: 'd3-pu-which-pointer',
          title: 'Which pointer moves?',
          skills: ['pointer_update'],
          prompt: 'The list is sorted ascending. `nums[left] + nums[right]` is **smaller** than the target. What do you do?',
          options: ['left += 1 (try a bigger small number)', 'right -= 1 (try a smaller big number)', 'Move both pointers', 'Start over from the ends'],
          answer: 0,
          note: 'Sorted input: sum too small → `left += 1`; too big → `right -= 1`; equal → found. Exactly one pointer moves per step.',
          explanation: 'Moving right inward could only make the sum smaller. The only way to grow it is to advance left.',
          signature: 'recognize:pointer-update-direction',
          minutes: 1,
        }),
        output({
          id: 'd3-pu-trace-sorted-sum',
          title: 'Trace a sorted pair search',
          skills: ['pointer_update', 'two_pointer', 'while_loop'],
          difficulty: 2,
          prompt: 'What does this print?',
          code: `nums = [1, 3, 4, 6, 9]
target = 13
left, right = 0, len(nums) - 1
while left < right:
    total = nums[left] + nums[right]
    print(left, right, total)
    if total == target:
        break
    elif total < target:
        left += 1
    else:
        right -= 1`,
          expectedOutput: '0 4 10\n1 4 12\n2 4 13',
          explanation: 'Each sum is too small, so only left moves until 4 + 9 hits 13.',
          signature: 'trace:sorted-pair-sum',
          minutes: 2.5,
        }),
        output({
          id: 'd3-pu-trace-right-moves',
          title: 'Trace when the sum is too big',
          skills: ['pointer_update', 'two_pointer'],
          difficulty: 2,
          prompt: 'What does this print?',
          code: `nums = [2, 5, 8, 12]
target = 7
left, right = 0, len(nums) - 1
moves = []
while left < right:
    total = nums[left] + nums[right]
    if total == target:
        break
    if total > target:
        right -= 1
        moves.append("R")
    else:
        left += 1
        moves.append("L")
print(moves, left, right)`,
          expectedOutput: "['R', 'R'] 0 1",
          explanation: '2 + 12 = 14 and 2 + 8 = 10 are too big, so right moves twice; 2 + 5 = 7 matches and the loop breaks with left still at 0.',
          signature: 'trace:sorted-pair-shrink',
          minutes: 2.5,
        }),
        fill({
          id: 'd3-pu-fill-branches',
          title: 'Fill the pointer moves',
          skills: ['pointer_update', 'two_pointer', 'conditionals'],
          prompt: 'The list is sorted. Fill the blanks so exactly one pointer moves each step.',
          starterCode: `def has_pair(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return True
        elif total < target:
            ____
        else:
            ____
    return False`,
          solution: `def has_pair(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return True
        elif total < target:
            left += 1
        else:
            right -= 1
    return False`,
          tests: [t.eq('has_pair([1, 2, 4, 7], 9)', 'True'), t.eq('has_pair([1, 2, 4, 7], 10)', 'False'), t.hidden('has_pair([], 0)', 'False'), t.hidden('has_pair([-3, 0, 3], 0)', 'True')],
          hints: ['Too small: which pointer makes the sum larger?'],
          signature: 'fill:sorted-pair-branches',
          minutes: 2,
        }),
        code({
          id: 'd3-pu-count-pairs',
          title: 'Count pairs with a sum',
          skills: ['pointer_update', 'two_pointer', 'accumulator'],
          difficulty: 3,
          prompt: 'Write `count_pairs(nums, target)`. `nums` is sorted and has **no duplicates**. Return how many pairs of different positions add up to `target`.',
          starterCode: `def count_pairs(nums, target):
    pass`,
          solution: `def count_pairs(nums, target):
    left, right = 0, len(nums) - 1
    count = 0
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            count += 1
            left += 1
            right -= 1
        elif total < target:
            left += 1
        else:
            right -= 1
    return count`,
          tests: [t.eq('count_pairs([1, 2, 3, 4, 5, 6], 7)', '3'), t.eq('count_pairs([1, 2], 5)', '0'), t.hidden('count_pairs([], 0)', '0'), t.hidden('count_pairs([-3, -1, 0, 1, 3], 0)', '2'), t.hidden('count_pairs([2, 4], 6)', '1')],
          hints: ['Same scan as the pair search, but do not stop at the first match.', 'After a match, both values are used up: move both pointers (values are distinct).'],
          explanation: 'With distinct values, a matched left can never pair with anything else, and neither can the matched right, so both move.',
          signature: 'sorted-pair:count',
          minutes: 7,
        }),
        code({
          id: 'd3-pu-skip-spaces',
          title: 'Palindrome, skipping spaces',
          skills: ['pointer_update', 'two_pointer', 'while_loop'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `is_pal_ignoring_spaces(s)` with two pointers: spaces are skipped, every other character must match exactly. Do not build a new string.\n\n`"taco cat"` → `True`',
          starterCode: `def is_pal_ignoring_spaces(s):
    left, right = 0, len(s) - 1
    # while left < right:
    #     skip spaces on the left, then on the right
    #     compare, then move inward
    return None`,
          solution: `def is_pal_ignoring_spaces(s):
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and s[left] == " ":
            left += 1
        while left < right and s[right] == " ":
            right -= 1
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True`,
          tests: [t.eq('is_pal_ignoring_spaces("taco cat")', 'True'), t.eq('is_pal_ignoring_spaces("ab  c")', 'False'), t.hidden('is_pal_ignoring_spaces("   ")', 'True'), t.hidden('is_pal_ignoring_spaces("")', 'True'), t.hidden('is_pal_ignoring_spaces(" a b a")', 'True'), t.hidden('is_pal_ignoring_spaces("ab ")', 'False')],
          hints: [
            'Before comparing, each pointer must land on a non-space.',
            'An inner `while` loop advances one pointer past spaces.',
            '`while left < right and s[left] == " ": left += 1` (and the mirror for right).',
            'Skip left, skip right, compare, step both inward; the outer loop repeats.',
          ],
          explanation: 'The inner loops keep `left < right` in their condition so they cannot run past each other or off the string.',
          signature: 'two-pointer:skip-chars',
          minutes: 7,
          important: true,
        }),
        code({
          id: 'd3-pu-count-below',
          title: 'Count pairs below a target',
          skills: ['pointer_update', 'two_pointer', 'accumulator'],
          difficulty: 4,
          prompt: 'Write `count_below(nums, target)`. `nums` is sorted. Return how many index pairs `i < j` have `nums[i] + nums[j] < target`. Aim for O(n).',
          starterCode: `def count_below(nums, target):
    pass`,
          solution: `def count_below(nums, target):
    left, right = 0, len(nums) - 1
    count = 0
    while left < right:
        if nums[left] + nums[right] < target:
            count += right - left
            left += 1
        else:
            right -= 1
    return count`,
          tests: [t.eq('count_below([1, 2, 3, 4], 6)', '4'), t.eq('count_below([5, 6], 3)', '0'), t.hidden('count_below([], 1)', '0'), t.hidden('count_below([-2, 0, 1, 3], 2)', '4'), t.hidden('count_below([1, 1, 1], 5)', '3')],
          hints: [
            'If nums[left] + nums[right] is already small enough, what about nums[left] with anything between them?',
            'Everything between left and right is ≤ nums[right], so all those pairs count too.',
            'On "small enough": `count += right - left` then `left += 1`.',
            'Otherwise the right value is too big for any partner: `right -= 1`.',
          ],
          explanation: 'One comparison settles `right - left` pairs at once, which is why the scan is linear instead of quadratic.',
          signature: 'sorted-pair:count-below',
          minutes: 11,
        }),
        code({
          id: 'd3-pu-closest-sum',
          title: 'Closest pair sum',
          skills: ['pointer_update', 'two_pointer', 'state_tracking'],
          difficulty: 4,
          prompt: 'Write `closest_sum(nums, target)`. `nums` is sorted with at least two items. Return the pair sum closest to `target` (tests have no ties).',
          starterCode: `def closest_sum(nums, target):
    pass`,
          solution: `def closest_sum(nums, target):
    left, right = 0, len(nums) - 1
    best = nums[left] + nums[right]
    while left < right:
        total = nums[left] + nums[right]
        if abs(total - target) < abs(best - target):
            best = total
        if total < target:
            left += 1
        elif total > target:
            right -= 1
        else:
            return total
    return best`,
          tests: [t.eq('closest_sum([1, 4, 6, 9], 12)', '13'), t.eq('closest_sum([2, 3], 100)', '5'), t.hidden('closest_sum([-4, -1, 2, 5], 0)', '1'), t.hidden('closest_sum([1, 2, 3, 4], 7)', '7'), t.hidden('closest_sum([-10, -5, 0], -14)', '-15')],
          hints: [
            'Same pointer moves as the exact search; you just remember the best so far.',
            'Track `best` and update it when `abs(total - target)` improves.',
            'An exact hit is the best possible; return it immediately.',
          ],
          signature: 'sorted-pair:closest',
          minutes: 11,
        }),
        choice({
          id: 'd3-pu-why-linear',
          title: 'Why O(n)?',
          skills: ['two_pointer', 'complexity'],
          prompt: 'Why does the sorted two-pointer pair search run in O(n) time?',
          options: [
            'Each step moves one pointer inward, so there are at most n - 1 steps',
            'It uses a hash map for O(1) lookups',
            'It halves the search space each step',
            'Sorting makes every comparison free',
          ],
          answer: 0,
          explanation: 'The gap `right - left` shrinks by one each iteration and starts at n - 1. Space is O(1): two integers.',
          signature: 'recognize:two-pointer-complexity',
          minutes: 1,
        }),
      ],
    },

    // ───────────────────────────────────────────── Pointer patterns
    {
      id: 'd3-pointer-patterns',
      title: 'Pointer patterns',
      summary: 'Pointers in the same direction and across two sequences.',
      exercises: [
        code({
          id: 'd3-pp-subsequence',
          title: 'Is it a subsequence?',
          skills: ['two_pointer', 'pointer_update', 'while_loop'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `is_subsequence(small, big)`: `True` if the characters of `small` appear in `big` in the same order (not necessarily next to each other).\n\n`is_subsequence("ace", "abcde")` → `True`',
          starterCode: `def is_subsequence(small, big):
    pass`,
          solution: `def is_subsequence(small, big):
    i = 0
    for ch in big:
        if i < len(small) and small[i] == ch:
            i += 1
    return i == len(small)`,
          tests: [t.eq('is_subsequence("ace", "abcde")', 'True'), t.eq('is_subsequence("aec", "abcde")', 'False'), t.hidden('is_subsequence("", "abc")', 'True'), t.hidden('is_subsequence("a", "")', 'False'), t.hidden('is_subsequence("aa", "a")', 'False')],
          hints: ['One pointer walks `big` every step; the other walks `small` only on a match.', 'Guard `i < len(small)` before reading `small[i]`.', 'At the end, did `i` reach `len(small)`?'],
          signature: 'two-pointer:subsequence',
          minutes: 7,
        }),
        code({
          id: 'd3-pp-merge',
          title: 'Merge two sorted lists',
          skills: ['two_pointer', 'pointer_update', 'list_append', 'while_loop'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `merge_sorted(a, b)` that returns one sorted list containing everything from the sorted lists `a` and `b`. Do not call `sorted`.',
          starterCode: `def merge_sorted(a, b):
    pass`,
          solution: `def merge_sorted(a, b):
    i, j = 0, 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out`,
          tests: [t.eq('merge_sorted([1, 4, 7], [2, 3, 9])', '[1, 2, 3, 4, 7, 9]'), t.eq('merge_sorted([], [1, 2])', '[1, 2]'), t.hidden('merge_sorted([1, 1], [1])', '[1, 1, 1]'), t.hidden('merge_sorted([], [])', '[]'), t.hidden('merge_sorted([5, 6], [1, 2])', '[1, 2, 5, 6]')],
          hints: ['One pointer per list.', 'Take the smaller front item and advance only that pointer.', 'Loop while both have items, then add whatever is left with slices.'],
          signature: 'two-pointer:merge-two',
          minutes: 7,
        }),
        code({
          id: 'd3-pp-dedupe',
          title: 'Dedupe a sorted list in place',
          skills: ['two_pointer', 'pointer_update', 'list_index'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `dedupe_sorted(nums)`. `nums` is sorted. Rearrange it **in place** so its first `k` positions hold each distinct value once, in order, and return `k`. What is after position `k` does not matter.\n\n`[1, 1, 2, 3, 3]` → returns `3`, list starts `[1, 2, 3, ...]`',
          starterCode: `def dedupe_sorted(nums):
    pass`,
          solution: `def dedupe_sorted(nums):
    if not nums:
        return 0
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write`,
          tests: [
            t.eq('dedupe_sorted([1, 1, 2])', '2'),
            t.check('first k are unique', 'a = [1, 1, 2, 3, 3]\nk = dedupe_sorted(a)\nassert k == 3 and a[:k] == [1, 2, 3], (k, a)'),
            t.hidden('dedupe_sorted([])', '0'),
            t.check('all equal', 'a = [4, 4, 4]\nk = dedupe_sorted(a)\nassert k == 1 and a[:1] == [4], (k, a)', true),
            t.check('already unique', 'a = [-1, 0, 5]\nk = dedupe_sorted(a)\nassert k == 3 and a == [-1, 0, 5], (k, a)', true),
          ],
          hints: [
            'Both pointers move left to right: one reads every item, one marks where the next keeper goes.',
            '`read` scans; `write` is the length of the deduped prefix.',
            'Keep `nums[read]` when it differs from the last kept value `nums[write - 1]`.',
          ],
          explanation: 'A slow write pointer and a fast read pointer: everything before `write` is final. Sorted input means duplicates are adjacent, so comparing with the last kept value is enough.',
          signature: 'two-pointer:read-write',
          minutes: 7,
        }),
        code({
          id: 'd3-pp-squares',
          title: 'Sorted squares',
          skills: ['two_pointer', 'pointer_update', 'list_index'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `sorted_squares(nums)`. `nums` is sorted and may contain negatives. Return the squares in sorted order in O(n), without calling `sorted`.\n\n`[-4, -1, 0, 3]` → `[0, 1, 9, 16]`',
          starterCode: `def sorted_squares(nums):
    pass`,
          solution: `def sorted_squares(nums):
    out = [0] * len(nums)
    left, right = 0, len(nums) - 1
    pos = len(nums) - 1
    while left <= right:
        if abs(nums[left]) > abs(nums[right]):
            out[pos] = nums[left] * nums[left]
            left += 1
        else:
            out[pos] = nums[right] * nums[right]
            right -= 1
        pos -= 1
    return out`,
          tests: [t.eq('sorted_squares([-4, -1, 0, 3])', '[0, 1, 9, 16]'), t.eq('sorted_squares([1, 2])', '[1, 4]'), t.hidden('sorted_squares([])', '[]'), t.hidden('sorted_squares([-3, -2])', '[4, 9]'), t.hidden('sorted_squares([-2, 2])', '[4, 4]')],
          hints: [
            'Where is the largest square: in the middle or at one of the ends?',
            'The biggest absolute value is always at left or right.',
            'Fill the result from the back: compare `abs(nums[left])` and `abs(nums[right])`.',
            'Use `while left <= right` so the last element is placed too.',
          ],
          explanation: 'The largest square always sits at an end, so filling from the back with two pointers avoids an O(n log n) sort.',
          signature: 'two-pointer:fill-from-back',
          minutes: 11,
        }),
      ],
    },

    // ───────────────────────────────────────────── Running state
    {
      id: 'd3-running-state',
      title: 'Running min/max',
      summary: 'Carry the best-so-far or min-so-far through one scan.',
      exercises: [
        choice({
          id: 'd3-rs-init',
          title: 'Start the minimum',
          skills: ['state_tracking'],
          prompt: 'You track the smallest value so far in a non-empty list of prices. Which start is safe for any input?',
          options: ['lowest = prices[0]', 'lowest = 0', 'lowest = -1', 'lowest = len(prices)'],
          answer: 0,
          note: "Start a running min/max from the first item (or `float('inf')` / `float('-inf')`), never from a made-up number like 0.",
          explanation: 'If every price is above 0, starting at 0 makes the minimum wrong forever. The first item is always a real candidate.',
          signature: 'recognize:running-min-init',
          minutes: 1,
        }),
        output({
          id: 'd3-rs-trace-min',
          title: 'Trace min so far',
          skills: ['state_tracking', 'list_append'],
          prompt: 'What does this print?',
          code: `prices = [8, 5, 7, 3, 6]
lowest = prices[0]
mins = []
for p in prices:
    lowest = min(lowest, p)
    mins.append(lowest)
print(mins)`,
          expectedOutput: '[8, 5, 5, 3, 3]',
          explanation: 'The running minimum only ever goes down. Each entry is the smallest price seen up to and including that day.',
          signature: 'trace:running-min',
          minutes: 2,
        }),
        output({
          id: 'd3-rs-trace-best',
          title: 'Trace best and where',
          skills: ['state_tracking', 'enumerate', 'conditionals'],
          prompt: 'What does this print?',
          code: `nums = [3, -1, 4, -1, 5, 5]
best = nums[0]
best_at = 0
for i, x in enumerate(nums):
    if x > best:
        best = x
        best_at = i
print(best, best_at)`,
          expectedOutput: '5 4',
          explanation: 'The strict `>` keeps the first index of the maximum: the second 5 is not greater than 5.',
          signature: 'trace:running-max-index',
          minutes: 2,
        }),
        fill({
          id: 'd3-rs-fill-max',
          title: 'Best so far',
          skills: ['state_tracking', 'accumulator'],
          prompt: 'Fill the blank so `largest` returns the biggest value. It must work for all-negative lists.',
          starterCode: `def largest(nums):
    best = nums[0]
    for x in nums:
        best = ____
    return best`,
          solution: `def largest(nums):
    best = nums[0]
    for x in nums:
        best = max(best, x)
    return best`,
          tests: [t.eq('largest([3, 9, 2])', '9'), t.eq('largest([-5, -2, -9])', '-2')],
          hints: ['`max(a, b)` returns the larger of two values.'],
          signature: 'fill:running-max',
          minutes: 2,
        }),
        code({
          id: 'd3-rs-prefix-mins',
          title: 'Prefix minimums',
          skills: ['state_tracking', 'list_append'],
          prompt: 'Write `prefix_mins(nums)` returning a list where entry `i` is the smallest of `nums[0..i]`.',
          starterCode: `def prefix_mins(nums):
    pass`,
          solution: `def prefix_mins(nums):
    out = []
    lowest = float("inf")
    for x in nums:
        lowest = min(lowest, x)
        out.append(lowest)
    return out`,
          tests: [t.eq('prefix_mins([4, 6, 2, 5, 1])', '[4, 4, 2, 2, 1]'), t.eq('prefix_mins([])', '[]'), t.hidden('prefix_mins([-1, -3, 0])', '[-1, -3, -3]')],
          hints: ["`float('inf')` is a safe start that also handles the empty list.", 'Update the min, then append it.'],
          signature: 'running:prefix-min',
          minutes: 4,
        }),
        code({
          id: 'd3-rs-records',
          title: 'Count new records',
          skills: ['state_tracking', 'conditionals', 'accumulator'],
          prompt: 'Write `count_records(scores)`: how many scores are strictly higher than every score before them? The first score always counts.',
          starterCode: `def count_records(scores):
    pass`,
          solution: `def count_records(scores):
    count = 0
    best = float("-inf")
    for s in scores:
        if s > best:
            count += 1
            best = s
    return count`,
          tests: [t.eq('count_records([3, 1, 4, 1, 5, 9, 2, 6])', '4'), t.eq('count_records([])', '0'), t.hidden('count_records([2, 2, 2])', '1'), t.hidden('count_records([-5, -4, -6])', '2')],
          hints: ['Keep the best seen so far.', 'A record is a score greater than the best; it also becomes the new best.'],
          signature: 'running:count-records',
          minutes: 4,
        }),
        code({
          id: 'd3-rs-biggest-jump',
          title: 'Biggest day-over-day rise',
          skills: ['state_tracking', 'range', 'list_index'],
          prompt: 'Write `biggest_jump(nums)`: the largest `nums[i] - nums[i - 1]` over neighbouring items, or `0` if nothing ever rises (including lists shorter than 2).',
          starterCode: `def biggest_jump(nums):
    pass`,
          solution: `def biggest_jump(nums):
    best = 0
    for i in range(1, len(nums)):
        best = max(best, nums[i] - nums[i - 1])
    return best`,
          tests: [t.eq('biggest_jump([1, 5, 2, 9])', '7'), t.eq('biggest_jump([9, 4, 1])', '0'), t.hidden('biggest_jump([])', '0'), t.hidden('biggest_jump([3])', '0')],
          hints: ['Start at index 1 so `i - 1` exists.', 'Starting `best` at 0 handles "never rises".'],
          signature: 'running:adjacent-diff',
          minutes: 4,
        }),
        code({
          id: 'd3-rs-biggest-drop',
          title: 'Biggest fall from a peak',
          skills: ['state_tracking', 'list_iterate'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `biggest_drop(values)`: the largest `values[i] - values[j]` where `i < j` (an earlier high minus a later low), or `0` if values never fall. One pass.\n\n`[5, 9, 3, 6, 1]` → `8` (9 then 1)',
          starterCode: `def biggest_drop(values):
    pass`,
          solution: `def biggest_drop(values):
    peak = float("-inf")
    best = 0
    for v in values:
        peak = max(peak, v)
        best = max(best, peak - v)
    return best`,
          tests: [t.eq('biggest_drop([5, 9, 3, 6, 1])', '8'), t.eq('biggest_drop([1, 2, 3])', '0'), t.hidden('biggest_drop([])', '0'), t.hidden('biggest_drop([4, 1, 7, 2])', '5'), t.hidden('biggest_drop([3, 3])', '0')],
          hints: [
            'For each value as the "later low", which earlier value matters?',
            'Only the highest value so far matters.',
            'Track `peak` (max so far) and `best` (largest peak - v).',
          ],
          explanation: 'Two pieces of running state: the best peak seen so far, and the best answer so far. Tomorrow’s capstone mirrors this with a minimum.',
          signature: 'running:max-so-far-gap',
          minutes: 7,
          important: true,
        }),
      ],
    },

    // ───────────────────────────────────────────── Valid Palindrome
    {
      id: 'd3-valid-palindrome',
      title: 'Valid Palindrome',
      summary: 'Two pointers that skip junk and compare case-insensitively.',
      exercises: [
        capstone({
          id: 'cap-valid-palindrome',
          title: 'Valid Palindrome',
          problemId: 'valid-palindrome',
          skills: ['two_pointer', 'pointer_update', 'string_index', 'string_methods', 'while_loop'],
          prompt:
            'Decide whether a phrase is a mirror phrase. Only letters and digits count, and upper/lower case are treated the same; spaces, punctuation and symbols are ignored completely. Return `True` if the remaining characters read the same from both ends, otherwise `False`.\n\nAim for O(1) extra space: walk two indexes over the original string instead of building a cleaned copy.',
          starterCode: `def is_palindrome(s: str) -> bool:
    pass`,
          solution: `def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True`,
          examples: [
            { input: 's = "Was it a car or a cat I saw?"', output: 'True', note: 'Letters only: wasitacaroracatisaw' },
            { input: 's = "race a car"', output: 'False', note: 'raceacar is not a mirror' },
            { input: 's = " "', output: 'True', note: 'Nothing left to compare' },
          ],
          tests: [
            t.eq('is_palindrome("Was it a car or a cat I saw?")', 'True'),
            t.eq('is_palindrome("race a car")', 'False'),
            t.eq('is_palindrome(" ")', 'True'),
            t.hidden('is_palindrome("")', 'True'),
            t.hidden('is_palindrome("a")', 'True'),
            t.hidden('is_palindrome("0P")', 'False'),
            t.hidden('is_palindrome(".,!")', 'True'),
            t.hidden('is_palindrome("Ab1bA")', 'True'),
            t.hidden('is_palindrome("ab")', 'False'),
            t.hidden('is_palindrome("A man, a plan, a canal: Panama")', 'True'),
          ],
          hints: [
            'You compare from both ends, but some characters do not count.',
            'Two pointers; before each comparison, each pointer skips characters that are not `.isalnum()`.',
            'Inner loops: `while left < right and not s[left].isalnum(): left += 1`, mirrored for right. Compare with `.lower()`.',
            'Outer `while left < right`: skip left, skip right, compare lowercase, return False on mismatch, move both inward. Return True after the loop.',
          ],
          complexity: { time: 'O(n)', space: 'O(1)' },
          explanation: 'Each pointer only moves inward, so every character is visited at most once: O(n) time. No cleaned copy is built, so extra space is O(1). The `left < right` guard in the inner loops stops them from crossing on strings made of junk.',
          signature: 'capstone:valid-palindrome',
          minutes: 25,
        }),
        explain({
          id: 'd3-explain-valid-palindrome',
          title: 'Explain Valid Palindrome',
          skills: ['explanation', 'complexity', 'edge_cases', 'two_pointer'],
          prompt: 'Explain your solution as you would to an interviewer: the approach, why the pointers never go wrong, the complexity, and the edge cases you checked.',
          rubric: [
            'Approach: left/right pointers from both ends, skipping non-alphanumeric characters, comparing lowercase.',
            'Invariant: everything outside [left, right] has already been matched.',
            'Why the inner loops also check left < right (strings of only punctuation).',
            'O(n) time, O(1) space, and the trade-off versus building a cleaned reversed copy.',
            'Edge cases: empty string, only punctuation, digits vs letters ("0P").',
          ],
          signature: 'explain:valid-palindrome',
          minutes: 5,
        }),
        code({
          id: 'd3-vp-one-deletion',
          title: 'Palindrome after one deletion',
          skills: ['two_pointer', 'pointer_update', 'functions', 'slicing'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Stretch: write `almost_palindrome(s)`: `True` if `s` is a palindrome, or becomes one after deleting **at most one** character. Compare characters exactly (no cleaning). Aim for O(n).\n\n`"abca"` → `True` (delete "b" or "c")',
          starterCode: `def almost_palindrome(s):
    pass`,
          solution: `def almost_palindrome(s):
    def is_pal(lo, hi):
        while lo < hi:
            if s[lo] != s[hi]:
                return False
            lo += 1
            hi -= 1
        return True

    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return is_pal(left + 1, right) or is_pal(left, right - 1)
        left += 1
        right -= 1
    return True`,
          tests: [
            t.eq('almost_palindrome("aba")', 'True'),
            t.eq('almost_palindrome("abca")', 'True'),
            t.eq('almost_palindrome("abc")', 'False'),
            t.hidden('almost_palindrome("")', 'True'),
            t.hidden('almost_palindrome("deeee")', 'True'),
            t.hidden('almost_palindrome("abcda")', 'False'),
            t.hidden('almost_palindrome("cbbcc")', 'True'),
          ],
          hints: [
            'Walk inward as usual. Everything is fine until the first mismatch.',
            'At a mismatch you get one deletion: drop the left character or the right one.',
            'Check whether `s[left+1..right]` or `s[left..right-1]` is a palindrome.',
            'Write a helper `is_pal(lo, hi)` with the same pointer loop; return `is_pal(left + 1, right) or is_pal(left, right - 1)`.',
          ],
          explanation: 'The outer pairs already matched, so only the inner range needs rechecking, once per choice. That keeps it O(n) instead of trying every deletion.',
          signature: 'two-pointer:skip-one',
          minutes: 11,
        }),
      ],
    },

    // ───────────────────────────────────────────── Best time to buy and sell
    {
      id: 'd3-stock',
      title: 'Stock profit',
      summary: 'Min so far plus best so far in one pass.',
      exercises: [
        capstone({
          id: 'cap-best-time-stock',
          title: 'Best Time to Buy and Sell Stock',
          problemId: 'best-time-stock',
          skills: ['state_tracking', 'list_iterate', 'accumulator'],
          prompt:
            "`prices[i]` is a share's price on day `i`. You may buy once and sell once, and the sale must happen on a later day than the purchase. Return the largest profit you could make, or `0` if no trade makes money. The list may be empty.\n\nOne pass, O(1) extra space.",
          starterCode: `from typing import List


def max_profit(prices: List[int]) -> int:
    pass`,
          solution: `from typing import List


def max_profit(prices: List[int]) -> int:
    lowest = float("inf")
    best = 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best`,
          examples: [
            { input: 'prices = [7, 1, 5, 3, 6, 4]', output: '5', note: 'Buy at 1, sell at 6' },
            { input: 'prices = [7, 6, 4, 3, 1]', output: '0', note: 'Prices only fall' },
          ],
          tests: [
            t.eq('max_profit([7, 1, 5, 3, 6, 4])', '5'),
            t.eq('max_profit([7, 6, 4, 3, 1])', '0'),
            t.hidden('max_profit([])', '0'),
            t.hidden('max_profit([5])', '0'),
            t.hidden('max_profit([1, 2])', '1'),
            t.hidden('max_profit([2, 1, 2, 1, 0, 1, 2])', '2'),
            t.hidden('max_profit([3, 3, 3])', '0'),
            t.hidden('max_profit([2, 4, 1])', '2'),
            t.hidden('max_profit([1, 10, 0, 5])', '9'),
          ],
          hints: [
            'If you sell on day i, which buy day is best?',
            'The cheapest price seen so far (on or before day i).',
            'Keep `lowest` (min so far) and `best` (max of `p - lowest`).',
            'For each price: update lowest, then update best with p - lowest. Return best (starts at 0).',
          ],
          complexity: { time: 'O(n)', space: 'O(1)' },
          explanation: 'For every possible sell day the best buy day is the minimum before it, so carrying that minimum turns the O(n²) pair check into one pass. `best` starting at 0 covers "never profitable".',
          signature: 'capstone:best-time-stock',
          minutes: 25,
        }),
        explain({
          id: 'd3-explain-stock',
          title: 'Explain Stock profit',
          skills: ['explanation', 'complexity', 'state_tracking'],
          prompt: 'Explain why one pass is enough, what each variable means, and how you handle a list that only goes down.',
          rubric: [
            'Brute force is all pairs i < j: O(n²).',
            'Key idea: for each sell day, only the minimum price before it matters.',
            'Two pieces of state: lowest so far, best profit so far.',
            'Updating lowest before computing profit is safe (profit 0 on the same day).',
            'O(n) time, O(1) space; empty, single and falling lists return 0.',
          ],
          signature: 'explain:best-time-stock',
          minutes: 5,
        }),
        code({
          id: 'd3-stock-days',
          title: 'Which days to trade?',
          skills: ['state_tracking', 'enumerate', 'tuples'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Variation: write `best_days(prices)` returning `(buy_day, sell_day)` indexes for the most profitable trade, or `None` if no trade makes money. Tests have a single best trade.',
          starterCode: `def best_days(prices):
    pass`,
          solution: `def best_days(prices):
    low_day = 0
    best = 0
    answer = None
    for i, p in enumerate(prices):
        if p < prices[low_day]:
            low_day = i
        if p - prices[low_day] > best:
            best = p - prices[low_day]
            answer = (low_day, i)
    return answer`,
          tests: [t.eq('best_days([7, 1, 5, 3, 6, 4])', '(1, 4)'), t.eq('best_days([5, 4, 3])', 'None'), t.hidden('best_days([])', 'None'), t.hidden('best_days([3, 8, 1, 5])', '(0, 1)'), t.hidden('best_days([4, 2, 9])', '(1, 2)')],
          hints: ['Track the index of the minimum, not just its value.', 'When the profit improves, record `(low_day, i)`.'],
          explanation: 'Tracking an index instead of a value is a common follow-up: the same running state, just remembering where it came from.',
          signature: 'running:min-index-pair',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────────────────────── Two Sum II
    {
      id: 'd3-two-sum-ii',
      title: 'Two Sum II',
      summary: 'Sorted input lets two pointers replace the hash map.',
      exercises: [
        capstone({
          id: 'cap-two-sum-ii',
          title: 'Two Sum II (sorted input)',
          problemId: 'two-sum-ii',
          skills: ['two_pointer', 'pointer_update', 'while_loop'],
          prompt:
            '`numbers` is sorted in non-decreasing order. Exactly one pair of different positions adds up to `target`. Return their positions as a list `[a, b]` using **1-based** positions, with `a < b`.\n\nUse O(1) extra space: no dict or set.',
          starterCode: `from typing import List


def two_sum_sorted(numbers: List[int], target: int) -> List[int]:
    pass`,
          solution: `from typing import List


def two_sum_sorted(numbers: List[int], target: int) -> List[int]:
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]
        if total < target:
            left += 1
        else:
            right -= 1
    return []`,
          examples: [
            { input: 'numbers = [2, 7, 11, 15], target = 9', output: '[1, 2]' },
            { input: 'numbers = [2, 3, 4], target = 6', output: '[1, 3]' },
            { input: 'numbers = [-1, 0], target = -1', output: '[1, 2]' },
          ],
          tests: [
            t.eq('two_sum_sorted([2, 7, 11, 15], 9)', '[1, 2]'),
            t.eq('two_sum_sorted([2, 3, 4], 6)', '[1, 3]'),
            t.eq('two_sum_sorted([-1, 0], -1)', '[1, 2]'),
            t.hidden('two_sum_sorted([1, 2, 3, 4, 4, 9, 56, 90], 8)', '[4, 5]'),
            t.hidden('two_sum_sorted([5, 25, 75], 100)', '[2, 3]'),
            t.hidden('two_sum_sorted([0, 0, 3, 4], 0)', '[1, 2]'),
            t.hidden('two_sum_sorted([1, 3, 5, 7, 9], 16)', '[4, 5]'),
            t.hidden('two_sum_sorted([-10, -8, -2, 1, 2, 5, 6], 0)', '[3, 5]'),
            t.hidden('two_sum_sorted([1, 2], 3)', '[1, 2]'),
          ],
          hints: [
            'Sorted order tells you which way to move when a sum misses.',
            'Start with the smallest and the largest number.',
            'Sum too small → `left += 1`; too big → `right -= 1`; equal → done.',
            'Loop `while left < right`; on a hit return `[left + 1, right + 1]` (1-based).',
          ],
          complexity: { time: 'O(n)', space: 'O(1)' },
          explanation: 'If the sum is too small, the current left value cannot pair with anything (right is already the largest partner), so it is safe to drop it. The symmetric argument drops right. Each step discards one candidate, giving O(n) with no extra memory.',
          signature: 'capstone:two-sum-ii',
          minutes: 25,
        }),
        explain({
          id: 'd3-explain-two-sum-ii',
          title: 'Explain Two Sum II',
          skills: ['explanation', 'complexity', 'two_pointer', 'hash_reasoning'],
          prompt: 'Explain why moving a single pointer can never skip the answer, and compare this with yesterday’s hash map Two Sum.',
          rubric: [
            'Pointers start at the smallest and largest values.',
            'Too small: nums[left] cannot pair with anything left of right, so drop it (left += 1). Symmetric for too big.',
            'Exactly one pointer moves per step; the loop ends within n - 1 steps.',
            'O(n) time, O(1) space versus the hash map’s O(n) space; this needs sorted input.',
            'Remembers the 1-based output.',
          ],
          signature: 'explain:two-sum-ii',
          minutes: 5,
        }),
        code({
          id: 'd3-tsii-triplet',
          title: 'Three numbers to a target',
          skills: ['two_pointer', 'pointer_update', 'sorting', 'range'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Stretch: write `has_triplet(nums, target)`: `True` if three numbers at different positions add up to `target`. `nums` is **not** sorted. Aim for O(n²).',
          starterCode: `def has_triplet(nums, target):
    pass`,
          solution: `def has_triplet(nums, target):
    nums = sorted(nums)
    for i in range(len(nums) - 2):
        left, right = i + 1, len(nums) - 1
        need = target - nums[i]
        while left < right:
            total = nums[left] + nums[right]
            if total == need:
                return True
            if total < need:
                left += 1
            else:
                right -= 1
    return False`,
          tests: [
            t.eq('has_triplet([4, 1, -3, 2], 3)', 'True'),
            t.eq('has_triplet([1, 2, 3], 10)', 'False'),
            t.hidden('has_triplet([], 0)', 'False'),
            t.hidden('has_triplet([0, 0, 0], 0)', 'True'),
            t.hidden('has_triplet([1, 1, 1], 3)', 'True'),
            t.hidden('has_triplet([5, -1], 4)', 'False'),
            t.hidden('has_triplet([-5, 2, 9, -1, 3], 6)', 'True'),
          ],
          hints: [
            'Fix one number; the other two must add to what is left.',
            'Sort first so the remaining pair can be found with two pointers.',
            'For each i, run the Two Sum II scan on `nums[i+1:]` with `need = target - nums[i]`.',
          ],
          explanation: 'Sorting is O(n log n) and each of n starting points runs an O(n) pointer scan, so O(n²) overall, down from O(n³) for three nested loops.',
          signature: 'sorted-pair:fix-one-plus-scan',
          minutes: 11,
        }),
      ],
    },

    // ───────────────────────────────────────────── Cold reps
    {
      id: 'd3-cold',
      title: 'Cold reps',
      summary: 'Today’s primitives once more, no scaffolding.',
      exercises: [
        output({
          id: 'd3-cold-trace-mix',
          title: 'Slices and pointers',
          skills: ['slicing', 'two_pointer', 'string_methods'],
          ...cold,
          difficulty: 2,
          prompt: 'What does this print?',
          code: `s = "Level Up"
t = s.lower().replace(" ", "")
print(t[:5], t[-2:], t[::-1][:2])
left, right = 0, len(t) - 1
while left < right and t[left] == t[right]:
    left += 1
    right -= 1
print(left, right)`,
          expectedOutput: 'level up pu\n0 6',
          explanation: 't is "levelup". Its first and last characters ("l" and "p") differ, so the loop never runs.',
          signature: 'trace:slice-pointer-mix',
          minutes: 2.5,
        }),
        code({
          id: 'd3-cold-last-k',
          title: 'Last k characters',
          skills: ['slicing', 'edge_cases'],
          ...cold,
          prompt: 'Write `last_k(s, k)` returning the last `k` characters of `s` (all of `s` if `k` is larger). Careful with `k = 0`.',
          starterCode: `def last_k(s, k):
    pass`,
          solution: `def last_k(s, k):
    return s[len(s) - k:] if k > 0 else ""`,
          tests: [t.eq('last_k("hello", 2)', '"lo"'), t.eq('last_k("hi", 0)', '""'), t.hidden('last_k("hi", 5)', '"hi"'), t.hidden('last_k("", 1)', '""')],
          hints: ['`s[-k:]` is almost right. What is `s[-0:]`?'],
          explanation: '`-0` is just `0`, so `s[-0:]` is the whole string. Handling k = 0 separately (or slicing from `len(s) - k`) fixes it.',
          signature: 'slice:last-k',
          minutes: 4,
        }),
        code({
          id: 'd3-cold-pair-exists',
          title: 'Sorted pair, from blank',
          skills: ['two_pointer', 'pointer_update'],
          ...cold,
          prompt: 'Write `pair_exists(nums, target)` for a sorted list: `True` if two different positions sum to `target`. O(1) extra space.',
          solution: `def pair_exists(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return True
        if total < target:
            left += 1
        else:
            right -= 1
    return False`,
          tests: [t.eq('pair_exists([1, 3, 5, 8], 11)', 'True'), t.eq('pair_exists([1, 3, 5, 8], 10)', 'False'), t.hidden('pair_exists([4], 8)', 'False'), t.hidden('pair_exists([], 0)', 'False'), t.hidden('pair_exists([-2, -1, 3], 1)', 'True')],
          signature: 'sorted-pair:exists',
          minutes: 4,
          important: true,
        }),
        code({
          id: 'd3-cold-sell-today',
          title: 'Profit if you sell today',
          skills: ['state_tracking', 'list_append'],
          ...cold,
          prompt: 'Write `sell_today(prices)` returning a list: for each day, the profit from selling that day after buying at the lowest price up to that day.\n\n`[3, 1, 4]` → `[0, 0, 3]`',
          solution: `def sell_today(prices):
    out = []
    lowest = float("inf")
    for p in prices:
        lowest = min(lowest, p)
        out.append(p - lowest)
    return out`,
          tests: [t.eq('sell_today([3, 1, 4])', '[0, 0, 3]'), t.eq('sell_today([])', '[]'), t.hidden('sell_today([5, 6, 2, 9])', '[0, 1, 0, 7]')],
          signature: 'running:min-profit-list',
          minutes: 4,
        }),
        code({
          id: 'd3-cold-letter-pal',
          title: 'Letters-only palindrome',
          skills: ['two_pointer', 'pointer_update', 'string_methods'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `letters_pal(s)`: ignoring case and every character that is not a **letter** (`.isalpha()`, so digits are ignored too), is `s` a palindrome? Two pointers, no copy.',
          solution: `def letters_pal(s):
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalpha():
            left += 1
        while left < right and not s[right].isalpha():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True`,
          tests: [t.eq('letters_pal("No1 on")', 'True'), t.eq('letters_pal("ab9")', 'False'), t.hidden('letters_pal("123")', 'True'), t.hidden('letters_pal("")', 'True'), t.hidden('letters_pal("A-b-A")', 'True')],
          signature: 'two-pointer:skip-chars',
          minutes: 7,
        }),
      ],
    },
  ],
  capstones: ['valid-palindrome', 'best-time-stock', 'two-sum-ii'],
}
