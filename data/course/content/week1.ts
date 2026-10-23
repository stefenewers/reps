import type { Lesson, WorkedExample } from '@/data/course/types'

/**
 * Reps 2.0, Week 1 lessons and worked examples (REPS_2_MASTER_SPEC.md §9, §17).
 * Every `code` block runs as written, and its `output` is exactly what it prints.
 * The reps for these live in data/exercises/course/week1.ts.
 */

export const lessons: Lesson[] = [
  // ───────────────────────────── State ─────────────────────────────
  {
    id: 'l-state',
    title: 'State',
    concept: 'State is information the program remembers because something later depends on it. In Python, state lives in variables, and a variable only changes when a line gives it a new value.',
    mentalModel:
      'Picture a whiteboard with a column of names and a column of values. Each line of code either reads the board or rewrites one value on it. To know what a program does, you keep that board up to date, one line at a time. On paper, that board is a **variable table**: one column per variable, one row per step.',
    whyItMatters:
      'Every technique later in this course is a choice of state. Two pointers are two indexes. A sliding window is a left edge, a right edge and a count. A linked-list walk is "the node I am on". When code is wrong, the cause is almost always one piece of state holding the wrong value at one line. Engineers debug by asking two questions: what does the program remember, and when did it change?',
    sections: [
      {
        heading: 'One line at a time',
        body: 'Python runs your lines top to bottom, one at a time. Each assignment puts a value on the board. The value stays there until another line replaces it.\n\n`coins = coins + 3` looks odd if you read `=` as "equals". Read it as **"becomes"**: coins becomes (the old coins) plus 3. Python works out the right side first, using the old value, and then stores the result.',
        code: `coins = 5
coins = coins + 3
print(coins)
coins = coins * 2
print(coins)`,
        output: '8\n16',
      },
      {
        heading: 'A copy of a number does not follow the original',
        body: '`bonus = score` copies the value 10 onto the board under a second name. Later, `score` changes. `bonus` still holds 10, because nothing rewrote it.\n\n(Lists behave differently. That is Thursday\'s lesson.)',
        code: `score = 10
bonus = score
score = score + 5
print(score, bonus)`,
        output: '15 10',
      },
      {
        heading: 'Keep a variable table',
        body: 'When a loop is involved, the board changes many times. Draw it:\n\n| pass | price | total |\n|---|---|---|\n| before | – | 0 |\n| 1 | 4 | 4 |\n| 2 | 6 | 10 |\n| 3 | 5 | 15 |\n\nOne row per pass. Each row shows the values **after** that pass. This habit is slow for a day and fast forever. When code surprises you, the table shows the exact line where your picture and the program split.',
        code: `total = 0
for price in [4, 6, 5]:
    total = total + price
    print(price, total)`,
        output: '4 4\n6 10\n5 15',
      },
      {
        heading: 'Where state is made decides how long it lives',
        body: 'State that must survive the whole loop is created **once, before the loop**. A line inside the loop runs on every pass. If `seen = 0` is inside, the memory is wiped every pass, and only the last item survives.',
        code: `visits = [3, 1, 4]
for v in visits:
    seen = 0
    seen = seen + v
print("inside:", seen)

seen = 0
for v in visits:
    seen = seen + v
print("outside:", seen)`,
        output: 'inside: 4\noutside: 8',
      },
      {
        heading: 'A swap needs one more piece of state',
        body: 'To swap two values, you cannot just write `left = right` and then `right = left`. After the first line, the old value of `left` is gone from the board. Save it first in a third variable.\n\nPython also has a one-line swap. `a, b = b, a` works out both values on the right before it assigns either one.',
        code: `left = "coffee"
right = "tea"
old_left = left
left = right
right = old_left
print(left, right)

a, b = 1, 2
a, b = b, a
print(a, b)`,
        output: 'tea coffee\n2 1',
      },
    ],
    mistakes: [
      'Resetting state inside a loop (`total = 0` on every pass), so it forgets everything except the last item.',
      'Writing `count + 1` on its own line and expecting `count` to change. Only an assignment, `count = count + 1`, changes it.',
      'Overwriting a value before saving it, as in a swap without a third variable.',
      'Reading a variable before any line has given it a value, which raises `NameError`.',
      'Tracing in your head when a two-minute table on paper would show the bug.',
    ],
  },

  // ───────────────────────────── While loops ─────────────────────────────
  {
    id: 'l-while',
    title: 'While loops',
    concept: 'A `while` loop repeats its body as long as its condition is true. It checks the condition before every pass. The body must change the state the condition reads, or the loop never ends.',
    mentalModel:
      '**STATE → CHECK → DO WORK → CHANGE STATE → CHECK AGAIN.**\n\nSet up the state. Check the condition. If it is true, do one pass of work, change the state, and go back to the check. If it is false, leave the loop and carry on below it. Every while loop you will ever write is this cycle.',
    whyItMatters:
      'A `for` loop walks every item for you. A `while` loop lets you decide when to stop and how the state moves. Two pointers, binary search, sliding windows and linked lists all need that control, and all of them are while loops. When an interview solution hangs or misses one item, the bug lives in one of the four steps above.',
    sections: [
      {
        heading: 'The cycle',
        body: 'You save 40 a week and want at least 100.\n\n- **State:** `saved` and `weeks`, made before the loop.\n- **Check:** `saved < 100`. Still short of the goal?\n- **Do work, change state:** add 40, count one more week.\n- **Check again.**\n\nAfter week 2, `saved` is 80 and the check is still true. After week 3 it is 120, the check is false, and the loop ends.',
        code: `saved = 0
weeks = 0
while saved < 100:
    saved = saved + 40
    weeks = weeks + 1
print(weeks, saved)`,
        output: '3 120',
      },
      {
        heading: 'The check only happens at the top',
        body: 'Python does not watch the condition all the time. It checks it once at the top of each pass. Here `n` becomes 0 halfway through the second pass. The pass still finishes and prints, and only then does the next check fail.',
        code: `n = 2
while n > 0:
    n = n - 1
    print("inside, n is", n)
print("after, n is", n)`,
        output: 'inside, n is 1\ninside, n is 0\nafter, n is 0',
      },
      {
        heading: 'A loop that never starts',
        body: 'If the condition is false the first time, the body never runs. That is often exactly what you want. "Already below the limit" should take zero days.',
        code: `battery = 10
while battery > 20:
    battery = battery - 5
print(battery)`,
        output: '10',
      },
      {
        heading: 'Every pass must make progress',
        body: 'This loop never ends:\n\n```python\nremaining = 1000\nlaps = 0\nwhile remaining > 0:\n    laps = laps + 1\n    # nothing changes remaining\n```\n\nThe check reads `remaining`, and the body never changes it, so the answer to the check never changes. Before you run a while loop, point at the condition and ask: **which line changes what this reads, and does it move toward false?**',
        code: `remaining = 1000
laps = 0
while remaining > 0:
    laps = laps + 1
    remaining = remaining - 400
print(laps, remaining)`,
        output: '3 -200',
      },
      {
        heading: 'Boundaries: < or <=',
        body: 'A price halves every day, rounded down with `//`. How many days until it is below 10? Keep going **while it is still 10 or more**: `price >= 10`.\n\nWhenever a condition compares with a limit, ask out loud: does the limit itself keep the loop going, or stop it? Then test the boundary: here, a starting price of exactly 10 should take 1 day.',
        code: `price = 100
days = 0
while price >= 10:
    price = price // 2
    days = days + 1
print(days, price)`,
        output: '4 6',
      },
    ],
    mistakes: [
      'Forgetting the state change, so the loop runs forever.',
      'Changing a different variable from the one the condition reads (`distance` instead of `remaining`).',
      'Using `<` where the limit itself should count, or `<=` where it should not: one pass too few or too many.',
      'Expecting the loop to stop the moment the condition turns false in the middle of the body.',
      'Creating the state inside the loop, so it starts over on every pass.',
    ],
  },

  // ───────────────────────────── Loop control ─────────────────────────────
  {
    id: 'l-loop-control',
    title: 'Controlling a loop',
    concept: 'Controlling a loop means deciding where it starts, what it checks, how it moves and when it stops. A scan by index has two ways out: it finds what it wants, or it runs out of items.',
    mentalModel:
      'Picture a finger on a list. `i` is where the finger is. Before you look, check that the finger is still on the list: `i < len(items)`. Look at `items[i]`. Then either stop, because you found it, or move the finger one place. If the finger falls off the end, you ran out. After the loop, ask which of the two exits you took.',
    whyItMatters:
      'Next week\'s problems and every pointer technique after them are this loop with more fingers. Two pointers move two indexes toward each other. A sliding window moves a left and a right edge. Binary search moves `lo` and `hi`. A linked list moves a node reference. If one finger and two exits are automatic, those become small additions instead of new mysteries.',
    sections: [
      {
        heading: 'Walking by index',
        body: 'The first item is at index 0 and the last is at `len(temps) - 1`. The guard `i < len(temps)` is true exactly while `temps[i]` is safe to read. When the loop ends, `i` is one past the last index.',
        code: `temps = [12, 15, 9]
i = 0
while i < len(temps):
    print("index", i, "temp", temps[i])
    i = i + 1
print("i ended at", i)`,
        output: 'index 0 temp 12\nindex 1 temp 15\nindex 2 temp 9\ni ended at 3',
      },
      {
        heading: 'Check the guard first',
        body: '`and` checks left to right and stops at the first false. With the guard first, `temps[i]` is never read once `i` reaches the end.\n\nSwap the two sides, `temps[i] < 30 and i < len(temps)`, and it crashes with `IndexError` when no temperature reaches 30.',
        code: `temps = [12, 15]
i = 0
while i < len(temps) and temps[i] < 30:
    i = i + 1
print(i)`,
        output: '2',
      },
      {
        heading: 'Two exits: found or ran out',
        body: 'Inside a function, `return` leaves the loop and the function at once. That is the **found** exit. If the loop finishes without returning, every item was checked and none matched. That is the **ran out** exit, and its answer goes **after** the loop.',
        code: `def first_hot_day(temps, hot):
    i = 0
    while i < len(temps):
        if temps[i] >= hot:
            return i
        i = i + 1
    return -1

print(first_hot_day([18, 31, 35], 30))
print(first_hot_day([18, 22], 30))`,
        output: '1\n-1',
      },
      {
        heading: 'Stopping early with break',
        body: '`break` ends the loop right away and continues at the first line after it. Use it when the rest of the list no longer matters.',
        code: `orders = ["tea", "cake", "close", "coffee"]
served = []
for item in orders:
    if item == "close":
        break
    served.append(item)
print(served)`,
        output: "['tea', 'cake']",
      },
      {
        heading: 'Walking backward',
        body: 'The same loop runs the other way. Start at the last index, keep going while `i >= 0`, and step with `i = i - 1`. Use it when the answer is the **last** match.',
        code: `scores = [7, 2, 9, 4]
i = len(scores) - 1
while i >= 0:
    print(i, scores[i])
    i = i - 1`,
        output: '3 4\n2 9\n1 2\n0 7',
      },
    ],
    mistakes: [
      'Reading `items[i]` before checking `i < len(items)`, or putting the guard second in an `and`.',
      'Using `i <= len(items)`, which reads one past the end.',
      'Returning "not found" inside the loop (in an `else`), so only the first item is ever checked.',
      'Putting `i = i + 1` inside an `if`, so the index stops moving on some items and the loop hangs.',
      'Mixing up the index `i` with the value `items[i]`.',
    ],
  },

  // ───────────────────────────── Running state ─────────────────────────────
  {
    id: 'l-running-state',
    title: 'Running state',
    concept: 'Running state is a small summary of everything a scan has seen so far: a best so far, a count, a total or the previous value. Each pass looks at one new item and updates the summary.',
    mentalModel:
      'Picture a scoreboard you carry while you walk down the list. You do not carry the whole history, only the few numbers the rest of the walk needs. At each item: look at it, compare it with the board, and change only the entries it affects.',
    whyItMatters:
      'Best Time to Buy and Sell Stock keeps the lowest price so far. Maximum Subarray keeps the best sum ending here. Longest streaks keep a current run and a best run. Sliding windows keep counts for the items inside the window. Real systems do the same with streams of logs and metrics that are too big to store. Choosing the right few numbers to remember is the skill.',
    sections: [
      {
        heading: 'Best so far',
        body: 'Start the best at the first value, then let each item challenge it. The best only changes when something beats it.',
        code: `temps = [14, 19, 17, 22, 20]
hottest = temps[0]
for temp in temps:
    if temp > hottest:
        hottest = temp
print(hottest)`,
        output: '22',
      },
      {
        heading: 'Counting as you go',
        body: 'Race times, where lower is better. A run is a **record** when it beats every time before it. Two pieces of state work together: the best time and the number of records. `None` means "no best yet", so the first run always counts. A tie is not a record.',
        code: `times = [62, 58, 60, 55, 55]
best = None
records = 0
for time in times:
    if best is None or time < best:
        best = time
        records = records + 1
print(records, best)`,
        output: '3 55',
      },
      {
        heading: 'The previous value',
        body: 'To compare each item with the one before it, remember the one before it. Update `prev` at the **very end** of the pass, after you have used it.',
        code: `readings = [3, 5, 4, 8]
prev = None
for r in readings:
    if prev is not None:
        print(r - prev)
    prev = r`,
        output: '2\n-1\n4',
      },
      {
        heading: 'Runs: a current one and a best one',
        body: 'A **warm spell** is days in a row at 20 or above, like 21, 23, 20. Keep the current spell\'s length and the best length. A cold day resets the current spell to 0. Check the best on **every** pass. Then a spell that lasts to the end of the list still counts.',
        code: `temps = [21, 23, 15, 20, 22, 24]
current = 0
best = 0
for temp in temps:
    if temp >= 20:
        current = current + 1
    else:
        current = 0
    if current > best:
        best = current
print(best)`,
        output: '3',
      },
      {
        heading: 'Pick the starting value carefully',
        body: 'Starting a "biggest" at 0 is a classic slip. If every value is negative, nothing beats 0, and the answer is wrong. Start at the first value, or at `None` with a check.',
        code: `losses = [-5, -2, -9]
wrong = 0
for x in losses:
    if x > wrong:
        wrong = x
right = losses[0]
for x in losses:
    if x > right:
        right = x
print(wrong, right)`,
        output: '0 -2',
      },
    ],
    mistakes: [
      'Starting a best at 0 when the values can be negative.',
      'Updating `prev` before comparing with it, so every item is compared with itself.',
      'Checking the best only when a run ends, which misses a run that lasts to the end.',
      'Creating the running state inside the loop, so it starts over every pass.',
      'Forgetting the empty list: `temps[0]` crashes when there is no first value.',
    ],
  },

  // ───────────────────────────── Mutation and references ─────────────────────────────
  {
    id: 'l-mutation-references',
    title: 'Mutation and references',
    concept: 'Mutating a list changes it in place: the same list now holds different items. A variable is a name that refers to a value, so two names can refer to the same list. A change made through one name is seen through the other.',
    mentalModel:
      'A list is an object somewhere in memory. A name is a tag tied to it. `b = a` ties a second tag to the **same** object. `a[:]` or `list(a)` builds a **second** object with the same items. Passing a list to a function ties the parameter\'s tag to the caller\'s object. `append`, `pop` and `a[i] = ...` change the object, so every tag sees it. `a = [...]` only moves one tag.',
    whyItMatters:
      'A linked list is nothing but references being rewired, which is Week 5. Backtracking saves `path[:]` copies, or every answer ends up the same list. Grids built with `[[0] * n] * m` break in interviews. In real code, a function that quietly changes the list it was given is a classic production bug. Knowing when two names share one list is part of being trusted with a codebase.',
    sections: [
      {
        heading: 'Changing a list in place',
        body: '`append` adds to the end. `cart[0] = ...` replaces one item. `pop()` removes the last item and hands it back. None of these make a new list. They change the one you have.',
        code: `cart = ["milk", "eggs"]
cart.append("bread")
cart[0] = "oat milk"
last = cart.pop()
print(cart, last)`,
        output: "['oat milk', 'eggs'] bread",
      },
      {
        heading: 'Two names, one list',
        body: '`yours = mine` does not copy anything. It gives the same list a second name: this is **aliasing**. `is` asks whether two names refer to the very same object.',
        code: `mine = [1, 2]
yours = mine
yours.append(3)
print(mine)
print(yours is mine)`,
        output: '[1, 2, 3]\nTrue',
      },
      {
        heading: 'Making a real copy',
        body: '`mine[:]` and `list(mine)` build a new list with the same items. Changing the copy leaves the original alone.\n\nAlso notice the difference between **changing** a list and **rebinding** a name. `copy = copy + [9]` builds yet another list and moves the name `copy` to it. It does not touch `mine` either.',
        code: `mine = [1, 2]
copy = mine[:]
copy.append(3)
print(mine, copy)
other = list(mine)
other = other + [9]
print(mine, other)`,
        output: '[1, 2] [1, 2, 3]\n[1, 2] [1, 2, 9]',
      },
      {
        heading: 'Functions get the same list',
        body: 'A parameter is another name for the caller\'s list. `add_tip` changes the caller\'s list and returns nothing, which means `None`. `with_tip` builds a new list and returns it, leaving the caller\'s list alone. Decide which one you are writing, and say so in the function\'s name or docstring.',
        code: `def add_tip(bill):
    bill.append(5)

def with_tip(bill):
    return bill + [5]

a = [20, 30]
result = add_tip(a)
print(a, result)
b = [20, 30]
c = with_tip(b)
print(b, c)`,
        output: '[20, 30, 5] None\n[20, 30] [20, 30, 5]',
      },
      {
        heading: 'The repeated-row trap',
        body: '`[[0] * 3] * 2` makes **one** row list and puts it in the grid twice. Changing a cell in one row changes the other, because they are the same row. Build each row separately.',
        code: `bad = [[0] * 3] * 2
bad[0][1] = 1
print(bad)

good = []
for _ in range(2):
    good.append([0] * 3)
good[0][1] = 1
print(good)`,
        output: '[[0, 1, 0], [0, 1, 0]]\n[[0, 1, 0], [0, 0, 0]]',
      },
    ],
    mistakes: [
      'Thinking `b = a` copies a list. It shares it.',
      'Saving a list you keep changing, `history.append(cart)`, instead of a copy, `history.append(cart[:])`. Every entry ends up the same list.',
      'Using `x = some_list.sort()` and getting `None`. `.sort()` changes the list and returns nothing. `sorted(...)` returns a new list.',
      'Sorting or changing a parameter in place when the caller still needs the original.',
      'Building a grid with `[[0] * cols] * rows`, so every row is the same list.',
    ],
  },

  // ───────────────────────────── Decomposition ─────────────────────────────
  {
    id: 'l-decomposition',
    title: 'Decomposition',
    concept: 'Decomposition is splitting a task into small functions that each do one job, then putting them together. Each helper has a clear input and a clear output, so you can test it on its own.',
    mentalModel:
      'Picture an assembly line: raw text → **parse** → **check** → **summarise** → report. Each station takes one kind of thing and hands on one kind of thing. When the result comes out wrong, you test the stations one at a time instead of staring at the whole line.',
    whyItMatters:
      'In an interview, saying "first I\'ll parse, then validate, then count" shows a plan before code. It also gives you places to test as you go. This week\'s Inventory Processor lab is built exactly this way, and so is real production code: small functions with one job are the ones teammates can read, review and change safely.',
    sections: [
      {
        heading: 'Name the jobs before writing code',
        body: 'Task: a workout log has lines like `"run,30"` (activity, minutes). Report the total minutes of valid workouts.\n\nSay the jobs out loud first:\n\n1. **Parse** one line into values.\n2. **Check** that one workout makes sense.\n3. **Summarise** a list of good workouts.\n\nEach job is one function. Each fits in a few lines.',
        code: `def parse_workout(line):
    activity, minutes = line.split(",")
    return (activity, int(minutes))

print(parse_workout("run,30"))`,
        output: "('run', 30)",
      },
      {
        heading: 'Each helper makes one promise',
        body: '`is_good` takes one parsed workout and promises `True` or `False`. It does not parse and it does not add anything up. A helper that does one job is easy to name, and easy to test with a single `print`.',
        code: `def is_good(workout):
    activity, minutes = workout
    return activity != "" and minutes > 0

print(is_good(("run", 30)))
print(is_good(("", 30)))
print(is_good(("swim", 0)))`,
        output: 'True\nFalse\nFalse',
      },
      {
        heading: 'Compose them',
        body: 'Now the top-level function reads like the plan: parse each line, keep the good ones, add them up. If it needs a comment to explain a block, that block probably wants to be its own function.',
        code: `def parse_workout(line):
    activity, minutes = line.split(",")
    return (activity, int(minutes))

def is_good(workout):
    activity, minutes = workout
    return activity != "" and minutes > 0

def total_minutes(workouts):
    total = 0
    for activity, minutes in workouts:
        total = total + minutes
    return total

def report(lines):
    good = []
    for line in lines:
        workout = parse_workout(line)
        if is_good(workout):
            good.append(workout)
    return total_minutes(good)

print(report(["run,30", ",15", "swim,45", "yoga,0"]))`,
        output: '75',
      },
      {
        heading: 'When it breaks, test the stations',
        body: 'If `report` gives a wrong answer, do not reread all of it. Call each helper on one small input and compare with what it promises. The first helper that breaks its promise is where the bug lives.',
        code: `def parse_workout(line):
    activity, minutes = line.split(",")
    return (activity, minutes)

print(parse_workout("run,30"))`,
        output: "('run', '30')",
      },
    ],
    mistakes: [
      'One long function that parses, checks and totals all at once, so a bug could be anywhere.',
      'A helper that quietly does two jobs, like checking and also printing or changing a list.',
      'Helpers that disagree about shapes: one returns text where the next expects a number.',
      'Testing only the top-level function, so a failure says "something is wrong" but not where.',
    ],
  },
]

export const workedExamples: WorkedExample[] = [
  {
    id: 'we-countdown',
    title: 'Countdown with a while loop',
    unitId: 'w1-state-while',
    problem: '`n` is a whole number. Return a list that counts down from `n` to `1`. If `n` is 0 or less, return an empty list. Use a while loop.\n\n`countdown(3)` → `[3, 2, 1]`\n`countdown(0)` → `[]`',
    subgoals: [
      {
        title: 'Name the state',
        explanation: 'Two things must be remembered from pass to pass: the number you are on, and the list of numbers said so far. Both are created once, before the loop.',
        code: `said = []
current = n`,
      },
      {
        title: 'Decide when the loop stops',
        explanation: 'Keep going while there is still a number to say: `current >= 1`. This one check also handles `n <= 0`. The condition is false at the start, so the body never runs, and the empty list comes back.',
        code: `while current >= 1:`,
      },
      {
        title: 'Do the work for this pass',
        explanation: 'One pass says one number: add `current` to the list.',
        code: `    said.append(current)`,
      },
      {
        title: 'Change the state so the check can become false',
        explanation: 'Without this line the loop never ends. Moving `current` down by one brings it closer to 0 on every pass. After the loop, the list is complete.',
        code: `    current = current - 1
return said`,
      },
    ],
    solution: `def countdown(n):
    said = []
    current = n
    while current >= 1:
        said.append(current)
        current = current - 1
    return said
`,
    reconstructionExerciseId: 'c1-while-rebuild-countdown',
  },
  {
    id: 'we-first-negative',
    title: 'First negative balance',
    unitId: 'w1-loop-control',
    problem: '`balances` is a list of end-of-day bank balances. Return the index of the first balance below 0. If there is none, return `-1`. Use a while loop and an index.\n\n`first_negative([40, 15, -5, 20, -1])` → `2`\n`first_negative([])` → `-1`',
    subgoals: [
      {
        title: 'Decide when the scan ends',
        explanation: 'The scan can end two ways. It finds a negative balance, or it runs out of balances. The loop condition covers running out: keep going while `i` is still a valid index.',
        code: `i = 0
while i < len(balances):`,
      },
      {
        title: 'Inspect the current value',
        explanation: 'The guard has already made sure `balances[i]` is safe to read. Ask the one question the task cares about: is this balance below 0?',
        code: `    if balances[i] < 0:`,
      },
      {
        title: 'Leave as soon as the answer is known',
        explanation: 'The first negative is the answer, and nothing after it can change that. `return i` leaves the loop and the function together. Otherwise, move the index one place, outside the `if`, so it moves on every pass that does not return.',
        code: `        return i
    i = i + 1`,
      },
      {
        title: 'Handle the other exit',
        explanation: 'Reaching the line after the loop means every balance was checked and none was negative. Only now is `-1` the right answer. Putting it inside the loop would give up after one item.',
        code: `return -1`,
      },
    ],
    solution: `def first_negative(balances):
    i = 0
    while i < len(balances):
        if balances[i] < 0:
            return i
        i = i + 1
    return -1
`,
    reconstructionExerciseId: 'c1-loop-rebuild-first-negative',
  },
  {
    id: 'we-best-so-far',
    title: 'Peak balance',
    unitId: 'w1-running-state',
    problem: '`start` is a bank balance. `changes` is a list of amounts added to it in order, and a negative amount is money taken out. Return the highest the balance ever was. The starting balance counts.\n\n`peak_balance(100, [50, -30, 40, -100])` → `160`\n`peak_balance(100, [-10, -20])` → `100`',
    subgoals: [
      {
        title: 'Decide what to remember',
        explanation: 'You do not need the whole history of balances. You need the balance right now, because the next change builds on it. You also need the highest balance so far, because that is the answer.',
      },
      {
        title: 'Start the state from what you know before any change',
        explanation: 'Before the first change, the balance is `start`, and the highest it has been is also `start`. Starting `peak` at 0 would be wrong: a balance that is negative all along would report 0.',
        code: `balance = start
peak = start`,
      },
      {
        title: 'Update what changes every time',
        explanation: 'Every change moves the balance. This line runs on every pass, with no condition.',
        code: `for change in changes:
    balance = balance + change`,
      },
      {
        title: 'Change only the state that can improve the answer',
        explanation: 'The peak only moves when the balance beats it. A drop leaves the peak alone. After the loop, the peak has seen every balance.',
        code: `    if balance > peak:
        peak = balance
return peak`,
      },
    ],
    solution: `def peak_balance(start, changes):
    balance = start
    peak = start
    for change in changes:
        balance = balance + change
        if balance > peak:
            peak = balance
    return peak
`,
    reconstructionExerciseId: 'c1-running-rebuild-best',
  },
  {
    id: 'we-shared-list',
    title: 'Cart history without a shared list',
    unitId: 'w1-mutation-references',
    problem: '`items` is a list of item names added to a shopping cart, in order. The cart starts empty. Return a list of what the cart held after each item was added. Each entry is a list.\n\n`cart_history(["milk", "eggs"])` → `[["milk"], ["milk", "eggs"]]`\n`cart_history([])` → `[]`',
    subgoals: [
      {
        title: 'Separate what changes from what you keep',
        explanation: 'The cart changes on every pass. The history is a record that should never change once written. They are two different lists.',
        code: `cart = []
history = []`,
      },
      {
        title: 'Make the change',
        explanation: 'Each item goes into the cart, in place.',
        code: `for item in items:
    cart.append(item)`,
      },
      {
        title: 'Save a copy, not the list itself',
        explanation: '`history.append(cart)` would store the cart list itself, not what it holds right now. Every entry would be a name for the same list. The result for `["milk", "eggs"]` would be `[["milk", "eggs"], ["milk", "eggs"]]`. `cart[:]` takes a snapshot: a new list that later changes cannot touch.',
        code: `    history.append(cart[:])`,
      },
      {
        title: 'Return the record',
        explanation: 'After the loop, `history` holds one separate snapshot per item. An empty `items` never enters the loop and returns `[]`.',
        code: `return history`,
      },
    ],
    solution: `def cart_history(items):
    cart = []
    history = []
    for item in items:
        cart.append(item)
        history.append(cart[:])
    return history
`,
    reconstructionExerciseId: 'c1-ref-rebuild-shared',
  },
]
