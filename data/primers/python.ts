import type { Primer } from '@/data/primers/types'

/** Python foundations, strings, sorting and interview craft. */
export const PYTHON_PRIMERS: Primer[] = [
  {
    id: 'lists',
    title: 'Lists',
    skills: ['list_create', 'list_index', 'len', 'list_append', 'list_iterate'],
    what: 'A **list** is an ordered, changeable sequence of values written in square brackets. Each item has a position (its *index*) starting at `0`, and `-1` means "the last one". Lists grow with `.append()` and you can loop over them directly.',
    model: 'A numbered row of slots, starting at slot 0, that you can read, overwrite and add to at the end.',
    syntax: [
      { code: "cart = ['milk', 'eggs']", note: 'A list literal. `[]` is the empty list.' },
      { code: 'cart[0]', note: 'First item. `cart[-1]` is the last item.' },
      { code: "cart[1] = 'jam'", note: 'Overwrite the item at index 1.' },
      { code: "cart.append('bread')", note: 'Add one item to the end.' },
      { code: 'len(cart)', note: 'How many items. Works on strings, sets and dicts too.' },
      { code: 'for item in cart:', note: 'Visit each item in order.' },
    ],
    example: {
      code: `cart = ['milk', 'eggs']
cart.append('bread')
print(cart)
print(len(cart))
print(cart[0], cart[-1])

cart[1] = 'jam'
for item in cart:
    print('-', item)`,
      output: `['milk', 'eggs', 'bread']
3
milk bread
- milk
- jam
- bread`,
    },
    gotchas: [
      'Indexes start at 0, so the last valid index is `len(xs) - 1`. `xs[len(xs)]` raises `IndexError`.',
      '`xs[0]` on an empty list crashes. Check `if xs:` first.',
      '`.append()` changes the list and returns `None`. Don\'t write `xs = xs.append(x)`.',
      '`xs.append([1, 2])` adds *one* item (a list). Use `xs.extend([1, 2])` or `xs + [1, 2]` to add two.',
    ],
  },
  {
    id: 'for-range',
    title: 'for loops and range()',
    skills: ['for_loop', 'range'],
    what: 'A `for` loop runs its body once per item of a sequence. `range()` produces a sequence of integers, so `for i in range(n)` repeats something `n` times or walks over indexes. The **stop value is always excluded**.',
    model: '`range(start, stop, step)` counts from `start` up to, but never including, `stop`.',
    syntax: [
      { code: 'for x in temps:', note: 'Loop over the values themselves. Use this when you don\'t need positions.' },
      { code: 'range(5)', note: '0, 1, 2, 3, 4 (five numbers, 5 itself excluded).' },
      { code: 'range(2, 6)', note: '2, 3, 4, 5. Starts at `start`, stops before `stop`.' },
      { code: 'range(10, 0, -2)', note: '10, 8, 6, 4, 2. A negative step counts down.' },
      { code: 'for i in range(len(temps)):', note: 'Loop over indexes 0 … len-1 when you need `temps[i]`.' },
    ],
    example: {
      code: `for i in range(3):
    print(i)

print(list(range(2, 5)))
print(list(range(10, 0, -3)))

temps = [18, 21, 19]
for i in range(len(temps)):
    print(i, temps[i])`,
      output: `0
1
2
[2, 3, 4]
[10, 7, 4, 1]
0 18
1 21
2 19`,
    },
    gotchas: [
      '`range(1, 5)` stops at 4. To include `n`, write `range(1, n + 1)`.',
      '`for i in temps` gives values, not indexes: `temps[i]` inside it is a bug.',
      'Counting down needs a negative step: `range(5, 0)` is empty, `range(5, 0, -1)` is 5 … 1.',
      'Printing `range(3)` shows `range(0, 3)`, not the numbers. Wrap it in `list()` to see them.',
    ],
  },
  {
    id: 'conditionals',
    title: 'if / elif / else',
    skills: ['conditionals'],
    what: '`if` runs a block only when its condition is true; `elif` tries another condition; `else` catches everything left. Conditions combine with the words `and`, `or`, `not`, and **empty things count as false**: `[]`, `\'\'`, `{}`, `0` and `None`.',
    model: 'Python checks each condition top to bottom and runs only the first branch that matches.',
    syntax: [
      { code: 'if temp < 0:', note: 'Comparisons: `<  <=  >  >=  ==  !=`. Note the colon.' },
      { code: 'elif temp < 20:', note: 'Checked only if every earlier condition was false.' },
      { code: 'else:', note: 'Runs when nothing above matched. No condition.' },
      { code: 'if age >= 18 and has_ticket:', note: '`and`, `or`, `not` are words, not `&&` / `||` / `!`.' },
      { code: 'if not basket:', note: 'True when `basket` is empty (or `None`, `0`, `\'\'`).' },
    ],
    example: {
      code: `for temp in [-3, 12, 27]:
    if temp < 0:
        print(temp, 'freezing')
    elif temp < 20:
        print(temp, 'mild')
    else:
        print(temp, 'hot')

basket = []
if not basket:
    print('basket is empty')
print(5 > 3 and 2 > 4)
print(5 > 3 or 2 > 4)`,
      output: `-3 freezing
12 mild
27 hot
basket is empty
False
True`,
    },
    gotchas: [
      '`=` assigns, `==` compares. `if x = 3:` is a syntax error.',
      'Order matters: put the narrowest condition first, or a broad one will catch everything.',
      'Two separate `if`s can both run; `if`/`elif` runs at most one branch.',
      '`if x == 1 or 2:` is always true (it means `(x == 1) or 2`). Write `if x == 1 or x == 2:` or `if x in (1, 2):`.',
    ],
  },
  {
    id: 'accumulators',
    title: 'Accumulators and early return',
    skills: ['accumulator', 'early_return'],
    what: 'An **accumulator** is a variable you set up *before* a loop and update on every pass: a running total, a count, the best so far. An **early return** leaves the function from inside the loop the moment the answer is known, and the "not found" answer is returned only *after* the loop has checked everything.',
    model: 'Carry a scorecard through the loop; leave the moment you find what you came for, and only give up after looking everywhere.',
    syntax: [
      { code: 'total = 0', note: 'Initialise before the loop (0 for sums/counts, 1 for products).' },
      { code: '    total += p', note: 'Update it inside the loop. `+=` means `total = total + p`.' },
      { code: '        return True', note: 'Inside the loop: answer found, stop now.' },
      { code: '    return False', note: 'After the loop (dedented): only reached if nothing matched.' },
    ],
    example: {
      code: `def total_cost(prices):
    total = 0
    for p in prices:
        total += p
    return total

def has_item_over(prices, limit):
    for p in prices:
        if p > limit:
            return True      # answer known: stop now
    return False             # looked at everything

prices = [4, 12, 7]
print(total_cost(prices))
print(has_item_over(prices, 10))
print(has_item_over(prices, 20))`,
      output: `23
True
False`,
    },
    gotchas: [
      'Classic bug: `if ...: return True` followed by `else: return False` *inside* the loop. It returns after looking at only the first item.',
      'Initialising the accumulator inside the loop resets it every pass.',
      'Starting a "biggest so far" at `0` breaks when every value is negative. Start from the first item or `float(\'-inf\')`.',
      'Indentation decides everything: `return total` indented into the loop returns after one pass.',
    ],
  },
  {
    id: 'functions',
    title: 'Functions',
    skills: ['functions'],
    what: 'A **function** is a named, reusable block: `def` defines it, parameters receive the inputs, and `return` hands a value back to whoever called it. `print` only shows text on screen; it does not give anything back. A function that never reaches a `return` gives back `None`.',
    model: 'A machine with input slots (parameters) and one output chute (`return`); printing is just a light on the side.',
    syntax: [
      { code: 'def greet(name):', note: 'Define a function with one parameter. Note the colon.' },
      { code: "    return 'Hi, ' + name", note: 'Send a value back and stop the function immediately.' },
      { code: "msg = greet('Ana')", note: 'Call it; the returned value lands in `msg`.' },
      { code: 'def area(w, h=1):', note: 'Several parameters; `h` has a default if not passed.' },
    ],
    example: {
      code: `def greet(name):
    return 'Hi, ' + name

def shout(name):
    print(name.upper())      # prints, returns nothing

msg = greet('Ana')
print(msg)
result = shout('ben')
print(result)`,
      output: `Hi, Ana
BEN
None`,
    },
    gotchas: [
      'Printing is not returning. Interview graders call your function and look at what it **returns**.',
      'Code after `return` in the same block never runs.',
      'Forgetting `return` makes the function hand back `None`, which then breaks the caller (`None + 1`).',
      'Defining a function does nothing until you call it with parentheses: `greet` vs `greet(\'Ana\')`.',
    ],
  },
  {
    id: 'enumerate-tuples',
    title: 'enumerate and tuples',
    skills: ['enumerate', 'tuples'],
    what: 'A **tuple** is a fixed group of values like `(3, 7)`; you can **unpack** it into separate names with `x, y = point`. `enumerate(seq)` hands you `(index, value)` tuples, so `for i, x in enumerate(seq)` gives both the position and the item without `range(len(...))`.',
    model: 'A tuple is a sealed pair (or triple); unpacking opens it straight into named variables.',
    syntax: [
      { code: 'point = (3, 7)', note: 'A tuple. Read with `point[0]`; you can\'t change its items.' },
      { code: 'x, y = point', note: 'Unpack: `x` is 3, `y` is 7. Counts must match.' },
      { code: 'a, b = b, a', note: 'Swap two variables in one line, no temp needed.' },
      { code: 'for i, name in enumerate(names):', note: 'Index and value together; `i` starts at 0.' },
      { code: 'enumerate(names, start=1)', note: 'Start counting from 1 instead.' },
    ],
    example: {
      code: `runners = ['Ana', 'Ben', 'Cy']
for place, name in enumerate(runners, start=1):
    print(place, name)

point = (3, 7)
x, y = point
print(x + y)

a, b = 'left', 'right'
a, b = b, a
print(a, b)`,
      output: `1 Ana
2 Ben
3 Cy
10
right left`,
    },
    gotchas: [
      'Order is `(index, value)`: `for x, i in enumerate(...)` silently swaps them.',
      'Unpacking needs the exact count: `a, b = (1, 2, 3)` raises `ValueError`.',
      'Tuples are immutable: `point[0] = 5` is an error. Build a new tuple instead.',
      'A one-item tuple needs a comma: `(5,)`. Plain `(5)` is just the number 5.',
    ],
  },
  {
    id: 'list-comprehension',
    title: 'List comprehensions',
    skills: ['list_comprehension'],
    what: 'A **list comprehension** builds a new list in one expression: `[expression for item in seq if condition]`. It is shorthand for "make an empty list, loop, maybe filter, append".',
    model: 'Read it left to right as "give me *this* for each item in *that*, keeping only those where *condition*".',
    syntax: [
      { code: '[x * 2 for x in nums]', note: 'Transform every item.' },
      { code: '[x for x in nums if x > 0]', note: 'Keep only items passing the condition.' },
      { code: '[w.upper() for w in words if w]', note: 'Transform and filter together.' },
      { code: '[0] * n', note: 'Related shortcut: a list of `n` zeros.' },
    ],
    example: {
      code: `temps_c = [0, 15, 30]
temps_f = [c * 9 // 5 + 32 for c in temps_c]
print(temps_f)

names = ['ana', 'Bo', 'cyrus']
print([n for n in names if len(n) > 2])
print([n.title() for n in names])

# the same as the first one, written longhand
out = []
for c in temps_c:
    out.append(c * 9 // 5 + 32)
print(out == temps_f)`,
      output: `[32, 59, 86]
['ana', 'cyrus']
['Ana', 'Bo', 'Cyrus']
True`,
    },
    gotchas: [
      'The filter `if` goes at the end. An if/else that *chooses a value* goes at the front: `[x if x > 0 else 0 for x in nums]`.',
      'It always builds a **new** list; the original is unchanged.',
      'Don\'t cram in side effects (`[print(x) for x in xs]`). Use a normal loop when you are not building a list.',
    ],
  },
  {
    id: 'while-loops',
    title: 'while loops',
    skills: ['while_loop'],
    what: 'A `while` loop repeats its body **as long as a condition stays true**, checking it before each pass. Use it when you don\'t know in advance how many steps you need. Something inside the loop must move toward making the condition false, or it runs forever.',
    model: 'Check the condition, do one step of progress, check again.',
    syntax: [
      { code: 'while savings < 100:', note: 'Checked before every pass, including the first.' },
      { code: '    savings += 30', note: 'Progress: change something the condition depends on.' },
      { code: 'while True:', note: 'Loop forever until a `break`.' },
      { code: '    if done: break', note: '`break` exits the loop immediately.' },
    ],
    example: {
      code: `savings = 0
weeks = 0
while savings < 100:
    savings += 30
    weeks += 1
print(weeks, savings)

n = 1
while True:
    n *= 3
    if n > 50:
        break
print(n)`,
      output: `4 120
81`,
    },
    gotchas: [
      'Forgetting to update the variable in the condition gives an infinite loop.',
      'If the condition is false at the start, the body runs zero times.',
      'Off-by-one: `<` vs `<=` in the condition decides whether the last value is processed.',
      'Prefer `for` when you are simply visiting every item; use `while` when the step size or stopping point varies.',
    ],
  },
  {
    id: 'strings',
    title: 'Strings',
    skills: ['string_index', 'string_iterate', 'string_methods'],
    what: 'A **string** is a sequence of characters, so you index and loop over it just like a list: `s[0]`, `s[-1]`, `for ch in s`. Strings are **immutable**: methods like `.lower()` return a *new* string and leave the original alone.',
    model: 'A read-only list of characters with a toolbox of methods that hand you back new strings.',
    syntax: [
      { code: 's[0], s[-1]', note: 'First and last character. `s[i] = \'x\'` is an error.' },
      { code: 'for ch in s:', note: 'Visit each character in order.' },
      { code: 's.lower()', note: 'New lowercased copy. Also `.upper()`, `.strip()`.' },
      { code: 'ch.isalnum()', note: '`True` for letters and digits; also `.isalpha()`, `.isdigit()`.' },
      { code: 's.split()', note: 'List of words split on whitespace. `.split(\',\')` splits on commas.' },
      { code: "''.join(parts)", note: 'Glue a list of strings into one, with `\'\'` between them.' },
    ],
    example: {
      code: `s = 'Hello, World 42'
print(s[0], s[-1])
print(s.lower())
print(s.split())
print('a1'.isalnum(), ','.isalnum())

caps = []
for ch in s:
    if ch.isupper():
        caps.append(ch)
print(''.join(caps))
print('-'.join(['2026', '10', '03']))`,
      output: `H 2
hello, world 42
['Hello,', 'World', '42']
True False
HW
2026-10-03`,
    },
    gotchas: [
      '`s.lower()` alone does nothing useful; keep the result: `s = s.lower()`.',
      'You can\'t change a character in place. Build a list of characters and `\'\'.join()` it.',
      'Adding to a string in a loop (`out += ch`) copies it each time; collecting in a list then joining is the usual style.',
      '`.join` is called on the separator, not the list: `\', \'.join(words)`.',
    ],
  },
  {
    id: 'slicing',
    title: 'Slicing',
    skills: ['slicing'],
    what: 'A **slice** `s[a:b]` takes the piece from index `a` up to, but **not including**, `b`. Leave out `a` to start at the beginning, leave out `b` to go to the end, and add a third number as the step. It works the same on strings and lists and always makes a **copy**.',
    model: 'Indexes are fence posts between items; `s[a:b]` is everything between post `a` and post `b`.',
    syntax: [
      { code: 's[2:5]', note: 'Items at 2, 3, 4. Length is `5 - 2`.' },
      { code: 's[:3]', note: 'The first 3 items.' },
      { code: 's[3:]', note: 'Everything from index 3 onward.' },
      { code: 's[-3:]', note: 'The last 3 items.' },
      { code: 's[::-1]', note: 'A reversed copy (step of -1).' },
      { code: 'xs[:]', note: 'A full copy of a list.' },
    ],
    example: {
      code: `day = 'Saturday'
print(day[0:3])
print(day[3:])
print(day[-3:])
print(day[::-1])

queue = [10, 20, 30, 40]
front = queue[:2]
front.append(99)
print(front, queue)`,
      output: `Sat
urday
day
yadrutaS
[10, 20, 99] [10, 20, 30, 40]`,
    },
    gotchas: [
      'The end index is excluded: `s[0:3]` has 3 items, not 4.',
      'Slices never raise `IndexError`: `\'abc\'[1:99]` is just `\'bc\'`. Indexing (`s[99]`) does raise.',
      'A slice is a copy, so changing it doesn\'t change the original, and slicing inside a loop costs O(k) each time.',
    ],
  },
  {
    id: 'sorting',
    title: 'Sorting and sort keys',
    skills: ['sorting', 'sort_key'],
    what: '`sorted(xs)` returns a **new** sorted list and leaves `xs` alone; `xs.sort()` sorts the list **in place** and returns `None`. Pass `reverse=True` for descending, and `key=` to sort by something derived from each item, like its length or its second field.',
    model: '`key` turns each item into the thing you want to compare by; Python sorts by those, but keeps the original items.',
    syntax: [
      { code: 'sorted(scores)', note: 'New ascending list. Works on any iterable, even strings.' },
      { code: 'scores.sort()', note: 'Sorts the list itself. Returns `None`.' },
      { code: 'sorted(scores, reverse=True)', note: 'Descending.' },
      { code: 'sorted(words, key=len)', note: 'Shortest word first.' },
      { code: 'sorted(pairs, key=lambda p: p[1])', note: 'Sort tuples by their second item.' },
      { code: 'sorted(pairs)', note: 'Tuples sort by first item, then second on ties.' },
    ],
    example: {
      code: `scores = [70, 95, 82]
print(sorted(scores))
print(scores)
scores.sort(reverse=True)
print(scores)

words = ['kiwi', 'fig', 'banana', 'pea']
print(sorted(words, key=len))

people = [('ana', 31), ('ben', 27), ('cy', 31)]
print(sorted(people, key=lambda p: p[1]))
print(scores.sort())`,
      output: `[70, 82, 95]
[70, 95, 82]
[95, 82, 70]
['fig', 'pea', 'kiwi', 'banana']
[('ben', 27), ('ana', 31), ('cy', 31)]
None`,
    },
    gotchas: [
      '`xs = xs.sort()` sets `xs` to `None`. Use `xs.sort()` alone, or `xs = sorted(xs)`.',
      'Sorting is **stable**: items with equal keys keep their original order (`fig` stays before `pea`).',
      'Sorting costs O(n log n). Mention it when it is the slowest step of your solution.',
      '`lambda p: p[1]` is just a tiny unnamed function: "given `p`, return `p[1]`".',
    ],
  },
  {
    id: 'interview-craft',
    title: 'Complexity, edge cases, explaining',
    skills: ['complexity', 'edge_cases', 'explanation'],
    what: '**Big-O** describes how time (steps) and space (extra memory) grow as the input size `n` grows, ignoring constants. Interviewers also expect you to name the **edge cases** you will test and to **explain** your plan out loud before and while you code.',
    model: 'Count how many times the innermost line runs as `n` gets huge; then prove the code survives the weird inputs.',
    syntax: [
      { code: '# O(1)', note: 'Constant: `xs[i]`, `x in some_set`, `d[key]`, `.append()`.' },
      { code: '# O(log n)', note: 'Halving each step, like binary search.' },
      { code: '# O(n)', note: 'One pass over the input; `x in some_list` is also O(n).' },
      { code: '# O(n log n)', note: 'Sorting.' },
      { code: '# O(n²)', note: 'A loop inside a loop over the same input.' },
      { code: 'f([]), f([5]), f([2, 2]), f([-1, 3]), f([1, 2, 3])', note: 'Edge cases: empty, one item, duplicates, negatives, already sorted.' },
    ],
    example: {
      code: `def average(nums):
    # O(n) time: one pass. O(1) extra space: one variable.
    if not nums:             # edge case: empty
        return 0
    total = 0
    for x in nums:
        total += x
    return total / len(nums)

print(average([]))
print(average([5]))
print(average([-2, 2, 6]))
print(average([3, 3, 3]))`,
      output: `0
5.0
2.0
3.0`,
    },
    gotchas: [
      'Explaining structure: **restate** the problem and ask about inputs, give the **brute force** and its cost, **improve** it, state the final **complexity**, then **test** on a small example and the edge cases.',
      'Space means *extra* memory you create (a set, a dict, a copy), not the input itself.',
      'Hidden loops count: `x in some_list`, slicing, `sorted()` and `.index()` inside a loop all add cost.',
      'Two separate loops one after another are O(n) + O(n) = O(n), not O(n²).',
    ],
  },
]
