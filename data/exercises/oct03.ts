import type { DayModule } from '@/lib/types'
import { output, code, write, debug, capstone, explain, t } from '@/data/exercises/build'

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
      summary: 'Yesterday from a bare signature: frequency maps, sets, index maps, Two Sum.',
      exercises: [
        write({
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
        write({
          id: 'd3-warm-most-common',
          title: 'Most common item',
          skills: ['frequency_map', 'dict_items', 'state_tracking'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `most_common(items)` returning the item that appears most often. On a tie, return the one that appeared first in `items`. Empty list → `None`.',
          starterCode: `def most_common(items):
    pass`,
          solution: `def most_common(items):
    counts = {}
    for x in items:
        counts[x] = counts.get(x, 0) + 1
    best = None
    for x, c in counts.items():
        if best is None or c > counts[best]:
            best = x
    return best`,
          tests: [
            t.eq('most_common(["a", "b", "a"])', '"a"'),
            t.eq('most_common([3, 1, 3, 1, 2])', '3'),
            t.hidden('most_common([])', 'None'),
            t.hidden('most_common([7])', '7'),
            t.hidden('most_common(["x", "y", "y"])', '"y"'),
          ],
          hints: ['Count first, then scan the counts.', 'Dicts keep insertion order, so the first item seen comes first in `.items()`.', 'Use a strict `>` so an equal count does not replace the earlier winner.'],
          signature: 'freq-map:argmax',
          minutes: 7,
        }),
        write({
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
        write({
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
        write({
          id: 'd3-warm-two-sum',
          title: 'Two Sum from memory',
          skills: ['index_map', 'complement', 'enumerate', 'dict_membership', 'hash_reasoning'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `two_sum(nums, target)` returning the indexes `[i, j]` (i < j) of the two numbers that add to `target`. Exactly one answer exists. One pass with a dict.',
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
          minutes: 6,
        }),
      ],
    },

    // ───────────────────────────────────────────── Strings
    {
      id: 'd3-strings',
      title: 'Strings',
      summary: 'Index into strings (including negative indexes) and loop over characters.',
      exercises: [
        output({
          id: 'd3-str-trace-index',
          title: 'Trace string indexes',
          skills: ['string_index', 'len'],
          prompt: 'What does this print?',
          code: `s = "interview"
print(s[0], s[3], s[-1])
print(len(s), s[len(s) - 1])`,
          expectedOutput: 'i e w\n9 w',
          note: 'A string is a row of characters. Each one sits at a numbered position, its **index**, counted from 0. `s[-1]` is the last character, `s[-k]` is `s[len(s) - k]`. Strings are **immutable**: once made, a string cannot be changed, so `s[0] = "x"` raises TypeError.',
          explanation: 'Indexes start at 0, so `s[3]` is the fourth character. The last valid index is `len(s) - 1`, the same character as `s[-1]`.',
          signature: 'trace:string-index',
          minutes: 2,
        }),
        write({
          id: 'd3-str-count-vowels',
          title: 'Count vowels',
          skills: ['string_iterate', 'conditionals', 'accumulator'],
          prompt: '`s` is a string of lowercase letters (it may be empty). Write `count_vowels(s)` returning how many of its characters are vowels: one of `a e i o u`.\n\n`count_vowels("banana")` → `3`',
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
          note: '`for ch in s:` visits the characters of a string one at a time. `x in some_string` asks whether `x` appears inside that string, so `ch in "aeiou"` is a quick vowel test.',
          signature: 'string:count-matching',
          minutes: 4,
        }),
        write({
          id: 'd3-str-same-ends',
          title: 'Same first and last',
          skills: ['string_index', 'conditionals', 'edge_cases'],
          prompt: '`s` is a string. Write `same_ends(s)` returning `True` if its first and last characters are equal, otherwise `False`. A one-character string counts (that character is both first and last). An empty string returns `False`.\n\n`same_ends("level")` → `True`, `same_ends("ab")` → `False`',
          starterCode: `def same_ends(s):
    pass`,
          solution: `def same_ends(s):
    if not s:
        return False
    return s[0] == s[-1]`,
          tests: [t.eq('same_ends("level")', 'True'), t.eq('same_ends("ab")', 'False'), t.hidden('same_ends("a")', 'True'), t.eq('same_ends("")', 'False')],
          hints: ['What does `s[0]` do on an empty string?', 'Guard with `if not s: return False` first.'],
          explanation: 'Guarding the empty string first avoids an IndexError. A single character is both first and last, so it matches itself.',
          signature: 'string:ends-compare',
          minutes: 3,
        }),
        debug({
          id: 'd3-str-debug-immutable',
          title: 'Capitalize the first letter',
          skills: ['string_index', 'slicing'],
          prompt: '`s` is a string. `capitalize_first(s)` should return a string like `s` but with its first character upper-cased and everything else unchanged: `"hello"` → `"Hello"`. An empty string comes back as `""`. Make the tests pass.',
          note: 'Two tools for making a new string out of an old one. A **slice** copies part of a string: `s[1:]` is everything from index 1 to the end, so `"hello"[1:]` is `"ello"`. And `+` glues two strings into a new one: `"J" + "ello"` is `"Jello"`.',
          brokenCode: `def capitalize_first(s):
    if not s:
        return s
    s[0] = s[0].upper()
    return s`,
          solution: `def capitalize_first(s):
    if not s:
        return s
    return s[0].upper() + s[1:]`,
          tests: [t.eq('capitalize_first("hello")', '"Hello"'), t.eq('capitalize_first("")', '""'), t.hidden('capitalize_first("a")', '"A"'), t.hidden('capitalize_first("Up")', '"Up"')],
          hints: ['Read the error message: what kind of object refuses item assignment?', 'Build a new string from the new first character plus the rest: `s[1:]`.'],
          explanation: 'Strings are immutable, so "editing" one means building a new string. `s[0].upper() + s[1:]` is the usual shape.',
          signature: 'debug:string-immutable',
          minutes: 4,
        }),
        write({
          id: 'd3-str-first-digit',
          title: 'Index of the first digit',
          skills: ['string_iterate', 'enumerate', 'string_methods', 'early_return'],
          prompt: '`s` is a string that may mix letters and digits. Write `first_digit_index(s)` that returns the index of the first digit character in `s`, or `-1` if there is none (including when `s` is empty). `ch.isdigit()` is `True` when the character `ch` is one of `0`-`9`.\n\n`first_digit_index("abc4d5")` → `3`',
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
        write({
          id: 'd3-str-mirror-pairs',
          title: 'Mirror index pairs',
          skills: ['string_index', 'range', 'len', 'list_append', 'list_create'],
          difficulty: 3,
          prompt: "`s` is a string. The **mirror** of a position is the one the same distance from the other end: index 0 mirrors the last index, index 1 mirrors the one before it, and so on.\n\nWrite `mirror_pairs(s)` returning a list of tuples `(s[i], s[mirror])`, one for each position `i` in the first half of `s`, in order. The middle character of an odd-length string is not paired, so an empty or one-character string gives `[]`.\n\n`mirror_pairs('abcd')` → `[('a', 'd'), ('b', 'c')]`",
          starterCode: `def mirror_pairs(s):
    pass`,
          solution: `def mirror_pairs(s):
    pairs = []
    for i in range(len(s) // 2):
        j = len(s) - 1 - i
        pairs.append((s[i], s[j]))
    return pairs`,
          tests: [t.eq('mirror_pairs("abcd")', '[("a", "d"), ("b", "c")]'), t.eq('mirror_pairs("abc")', '[("a", "c")]'), t.hidden('mirror_pairs("")', '[]'), t.hidden('mirror_pairs("x")', '[]')],
          hints: ['Index 0 mirrors the last index, index 1 the one before it.', 'Loop `i` over `range(len(s) // 2)`.', 'The mirror of i is `len(s) - 1 - i` (or `-1 - i`).'],
          explanation: 'A palindrome is a string that reads the same backwards, like "level". Every palindrome check is really this: compare position i with position `len(s) - 1 - i`. The two-pointer technique later today just keeps both indexes in variables.',
          signature: 'string:mirror-index',
          minutes: 6,
          important: true,
        }),
      ],
    },

    // ───────────────────────────────────────────── Slicing
    {
      id: 'd3-slicing',
      title: 'Slicing',
      summary: 's[a:b] excludes b; [::-1] reverses; slices never raise.',
      exercises: [
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
          note: '`s[a:b]` is a **slice**: a new string holding the characters from index `a` up to, but **not including**, index `b` (so it has `b - a` characters). Leave out `a` to start at the beginning; leave out `b` to run to the end. An end past the string is just cut off at the end, never an error. `s[::-1]` is the whole string backwards.',
          explanation: '`s[:3]` and `s[3:]` split the string at index 3 with no overlap. `s[-3:]` is the last three characters. `[::-1]` walks backwards with step -1.',
          signature: 'trace:slice-basic',
          minutes: 2,
        }),
        write({
          id: 'd3-slice-is-mirror',
          title: 'Palindrome in one line',
          skills: ['slicing', 'functions'],
          prompt: 'A **palindrome** is a string that reads the same backwards as forwards, like `"racecar"`. `s` is a string. Write `is_mirror(s)` in a single `return` line: `True` if `s` is a palindrome, otherwise `False`. Characters are compared exactly (`"Aa"` is not one), and the empty string counts as one.',
          starterCode: `def is_mirror(s):
    pass`,
          solution: `def is_mirror(s):
    return s == s[::-1]`,
          tests: [t.eq('is_mirror("racecar")', 'True'), t.eq('is_mirror("ab")', 'False'), t.hidden('is_mirror("")', 'True'), t.hidden('is_mirror("Aa")', 'False')],
          hints: ['Which slice gives you the whole string backwards?', 'Compare `s` with that reversed copy using `==`.'],
          explanation: 'Simple and correct, but it builds a reversed copy: O(n) extra space. The two-pointer version later today uses O(1).',
          signature: 'slice:reverse-compare',
          minutes: 3,
          important: true,
        }),
        write({
          id: 'd3-slice-split-halves',
          title: 'Split into halves',
          skills: ['slicing', 'len', 'tuples'],
          prompt: '`s` is a string. Write `split_halves(s)` returning a tuple `(front, back)` of two strings: the first half and the last half of `s`, each `len(s) // 2` characters long. For odd lengths the middle character belongs to neither. A string too short to split (empty or one character) gives `("", "")`.\n\n`split_halves("abcde")` → `("ab", "de")`',
          note: '`s[a:b]` is a **slice**: the characters from index `a` up to, but **not including**, index `b`. `"abcde"[1:3]` is `"bc"`. `s[:n]` is the first `n` characters; `s[n:]` is everything from index `n` on.',
          starterCode: `def split_halves(s):
    pass`,
          solution: `def split_halves(s):
    half = len(s) // 2
    front = s[:half]
    back = s[len(s) - half:]
    return (front, back)`,
          tests: [t.eq('split_halves("abcd")', '("ab", "cd")'), t.eq('split_halves("abcde")', '("ab", "de")'), t.hidden('split_halves("x")', '("", "")'), t.hidden('split_halves("")', '("", "")')],
          hints: ['Both halves have length `len(s) // 2`.', 'The back half starts at `len(s) - half`.', 'Careful: `s[-half:]` is the whole string when `half` is 0.'],
          explanation: '`s[-0:]` is `s[0:]`, the whole string, so a negative start breaks for tiny inputs. Computing the start as `len(s) - half` is always right.',
          signature: 'slice:halves',
          minutes: 5,
        }),
        debug({
          id: 'd3-slice-debug-reverse',
          title: 'Find the palindrome words',
          skills: ['slicing', 'list_append'],
          prompt: '`words` is a list of strings. `palindrome_words(words)` should return a new list holding, in their original order, only the words that read the same backwards as forwards (palindromes, like `"noon"`). A one-letter word counts. Make the tests pass.',
          brokenCode: `def palindrome_words(words):
    out = []
    for w in words:
        if w == w[-1:]:
            out.append(w)
    return out`,
          solution: `def palindrome_words(words):
    out = []
    for w in words:
        if w == w[::-1]:
            out.append(w)
    return out`,
          tests: [t.eq('palindrome_words(["level", "abc", "noon", "a"])', '["level", "noon", "a"]'), t.eq('palindrome_words([])', '[]'), t.hidden('palindrome_words(["ab", "aa"])', '["aa"]')],
          hints: ['Print `"level"[-1:]`. Is that the reversed word?', 'Reversing needs a step of -1.'],
          explanation: '`w[-1:]` is just the last character; `w[::-1]` is the whole word backwards. Single-letter words hide the bug because both are equal.',
          signature: 'debug:slice-reverse',
          minutes: 4,
        }),
        write({
          id: 'd3-slice-rotate',
          title: 'Rotate left',
          skills: ['slicing', 'len', 'edge_cases'],
          difficulty: 3,
          prompt: '`s` is a string and `k` is a whole number, 0 or more. Write `rotate_left(s, k)` returning a new string with the first `k` characters of `s` moved to the end. `k` may be larger than `len(s)`: keep rotating, so on a 5-character string `k = 7` ends up the same as `k = 2`. An empty string gives `""` for any `k`.\n\n`rotate_left("abcde", 2)` → `"cdeab"`',
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
          minutes: 6,
        }),
        debug({
          id: 'd3-slice-debug-middle',
          title: 'Middle three characters',
          skills: ['slicing', 'len'],
          prompt: '`s` is a string that always has an odd length of at least 3. `middle_three(s)` should return the three characters in the middle of `s`, as a string: `"abcde"` → `"bcd"`. Make the tests pass.',
          brokenCode: `def middle_three(s):
    mid = len(s) // 2
    return s[mid - 1:mid + 1]`,
          solution: `def middle_three(s):
    mid = len(s) // 2
    return s[mid - 1:mid + 2]`,
          tests: [t.eq('middle_three("abcde")', '"bcd"'), t.eq('middle_three("xyz")', '"xyz"'), t.hidden('middle_three("1234567")', '"345"')],
          hints: ['How many characters does `s[a:b]` hold?', 'The stop index is excluded.'],
          explanation: '`s[a:b]` has `b - a` characters. Three characters starting at `mid - 1` need a stop of `mid + 2`.',
          signature: 'debug:slice-end-exclusive',
          minutes: 3,
        }),
        code({
          id: 'd3-slice-break-last-k',
          title: 'Break last_k',
          skills: ['slicing', 'edge_cases'],
          style: 'write-test',
          prompt: 'A teammate wrote:\n\n```python\ndef last_k(s, k):\n    return s[-k:]\n```\n\nIt is meant to return the last `k` characters of the string `s`, and it is right for most inputs. Write `breaking_input()`, which takes nothing and returns a tuple `(s, k)`: a string and a whole number `k >= 0` for which `last_k(s, k)` is **not** the last `k` characters of `s`.',
          starterCode: `def breaking_input():
    pass`,
          solution: `def breaking_input():
    return ("abc", 0)`,
          tests: [
            t.check(
              'your input breaks last_k',
              'def _last_k(s, k):\n    return s[-k:]\ns, k = breaking_input()\nassert k >= 0, "k must be 0 or more"\nwant = s[len(s) - k:] if k <= len(s) else s\nassert _last_k(s, k) != want, "last_k is correct on this input"',
            ),
          ],
          hints: ['Try the smallest possible k.', 'What is `-0`?'],
          explanation: '`-0` is `0`, so `s[-0:]` is the whole string instead of `""`. Edge cases at 0 are worth a test every time you slice with a negative index.',
          signature: 'write-test:slice-negative-zero',
          minutes: 3,
        }),
      ],
    },

    // ───────────────────────────────────────────── String methods
    {
      id: 'd3-methods',
      title: 'String methods',
      summary: '.lower(), .isalnum(), .split() and .join() to clean and rebuild text.',
      exercises: [
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
          note: 'A **method** is a function that belongs to a value and is called with a dot: `s.lower()`. String methods hand back a new value; `s` itself never changes. `.lower()` gives a lowercase copy, `.split()` a list of the words, and `sep.join(parts)` glues a list of strings together with `sep` between them. Three yes/no tests work on a single character: `.isalnum()` is True for letters and digits, `.isalpha()` letters only, `.isdigit()` digits only.',
          explanation: 'String methods return new strings; `s` itself is unchanged. `.split()` splits on whitespace and keeps punctuation attached. `sep.join(list)` puts sep between items.',
          signature: 'trace:string-methods',
          minutes: 2,
        }),
        write({
          id: 'd3-meth-keep-letters',
          title: 'Keep only letters',
          skills: ['string_methods', 'list_append', 'list_create'],
          prompt: '`s` is a string that may hold letters, digits, spaces and punctuation. Write `keep_letters(s)` that returns a new string holding only the letters of `s`, in order, with their case unchanged. If there are no letters, return `""`. Build a list of the characters you keep and join it at the end.\n\n`keep_letters("a1b2c3")` → `"abc"`',
          starterCode: `def keep_letters(s):
    pass`,
          solution: `def keep_letters(s):
    letters = []
    for ch in s:
        if ch.isalpha():
            letters.append(ch)
    return "".join(letters)`,
          tests: [t.eq('keep_letters("a1b2c3")', '"abc"'), t.eq('keep_letters("123")', '""'), t.hidden('keep_letters("")', '""'), t.hidden('keep_letters("Hi, you!")', '"Hiyou"')],
          hints: ['`.isalpha()` tests for a letter.', 'Append kept characters, then `"".join(letters)`.'],
          note: 'A string cannot be changed, so you build a new one. The usual way: append the pieces to a list, then `"".join(parts)` glues them into one string with nothing between them. `"".join(["a", "b"])` is `"ab"`.',
          signature: 'string:filter-join',
          minutes: 4,
        }),
        write({
          id: 'd3-meth-clean',
          title: 'Clean a phrase',
          skills: ['string_methods', 'string_iterate', 'list_append'],
          prompt: '`s` is a string that may hold letters, digits, spaces and punctuation. Write `clean(s)` returning a new string: the letters and digits of `s`, in order, all lowercased, with everything else (spaces, punctuation) removed. If nothing is left, return `""`.\n\n`clean("A man, a plan")` → `"amanaplan"`',
          note: 'String **methods** are called with a dot and return a new value. `ch.isalnum()` is `True` when the character `ch` is a letter or a digit; `ch.lower()` is its lowercase version (a digit stays as it is). `"".join(parts)` glues a list of strings into one string.',
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
          minutes: 5,
          important: true,
        }),
        debug({
          id: 'd3-meth-debug-isalnum',
          title: 'Count letters and digits',
          skills: ['string_methods', 'accumulator'],
          prompt: '`s` is a string. `count_alnum(s)` should return how many of its characters are letters or digits: `"a1, b2!"` → `4`. An empty string gives `0`. Make the tests pass.',
          brokenCode: `def count_alnum(s):
    count = 0
    for ch in s:
        if ch.isalnum:
            count += 1
    return count`,
          solution: `def count_alnum(s):
    count = 0
    for ch in s:
        if ch.isalnum():
            count += 1
    return count`,
          tests: [t.eq('count_alnum("a1, b2!")', '4'), t.eq('count_alnum("")', '0'), t.hidden('count_alnum("...")', '0')],
          hints: ['Print `"!".isalnum` in the console. What is it?', 'A method has to be called to run.'],
          explanation: '`ch.isalnum` without parentheses is the method object itself, which is always truthy, so every character counted.',
          signature: 'debug:method-not-called',
          minutes: 3,
        }),
        write({
          id: 'd3-meth-reverse-words',
          title: 'Reverse word order',
          skills: ['string_methods', 'slicing'],
          prompt: '`s` is a string of words separated by one or more spaces. Write `reverse_words(s)` returning one string: the words of `s` in reverse order, separated by single spaces. Extra spaces in the input disappear, and an empty string gives `""`.\n\n`reverse_words("  the sky  is blue ")` → `"blue is sky the"`',
          starterCode: `def reverse_words(s):
    pass`,
          solution: `def reverse_words(s):
    words = s.split()
    return " ".join(words[::-1])`,
          tests: [t.eq('reverse_words("the sky is blue")', '"blue is sky the"'), t.eq('reverse_words("  the sky  is blue ")', '"blue is sky the"'), t.hidden('reverse_words("")', '""'), t.hidden('reverse_words("one")', '"one"')],
          hints: ['Split into a list of words first.', 'Reverse the list with a slice, then join with a space.'],
          signature: 'string:split-reverse-join',
          minutes: 3,
        }),
        write({
          id: 'd3-meth-word-counts',
          title: 'Word frequency',
          skills: ['string_methods', 'frequency_map', 'dict_get'],
          stage: 'combine',
          repType: 'combine',
          prompt: '`s` is a string of words separated by spaces. Write `word_counts(s)` returning a dict from each word, **lowercased**, to how many times it appears. Case is ignored, so `"The"` and `"the"` are the same word. An empty string gives `{}`.\n\n`word_counts("The cat the hat")` → `{"the": 2, "cat": 1, "hat": 1}`',
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
        write({
          id: 'd3-meth-clean-mirror',
          title: 'Clean, then compare',
          skills: ['string_methods', 'slicing'],
          stage: 'combine',
          repType: 'combine',
          prompt: '`s` is a string that may hold letters, digits, spaces and punctuation. Write `is_clean_mirror(s)`. Lowercase `s` and drop everything that isn\'t a letter or digit. Return `True` if what is left reads the same backwards, otherwise `False`. If nothing is left, return `True`. Build the cleaned string and compare it with its reverse.\n\n`is_clean_mirror("Step on no pets!")` → `True` (cleaned, it is "steponnopets")\n`is_clean_mirror(".,")` → `True` (nothing is left)',
          starterCode: `def is_clean_mirror(s):
    pass`,
          solution: `def is_clean_mirror(s):
    cleaned = "".join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]`,
          tests: [t.eq('is_clean_mirror("Step on no pets!")', 'True'), t.eq('is_clean_mirror("Hello")', 'False'), t.hidden('is_clean_mirror("")', 'True'), t.hidden('is_clean_mirror("1a2")', 'False'), t.hidden('is_clean_mirror(".,")', 'True')],
          hints: ['Two steps: clean, then check.', 'Cleaning: keep each character that passes `.isalnum()`, lowercased, and join them into one string.', 'Checking: `cleaned == cleaned[::-1]`.'],
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
          note: 'A **pointer** is just a variable that holds an index: it marks a position. **Two pointers** means keeping two of them, here `left` at the first index and `right` at the last, and stepping them toward each other. `while left < right:` repeats its indented body for as long as that test is true, checking before every pass. Each pass must move at least one pointer, or the loop never ends.',
          explanation: 'Each step moves both pointers one place inward. With 7 characters they meet at the middle index 3, which is never compared.',
          signature: 'trace:two-pointer-inward',
          minutes: 2,
        }),
        write({
          id: 'd3-tp-palindrome-plain',
          title: 'Palindrome with pointers',
          skills: ['two_pointer', 'while_loop', 'string_index', 'early_return'],
          style: 'translate',
          prompt: 'This palindrome check uses a `for` loop and a computed mirror index:\n\n```python\ndef is_pal(s):\n    for i in range(len(s) // 2):\n        if s[i] != s[len(s) - 1 - i]:\n            return False\n    return True\n```\n\n`s` is a string; the function returns `True` if it reads the same backwards (a palindrome), comparing characters exactly. An empty or one-character string is one.\n\nRewrite `is_pal(s)` with two named pointers (index variables), `left` and `right`, and a `while` loop. No slicing, no reversed copy.',
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
          hints: ['`i` becomes `left`; `len(s) - 1 - i` becomes `right`.', '`while left < right:` compare, return False on mismatch.', 'Move both pointers inward after a match.'],
          signature: 'two-pointer:palindrome',
          minutes: 5,
          important: true,
        }),
        debug({
          id: 'd3-tp-debug-step',
          title: 'Fix the pointer walk',
          skills: ['two_pointer', 'while_loop'],
          prompt: '`s` is a string. `is_pal(s)` should return `True` when `s` reads the same in both directions (a palindrome, like `"abba"`), comparing characters exactly, and `False` otherwise. An empty string is a palindrome. It uses two pointers. Make the tests pass.',
          note: 'A **pointer** is just a variable that holds an index: it marks a position. **Two pointers** means keeping two of them: `left` starts at the first index, `right` at the last, and they step toward each other. `while left < right:` repeats its indented body for as long as that test is true, checking before every pass.',
          brokenCode: `def is_pal(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
    right -= 1
    return True`,
          solution: `def is_pal(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True`,
          tests: [t.eq('is_pal("abba")', 'True'), t.eq('is_pal("abca")', 'False'), t.hidden('is_pal("racecar")', 'True'), t.hidden('is_pal("")', 'True')],
          hints: ['Trace "abba" by hand: which characters get compared on the second pass?', 'Indentation decides what is inside the loop.'],
          explanation: 'Dedented one level, `right -= 1` runs once after the loop instead of every iteration, so `left` walks toward a fixed `right`.',
          signature: 'debug:pointer-step-placement',
          minutes: 4,
        }),
        write({
          id: 'd3-tp-swap-reverse',
          title: 'Reverse a list in place',
          skills: ['two_pointer', 'list_index', 'tuples'],
          prompt: '`nums` is a list (it may be empty). Write `reverse_in_place(nums)`. Reverse the list **in place**, then return it. In place means you change the list you were given instead of building a new one. Afterwards the caller’s own list is reversed. Swap the two end items, then move inward from both ends. Don’t use slicing or `.reverse()`.\n\n`reverse_in_place([1, 2, 3])` → `[3, 2, 1]`\n`reverse_in_place([])` → `[]`',
          note: 'Lists, unlike strings, can be changed: `nums[i] = x` overwrites one slot. Working **in place** means doing all the work with assignments like that on the original list. Python swaps two slots in one line: `a[i], a[j] = a[j], a[i]`.',
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
          minutes: 5,
        }),
        code({
          id: 'd3-tp-mismatches',
          title: 'Changes to make a palindrome',
          skills: ['two_pointer', 'while_loop', 'accumulator'],
          style: 'modify',
          prompt: '`s` is a string. The starter code is the two-pointer palindrome check under a new name. It returns `True` or `False`. Change it so `changes_needed(s)` returns a **number** instead: how many characters you would have to change to make `s` a palindrome. Each mirror pair (`s[left]` and `s[right]`) that differs needs exactly one change. A palindrome, including the empty string, needs `0`.\n\n`changes_needed("abca")` → `1` (only b and c differ)\n`changes_needed("abcd")` → `2`',
          starterCode: `def changes_needed(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True`,
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
          hints: ['Same pointer walk; a mismatch no longer ends the loop.', 'Add a counter, bump it on a mismatch, return it at the end.'],
          signature: 'two-pointer:count-mismatch',
          minutes: 4,
        }),
        write({
          id: 'd3-tp-reverse-of',
          title: 'Is one the reverse of the other?',
          skills: ['two_pointer', 'while_loop', 'len', 'early_return'],
          difficulty: 3,
          prompt: '`a` and `b` are strings. Write `is_reverse_of(a, b)`. Return `True` if `a` is exactly `b` backwards, otherwise `False`. Strings of different lengths are never reverses. Two empty strings are. Walk one pointer forward through `a` and another backward through `b`. No slicing.\n\n`is_reverse_of("abc", "cba")` → `True`\n`is_reverse_of("ab", "a")` → `False` (different lengths)',
          starterCode: `def is_reverse_of(a, b):
    pass`,
          solution: `def is_reverse_of(a, b):
    if len(a) != len(b):
        return False
    i, j = 0, len(b) - 1
    while i < len(a):
        if a[i] != b[j]:
            return False
        i += 1
        j -= 1
    return True`,
          tests: [t.eq('is_reverse_of("abc", "cba")', 'True'), t.eq('is_reverse_of("abc", "abc")', 'False'), t.hidden('is_reverse_of("", "")', 'True'), t.hidden('is_reverse_of("ab", "a")', 'False'), t.hidden('is_reverse_of("aa", "aa")', 'True')],
          hints: ['Different lengths can never match: check that first.', '`i` starts at 0 in `a`, `j` starts at the last index of `b`.', 'Compare, then `i += 1` and `j -= 1`.'],
          explanation: 'The two pointers live in different strings but move in lockstep, one forward and one backward.',
          signature: 'two-pointer:cross-reverse',
          minutes: 6,
        }),
      ],
    },

    // ───────────────────────────────────────────── Move one pointer
    {
      id: 'd3-pointer-updates',
      title: 'Move one pointer',
      summary: 'On a sorted array, a comparison decides which single pointer moves.',
      exercises: [
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
          note: 'So far both pointers moved together. Here a comparison decides which **one** moves. `nums` is sorted smallest to largest, so `left` sits on the smallest value still in play and `right` on the largest. Sum too small → `left += 1` (a bigger small number); too big → `right -= 1` (a smaller big number); equal → found. `break` leaves the loop at once. One pointer moves per step, so it is O(n).',
          explanation: 'Each sum is too small, so only left moves until 4 + 9 hits 13.',
          signature: 'trace:sorted-pair-sum',
          minutes: 2.5,
        }),
        write({
          id: 'd3-pu-has-pair',
          title: 'Sorted pair search',
          skills: ['pointer_update', 'two_pointer', 'conditionals'],
          prompt: '`nums` is a list of numbers sorted from smallest to largest (it may be empty). `target` is a number. Write `has_pair(nums, target)`. Return `True` if the values at two different positions add up to `target`, otherwise `False`. A list with fewer than two numbers has no pair. Use two pointers, one starting at each end. Don’t use a set.\n\n`has_pair([1, 2, 4, 7], 9)` → `True` (2 + 7)\n`has_pair([5], 10)` → `False` (only one number)',
          starterCode: `def has_pair(nums, target):
    pass`,
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
          tests: [t.eq('has_pair([1, 2, 4, 7], 9)', 'True'), t.eq('has_pair([1, 2, 4, 7], 10)', 'False'), t.hidden('has_pair([], 0)', 'False'), t.hidden('has_pair([-3, 0, 3], 0)', 'True'), t.hidden('has_pair([5], 10)', 'False')],
          hints: ['Start at the smallest and the largest.', 'Too small: which pointer makes the sum larger?', 'Equal → True; smaller → `left += 1`; bigger → `right -= 1`.'],
          signature: 'sorted-pair:exists',
          minutes: 6,
          important: true,
        }),
        debug({
          id: 'd3-pu-debug-swapped',
          title: 'Fix the pair finder',
          skills: ['pointer_update', 'two_pointer'],
          prompt: '`nums` is a list of numbers sorted from smallest to largest, and `target` is a number. `pair_values(nums, target)` should find two values, at different positions, that add up to `target`. It returns them as a tuple `(small, big)`. If no pair adds up to `target`, it returns `None`. Make the tests pass.\n\n`pair_values([1, 2, 4, 7], 9)` → `(2, 7)`',
          brokenCode: `def pair_values(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return (nums[left], nums[right])
        if total < target:
            right -= 1
        else:
            left += 1
    return None`,
          solution: `def pair_values(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return (nums[left], nums[right])
        if total < target:
            left += 1
        else:
            right -= 1
    return None`,
          tests: [t.eq('pair_values([1, 2, 4, 7], 9)', '(2, 7)'), t.eq('pair_values([1, 3, 5], 100)', 'None'), t.hidden('pair_values([-3, 0, 3, 4], 4)', '(0, 4)')],
          hints: ['Trace the first test: 1 + 7 is too small. What should grow?', 'Moving `right` inward can only shrink the sum.'],
          explanation: 'When the sum is too small, only advancing `left` can increase it. The swapped moves walk away from the answer.',
          signature: 'debug:pointer-direction',
          minutes: 4,
        }),
        write({
          id: 'd3-pu-count-pairs',
          title: 'Count pairs with a sum',
          skills: ['pointer_update', 'two_pointer', 'accumulator'],
          difficulty: 3,
          transfer: true,
          prompt: '`nums` is a list of numbers sorted from smallest to largest. **No value appears twice.** `target` is a number. Write `count_pairs(nums, target)`. Return how many pairs of values, from two different positions, add up to `target`. Each pair counts once. If there are none, return `0`. That includes the empty list.\n\n`count_pairs([1, 2, 3, 4, 5, 6], 7)` → `3` (1 + 6, 2 + 5, 3 + 4)\n`count_pairs([], 0)` → `0`',
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
          hints: [
            'The list is sorted. Add the smallest and the largest value: what does it tell you if that sum is too small, or too big?',
            'Two pointers, one at each end: the same scan as the sorted pair search, but do not stop at the first match.',
            'After a match, both values are used up: move both pointers (values are distinct).',
          ],
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
          style: 'finish',
          prompt: '`s` is a string that may contain spaces. Finish `is_pal_ignoring_spaces(s)` using two pointers. Return `True` if `s` reads the same backwards once you skip the spaces, otherwise `False`. Every other character must match exactly. Case matters. An empty or all-space string returns `True`. Don’t build a new string.\n\n`is_pal_ignoring_spaces("taco cat")` → `True`\n`is_pal_ignoring_spaces("ab  c")` → `False`',
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
        write({
          id: 'd3-pu-count-below',
          title: 'Count pairs below a target',
          skills: ['pointer_update', 'two_pointer', 'accumulator'],
          difficulty: 4,
          prompt: '`nums` is a list of numbers sorted from smallest to largest. Values may repeat. `target` is a number. Write `count_below(nums, target)`. Count the pairs of positions `i < j` where `nums[i] + nums[j]` is strictly less than `target`, and return that count. If there are none, or fewer than two numbers, return `0`. Aim for O(n): one two-pointer scan, not a loop inside a loop.\n\n`count_below([1, 2, 3, 4], 6)` → `4` (1 + 2, 1 + 3, 1 + 4, 2 + 3)\n`count_below([5, 6], 3)` → `0` (5 + 6 is too big)',
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
          minutes: 9,
        }),
      ],
    },

    // ───────────────────────────────────────────── Pointer patterns
    {
      id: 'd3-pointer-patterns',
      title: 'Pointer patterns',
      summary: 'Pointers in the same direction and across two sequences.',
      exercises: [
        write({
          id: 'd3-pp-subsequence',
          title: 'Is it a subsequence?',
          skills: ['two_pointer', 'pointer_update', 'while_loop'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`small` and `big` are strings. `small` is a **subsequence** of `big` if you can get it by deleting zero or more characters of `big` without reordering the rest: its characters appear in `big` in the same order, not necessarily next to each other. Write `is_subsequence(small, big)` returning `True` or `False`. The empty string is a subsequence of anything.\n\n`is_subsequence("ace", "abcde")` → `True`, `is_subsequence("aec", "abcde")` → `False`',
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
          minutes: 6,
        }),
        write({
          id: 'd3-pp-merge',
          title: 'Merge two sorted lists',
          skills: ['two_pointer', 'pointer_update', 'list_append', 'while_loop', 'list_create'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`a` and `b` are lists of numbers, each already sorted from smallest to largest; either may be empty. Write `merge_sorted(a, b)` that returns one new sorted list containing everything from both (repeated values are all kept). Do not call `sorted`.\n\n`merge_sorted([1, 4, 7], [2, 3, 9])` → `[1, 2, 3, 4, 7, 9]`',
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
          minutes: 8,
        }),
        debug({
          id: 'd3-pp-debug-common',
          title: 'Fix the common values',
          skills: ['two_pointer', 'pointer_update'],
          prompt: '`common(a, b)` takes two sorted lists and should return the values found in both, in order. Each match uses up one item from each list, so `common([2, 2], [2])` is `[2]`. Make the tests pass.',
          brokenCode: `def common(a, b):
    i, j = 0, 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            out.append(a[i])
            i += 1
        elif a[i] < b[j]:
            i += 1
        else:
            j += 1
    return out`,
          solution: `def common(a, b):
    i, j = 0, 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            out.append(a[i])
            i += 1
            j += 1
        elif a[i] < b[j]:
            i += 1
        else:
            j += 1
    return out`,
          tests: [t.eq('common([1, 2, 2, 3], [2, 3])', '[2, 3]'), t.eq('common([1, 5], [2, 6])', '[]'), t.hidden('common([2, 2], [2, 2])', '[2, 2]'), t.hidden('common([], [1])', '[]')],
          hints: ['Trace the first test: how many times is `b[0]` matched?', 'A match consumes an item from each list.'],
          explanation: 'After a match both items are used, so both pointers must advance. Moving only `i` lets `b[j]` match again.',
          signature: 'debug:pointer-both-advance',
          minutes: 4,
        }),
        write({
          id: 'd3-pp-dedupe',
          title: 'Dedupe a sorted list in place',
          skills: ['two_pointer', 'pointer_update', 'list_index'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`nums` is a list of numbers sorted from smallest to largest, so equal values sit next to each other. Write `dedupe_sorted(nums)`. Rearrange the list **in place** (change `nums` itself, do not build a new list) so that its first `k` positions hold each distinct value once, in order, and return `k`, the number of distinct values. Whatever is left after those `k` positions does not matter. An empty list returns `0`.\n\n`[1, 1, 2, 3, 3]` → returns `3`, list starts `[1, 2, 3, ...]`',
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
      ],
    },

    // ───────────────────────────────────────────── Running state
    {
      id: 'd3-running-state',
      title: 'Running min/max',
      summary: 'Carry the best-so-far or min-so-far through one scan.',
      exercises: [
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
          note: "**Running state** is a variable you update on every item so that it always summarises everything seen so far. Here `lowest` is the smallest price **so far** (a best-so-far). Start it from the first item, or from `float('inf')` (bigger than any number) for a minimum and `float('-inf')` (smaller than any number) for a maximum. Never start from a made-up number like 0.",
          explanation: 'The running minimum only ever goes down. Each entry is the smallest price seen up to and including that day.',
          signature: 'trace:running-min',
          minutes: 2,
        }),
        write({
          id: 'd3-rs-largest',
          title: 'Largest by hand',
          skills: ['state_tracking', 'accumulator', 'conditionals'],
          prompt: '`nums` is a list of numbers with at least one item. Write `largest(nums)`. Return the biggest value in it without calling `max()`. Keep a best-so-far variable and update it as you loop. It must work when every value is negative.\n\n`largest([3, 9, 2])` → `9`\n`largest([-5, -2, -9])` → `-2` (all negative)',
          starterCode: `def largest(nums):
    pass`,
          solution: `def largest(nums):
    best = nums[0]
    for x in nums:
        if x > best:
            best = x
    return best`,
          tests: [t.eq('largest([3, 9, 2])', '9'), t.eq('largest([-5, -2, -9])', '-2'), t.hidden('largest([4])', '4')],
          hints: ['Start `best` at a real value from the list.', 'Replace it whenever you see something bigger.'],
          signature: 'running:max',
          minutes: 4,
        }),
        debug({
          id: 'd3-rs-debug-init',
          title: 'Fix min and max',
          skills: ['state_tracking', 'tuples'],
          prompt: '`nums` is a list of numbers with at least one item. `min_and_max(nums)` should return the smallest and largest values as a tuple `(smallest, largest)`. It finds both in one pass. Make the tests pass.\n\n`min_and_max([3, 9, 2])` → `(2, 9)`',
          brokenCode: `def min_and_max(nums):
    lo = 0
    hi = 0
    for x in nums:
        if x < lo:
            lo = x
        if x > hi:
            hi = x
    return (lo, hi)`,
          solution: `def min_and_max(nums):
    lo = nums[0]
    hi = nums[0]
    for x in nums:
        if x < lo:
            lo = x
        if x > hi:
            hi = x
    return (lo, hi)`,
          tests: [t.eq('min_and_max([3, 9, 2])', '(2, 9)'), t.eq('min_and_max([-5, -2])', '(-5, -2)'), t.hidden('min_and_max([0])', '(0, 0)'), t.hidden('min_and_max([7, 7])', '(7, 7)')],
          hints: ['Is 0 ever actually in the first test’s list?', 'Start from a value that is really in the list.'],
          explanation: 'A made-up start like 0 wins whenever every real value is on one side of it. Starting from `nums[0]` is always a real candidate.',
          signature: 'debug:running-init',
          minutes: 4,
        }),
        write({
          id: 'd3-rs-prefix-mins',
          title: 'Prefix minimums',
          skills: ['state_tracking', 'list_append', 'list_create'],
          prompt: '`nums` is a list of numbers (it may be empty). Write `prefix_mins(nums)`. Return a new list of the same length. Entry `i` is the smallest value so far: the smallest of `nums[0]` through `nums[i]`, including `nums[i]`. An empty list gives `[]`.\n\n`prefix_mins([4, 6, 2, 5, 1])` → `[4, 4, 2, 2, 1]`\n`prefix_mins([])` → `[]`',
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
        write({
          id: 'd3-rs-records',
          title: 'Count new records',
          skills: ['state_tracking', 'conditionals', 'accumulator'],
          prompt: '`scores` is a list of numbers in the order they happened. It may be empty, and scores can be negative. A score is a **record** if it is strictly higher than every score before it. The first score always counts. Write `count_records(scores)`. Return how many records there are. An empty list gives `0`.\n\n`count_records([3, 1, 4, 1, 5])` → `3` (3, 4 and 5)\n`count_records([2, 2, 2])` → `1` (a tie isn’t a record)',
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
          minutes: 5,
        }),
        write({
          id: 'd3-rs-biggest-drop',
          title: 'Biggest fall from a peak',
          skills: ['state_tracking', 'list_iterate'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          prompt: '`values` is a list of numbers in time order (it may be empty). Write `biggest_drop(values)`. Return the largest fall from an earlier value to a later one: the largest `values[i] - values[j]` with `i < j`. If the values never fall, return `0`. Fewer than two values also gives `0`. One pass.\n\n`biggest_drop([5, 9, 3, 6, 1])` → `8` (from 9 down to 1)\n`biggest_drop([1, 2, 3])` → `0` (it never falls)',
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
          explanation: 'Two pieces of running state: the best peak seen so far, and the best answer so far. The stock capstone mirrors this with a minimum.',
          signature: 'running:max-so-far-gap',
          minutes: 6,
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
            '`s` is a phrase. Only its letters and digits count. Upper and lower case are treated the same. Spaces, punctuation and symbols are ignored completely. Return `True` if the remaining characters read the same from both ends, otherwise `False`.\n\nAim for O(1) extra space. Walk two indexes over the original string instead of building a cleaned copy.\n\n`is_palindrome("race a car")` → `False` ("raceacar" backwards is "racaecar")\n`is_palindrome(" ")` → `True` (nothing is left to compare)',
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
        debug({
          id: 'd3-vp-debug-case',
          title: 'Fix the mirror check: case',
          skills: ['string_methods', 'two_pointer'],
          prompt: '`is_palindrome(s)` should ignore case and skip every character that isn’t a letter or digit. It returns `True` if what is left reads the same both ways, otherwise `False`. Make the tests pass.',
          brokenCode: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True`,
          solution: `def is_palindrome(s):
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
          tests: [t.eq('is_palindrome("Was it a car or a cat I saw?")', 'True'), t.eq('is_palindrome("race a car")', 'False'), t.hidden('is_palindrome("Ab1bA")', 'True'), t.hidden('is_palindrome("0P")', 'False')],
          hints: ['Which two characters are compared first in the failing test?', '"W" and "w" are different strings.'],
          explanation: 'Comparing raw characters treats "W" and "w" as different. Lowercase both sides at the comparison.',
          signature: 'debug:compare-before-lower',
          minutes: 4,
        }),
        debug({
          id: 'd3-vp-debug-guard',
          title: 'Fix the mirror check: junk',
          skills: ['two_pointer', 'pointer_update', 'while_loop'],
          prompt: '`is_palindrome(s)` should ignore case and skip every character that isn’t a letter or digit. A string with nothing left to compare is a palindrome. Make the tests pass.',
          brokenCode: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        while not s[left].isalnum():
            left += 1
        while not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True`,
          solution: `def is_palindrome(s):
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
          tests: [t.eq('is_palindrome(".,")', 'True'), t.eq('is_palindrome("No lemon, no melon")', 'True'), t.hidden('is_palindrome("!a!")', 'True'), t.hidden('is_palindrome("ab")', 'False')],
          hints: ['What index does `left` reach on ".,"?', 'The inner loops need the same boundary as the outer loop.'],
          explanation: 'On a string of junk the inner loop walks `left` off the end and raises IndexError. Adding `left < right` to the inner conditions stops it at the boundary.',
          signature: 'debug:inner-loop-guard',
          minutes: 5,
        }),
        write({
          id: 'd3-vp-one-deletion',
          title: 'Palindrome after one deletion',
          skills: ['two_pointer', 'pointer_update', 'functions', 'slicing'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          transfer: true,
          prompt: 'A palindrome reads the same backwards as forwards, like `"aba"`. `s` is a string (it may be empty). Write `almost_palindrome(s)`. Return `True` if `s` is already a palindrome, or becomes one after deleting **at most one** character. Otherwise return `False`. Compare characters exactly: case matters and nothing is skipped. Aim for O(n) time.\n\n`almost_palindrome("abca")` → `True` (delete `"b"` or `"c"`)\n`almost_palindrome("abc")` → `False`',
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
            'Check it the way you would check a plain palindrome. Everything is fine until the first mismatch.',
            'Two pointers walking inward from the ends: stop at the first pair that differs.',
            'At a mismatch you get one deletion: drop the left character or the right one. Is what remains between the pointers a palindrome, from `left + 1` to `right`, or from `left` to `right - 1` (both ends included)?',
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
            "`prices[i]` is a share's price on day `i`. The list may be empty. You may buy once and sell once. The sale must be on a later day than the purchase. Return the largest profit you could make. If no trade makes money, return `0`.\n\nOne pass, O(1) extra space.\n\n`max_profit([7, 1, 5, 3, 6, 4])` → `5` (buy at 1, sell at 6)\n`max_profit([7, 6, 4, 3, 1])` → `0` (prices only go down)",
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
        debug({
          id: 'd3-stock-debug-order',
          title: 'Fix the profit calculator',
          skills: ['state_tracking'],
          prompt: '`max_profit(prices)` should return the best profit from buying once and selling on a **later** day. If no trade makes money, it returns `0`. An empty list also gives `0`. Make the tests pass.',
          brokenCode: `def max_profit(prices):
    lowest = float("inf")
    highest = 0
    for p in prices:
        lowest = min(lowest, p)
        highest = max(highest, p)
    return highest - lowest`,
          solution: `def max_profit(prices):
    lowest = float("inf")
    best = 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best`,
          tests: [t.eq('max_profit([7, 1, 5, 3, 6, 4])', '5'), t.eq('max_profit([7, 6, 4, 3, 1])', '0'), t.hidden('max_profit([])', '0'), t.hidden('max_profit([2, 9, 1, 3])', '7')],
          hints: ['In the falling list, on which days are the max and the min?', 'The sale has to come after the purchase: profit must be measured against the min **so far**.'],
          explanation: 'The global max and min ignore order, so they can describe "sell, then buy". Keeping the min so far and the best `p - lowest` respects time.',
          signature: 'debug:profit-order',
          minutes: 5,
        }),
        write({
          id: 'd3-stock-days',
          title: 'Which days to trade?',
          skills: ['state_tracking', 'enumerate', 'tuples'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          transfer: true,
          prompt: '`prices` is a list of numbers. `prices[i]` is a share’s price on day `i`. The list may be empty. You buy on one day and sell on a **later** day. Write `best_days(prices)`. Return a tuple `(buy_day, sell_day)` of the two day indexes that give the largest profit. If no trade makes money, return `None`. Every test has exactly one best trade.\n\n`best_days([7, 1, 5, 3, 6, 4])` → `(1, 4)` (buy at 1, sell at 6)\n`best_days([5, 4, 3])` → `None` (prices only go down)',
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
          hints: ['If you sell on day `i`, which earlier day was the best one to buy on?', 'Carry running state through one pass: the **index** of the lowest price so far, not just its value, and the best profit so far.', 'When the profit improves, record `(low_day, i)`.'],
          explanation: 'Tracking an index instead of a value is a common follow-up: the same running state, just remembering where it came from.',
          signature: 'running:min-index-pair',
          minutes: 8,
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
            '`numbers` is sorted from smallest to largest, and values may repeat. Exactly one pair of different positions adds up to `target`. Return their positions as a list `[a, b]`, with `a < b`. Use **1-based** positions: the first item is position 1.\n\nUse O(1) extra space: no dict or set.\n\n`two_sum_sorted([2, 7, 11, 15], 9)` → `[1, 2]` (2 + 7)\n`two_sum_sorted([2, 3, 4], 6)` → `[1, 3]` (2 + 4)',
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
          prompt: 'Explain why moving a single pointer can never skip the answer, and compare this with the hash map Two Sum (one pass, a dict of the numbers already passed).',
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
        debug({
          id: 'd3-tsii-debug-positions',
          title: 'Fix the positions',
          skills: ['two_pointer', 'pointer_update'],
          prompt: '`numbers` is a sorted list with exactly one pair that adds up to `target`. `two_sum_sorted(numbers, target)` should return that pair’s positions as `[a, b]`. Positions are **1-based**: the first item is position 1. Make the tests pass.',
          brokenCode: `def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1
    return []`,
          solution: `def two_sum_sorted(numbers, target):
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
          tests: [t.eq('two_sum_sorted([2, 7, 11, 15], 9)', '[1, 2]'), t.eq('two_sum_sorted([1, 3, 4, 6], 10)', '[3, 4]'), t.hidden('two_sum_sorted([-3, 0, 2], -1)', '[1, 3]')],
          hints: ['The pointer logic is fine. Compare the returned numbers with the expected ones.'],
          explanation: 'Python indexes are 0-based; the problem asks for positions counted from 1. Read the output format twice in an interview.',
          signature: 'debug:one-based-output',
          minutes: 3,
        }),
        write({
          id: 'd3-tsii-optimize-diff',
          title: 'Pair with a difference',
          skills: ['two_pointer', 'pointer_update', 'while_loop'],
          difficulty: 4,
          style: 'optimize',
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'This works but is O(n²):\n\n```python\ndef has_diff(nums, k):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[j] - nums[i] == k:\n                return True\n    return False\n```\n\n`nums` is a list of numbers sorted from smallest to largest (it may be empty). `k` is a number, `k >= 0`. The function returns `True` if two values at different positions differ by exactly `k`. Rewrite `has_diff(nums, k)` in O(n) time and O(1) space. Use two pointers that both move **left to right**: `i` behind, `j` ahead.\n\n`has_diff([1, 3, 5, 8], 3)` → `True` (8 - 5)\n`has_diff([1, 5], 0)` → `False` (k = 0 needs two equal values)',
          starterCode: `def has_diff(nums, k):
    pass`,
          solution: `def has_diff(nums, k):
    i, j = 0, 1
    while j < len(nums):
        if i == j:
            j += 1
            continue
        d = nums[j] - nums[i]
        if d == k:
            return True
        if d < k:
            j += 1
        else:
            i += 1
    return False`,
          tests: [
            t.eq('has_diff([1, 3, 5, 8], 3)', 'True'),
            t.eq('has_diff([1, 2, 3], 5)', 'False'),
            t.hidden('has_diff([1, 1], 0)', 'True'),
            t.hidden('has_diff([], 1)', 'False'),
            t.hidden('has_diff([1, 5], 0)', 'False'),
            t.hidden('has_diff([-4, -1, 2, 10], 6)', 'True'),
          ],
          hints: [
            'The difference `nums[j] - nums[i]` grows when j moves right and shrinks when i moves right.',
            'Too small → `j += 1`; too big → `i += 1`; equal → found.',
            'The pair must use two different positions: if `i` catches up to `j`, push `j` forward.',
            'Loop `while j < len(nums)`; every iteration moves exactly one pointer.',
          ],
          explanation: 'Same-direction pointers: each step moves one of them forward, so there are at most 2n steps. The sorted order tells you which pointer fixes the difference.',
          signature: 'two-pointer:same-direction-diff',
          minutes: 9,
        }),
        write({
          id: 'd3-tsii-triplet',
          title: 'Three numbers to a target',
          skills: ['two_pointer', 'pointer_update', 'sorting', 'range'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Stretch. `nums` is a list of numbers in no particular order. It is **not** sorted. `target` is a number. Write `has_triplet(nums, target)`. Return `True` if three numbers at three different positions add up to `target`, otherwise `False`. A list with fewer than three numbers returns `False`. Aim for O(n²).\n\n`has_triplet([4, 1, -3, 2], 3)` → `True` (4 + 2 + -3)\n`has_triplet([5, -1], 4)` → `False` (only two numbers)',
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
      summary: 'Today’s primitives once more: a signature and nothing else.',
      exercises: [
        write({
          id: 'd3-cold-last-k',
          title: 'Last k characters',
          skills: ['slicing', 'edge_cases'],
          ...cold,
          prompt: 'Write `last_k(s, k)`. Return the last `k` characters of `s`. If `k` is bigger than `len(s)`, return all of `s`. If `k` is 0, return `""`.',
          starterCode: `def last_k(s, k):
    pass`,
          solution: `def last_k(s, k):
    if k <= 0:
        return ""
    return s[-k:]`,
          tests: [t.eq('last_k("hello", 2)', '"lo"'), t.eq('last_k("hi", 0)', '""'), t.hidden('last_k("hi", 5)', '"hi"'), t.hidden('last_k("", 1)', '""')],
          explanation: '`-0` is just `0`, so `s[-0:]` is the whole string. Handling k = 0 separately (or slicing from `len(s) - k`) fixes it.',
          signature: 'slice:last-k',
          minutes: 3,
        }),
        write({
          id: 'd3-cold-pair-exists',
          title: 'Sorted pair, from a signature',
          skills: ['two_pointer', 'pointer_update'],
          ...cold,
          prompt: '`nums` is a sorted list. Write `pair_exists(nums, target)`. Return `True` if the values at two different positions add up to `target`, otherwise `False`. O(1) extra space.',
          starterCode: `def pair_exists(nums, target):
    pass`,
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
          minutes: 6,
          important: true,
        }),
        write({
          id: 'd3-cold-sell-today',
          title: 'Profit if you sell today',
          skills: ['state_tracking', 'list_append'],
          ...cold,
          prompt: 'Write `sell_today(prices)`. For each day, work out the profit from selling that day after buying at the lowest price up to and including that day. Return those profits as a list.\n\n`sell_today([3, 1, 4])` → `[0, 0, 3]`',
          starterCode: `def sell_today(prices):
    pass`,
          solution: `def sell_today(prices):
    out = []
    lowest = float("inf")
    for p in prices:
        lowest = min(lowest, p)
        out.append(p - lowest)
    return out`,
          tests: [t.eq('sell_today([3, 1, 4])', '[0, 0, 3]'), t.eq('sell_today([])', '[]'), t.hidden('sell_today([5, 6, 2, 9])', '[0, 1, 0, 7]')],
          signature: 'running:min-profit-list',
          minutes: 5,
        }),
        write({
          id: 'd3-cold-letter-pal',
          title: 'Letters-only palindrome',
          skills: ['two_pointer', 'pointer_update', 'string_methods'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `letters_pal(s)`. Ignore case and every character that isn’t a **letter** (`.isalpha()`, so digits are ignored too). Return `True` if what is left is a palindrome, otherwise `False`. O(1) extra space: don’t build a cleaned copy.',
          starterCode: `def letters_pal(s):
    pass`,
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
          minutes: 8,
        }),
      ],
    },
  ],
  capstones: ['valid-palindrome', 'best-time-stock', 'two-sum-ii'],
}
