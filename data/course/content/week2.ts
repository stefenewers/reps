import type { Lesson, WorkedExample } from '@/data/course/types'

/**
 * Week 2 (Nov 2–8): problem-solving foundations. Lessons teach the Solve Map
 * and its parts; worked examples show one complete solution by subgoals, then
 * the learner rebuilds it (reps in data/exercises/course/week2.ts).
 */

const md = (...lines: string[]) => lines.join('\n')

export const lessons: Lesson[] = [
  {
    id: 'l-solve-map',
    title: 'The Solve Map',
    concept:
      'The Solve Map is nine steps that take you from a prompt you have never seen to code you trust: contract, example, subgoals, state, simple solution, test, improve, implement, verify.',
    mentalModel:
      'A pilot runs the same checklist before every take-off, however experienced. Each step answers one question, and its answer feeds the next. When you are stuck, you have usually skipped a step, not missed a trick.',
    whyItMatters:
      'Most of the time lost on a new problem goes into staring at it, not typing. The map turns "I don\'t know how to start" into "I\'m on step 2". Interviewers also want to hear these steps out loud: they are how a good engineer thinks.',
    sections: [
      {
        heading: 'The nine steps',
        body: md(
          'Each step is one question. Answer it, then move on.',
          '',
          '1. **Contract**: what goes in, what comes out, and what happens at the edges?',
          '2. **Example**: work one small input by hand, on paper.',
          '3. **Subgoals**: what steps did your hands take? Name each one.',
          '4. **State**: what did you have to remember from one step to the next?',
          '5. **Simple solution**: the plainest code that is correct, even if it is slow.',
          '6. **Test**: run the examples and the edge cases from step 1.',
          '7. **Improve**: find work the simple solution repeats, and remove it.',
          '8. **Implement**: write the improved version.',
          '9. **Verify**: run the same tests again, and say the time and space cost.',
          '',
          'Steps 1 to 4 happen before you write real code. They are the steps people skip, and the reason they get stuck.',
        ),
      },
      {
        heading: 'Steps 1 to 4 on a real prompt',
        body: md(
          'The prompt: "`names` is a list of customer names, one per order. Return `True` if any customer ordered twice."',
          '',
          '**1. Contract.** In: a list of strings, maybe empty. Out: a bool, not the name. Edges: an empty list gives `False`. One name gives `False`. A name that appears three times is still just `True`.',
          '',
          "**2. Example.** `['ana', 'bo', 'ana']`. By hand: look at ana, nothing before it. Look at bo, not ana. Look at ana, and ana is before it: `True`.",
          '',
          '**3. Subgoals.** For each name, check whether it appeared earlier. Stop at the first yes. If nothing matched, the answer is no.',
          '',
          '**4. State.** Your eyes kept a position and looked back over everything before it. That is two loops. Or, you could remember the names you have already seen.',
        ),
      },
      {
        heading: 'Steps 5 and 6: simple first, then test',
        body: md(
          'Write the plainest version that follows the subgoals exactly. Then run the example and every edge case from step 1. A correct slow answer is your answer key for anything faster.',
        ),
        code: `def has_repeat(names):
    for i in range(len(names)):
        for j in range(i):
            if names[i] == names[j]:
                return True
    return False

print(has_repeat(['ana', 'bo', 'ana']))
print(has_repeat(['ana', 'bo']))
print(has_repeat([]))
print(has_repeat(['cy']))`,
        output: 'True\nFalse\nFalse\nFalse',
      },
      {
        heading: 'Steps 7 to 9: improve, implement, verify',
        body: md(
          'The repeated work: for every name, the inner loop rescans all the earlier names. Each scan rediscovers what the last one already knew.',
          '',
          'The fix: remember the names you have seen, so checking one costs a single step. Then rerun the same tests. Same answers, and O(n²) time became O(n), at the cost of O(n) space for the set.',
        ),
        code: `def has_repeat(names):
    seen = set()
    for name in names:
        if name in seen:
            return True
        seen.add(name)
    return False

for case in [['ana', 'bo', 'ana'], ['ana', 'bo'], [], ['cy']]:
    print(case, has_repeat(case))`,
        output: "['ana', 'bo', 'ana'] True\n['ana', 'bo'] False\n[] False\n['cy'] False",
      },
      {
        heading: 'When you are stuck',
        body: md(
          'Name the step you are on. Then:',
          '',
          '- **Cannot start?** You skipped step 1 or 2. Write the contract as comments, then do one example by hand.',
          '- **Have an example, but no code?** Say the hand steps out loud (step 3). Each sentence is a few lines.',
          '- **Code is wrong on one case?** Go back to step 1: which edge case did the contract mention that the code ignores?',
          '- **Too slow?** You are at step 7. Find the line that runs the most times, and ask what it keeps recomputing.',
        ),
      },
    ],
    mistakes: [
      'Starting at step 8: typing before you know what the function returns for an empty input.',
      'Skipping the hand example. The subgoals come from what your hands did; without the example there is nothing to turn into code.',
      'Optimizing before there is a correct simple version. A slow correct answer can be improved; a fast wrong one has to be thrown away.',
      'Testing only the example from the prompt. The edge cases from step 1 are the tests that find bugs.',
      'Calling it done without step 9. Improvements break things, so rerun the tests after every change.',
    ],
  },
  {
    id: 'l-contract',
    title: 'The contract',
    concept:
      "A function's contract is what it takes, what it returns, and what it does at the edges. You can write it down before you write any code.",
    mentalModel:
      'A contract is the label on a box: what you may put in and what you get back. The edge cases are the fine print: an empty box, two identical items, nothing that matches.',
    whyItMatters:
      'Most wrong answers on small problems are not wrong algorithms. They are a missed rule: an empty list that crashes, a tie broken the wrong way, `None` where `-1` was asked for. The contract is where those rules live, and reading it slowly is cheaper than debugging.',
    sections: [
      {
        heading: 'Inputs: what each one is',
        body: md(
          'For every input, answer four questions:',
          '',
          '- **Type**: a list, a dict, a string, a number?',
          '- **One item**: what does a single element look like? A number, a `(name, price)` pair, a `\'HH:MM\'` string?',
          '- **Can it be empty?** Assume yes unless the prompt says otherwise.',
          '- **Promises**: is it sorted? Can values repeat? Can they be negative or zero?',
          '',
          'If the prompt does not promise something, your code cannot rely on it.',
        ),
      },
      {
        heading: 'Output: type and shape',
        body: md(
          'Say exactly what comes back. A number or an index? A list, and in what order? A dict? A bool? An int or a float?',
          '',
          'The type is part of the answer: `85` and `85.0` print differently, and a set never equals a list.',
        ),
        code: `def average(scores):
    if len(scores) == 0:
        return 0.0
    return sum(scores) / len(scores)

print(average([3, 4]))
print(average([]))
print(type(average([2, 2])))`,
        output: "3.5\n0.0\n<class 'float'>",
      },
      {
        heading: 'The edge-case checklist',
        body: md(
          'Run down this list for every prompt. Each line is a question the contract must answer:',
          '',
          '- **Empty input**: `[]`, `{}`, `\'\'`.',
          '- **One item**: nothing to compare it with.',
          '- **Duplicates**: all the same, or the best value appearing twice.',
          '- **A tie**: which one wins? The first, the last, or the alphabetically first?',
          '- **Nothing matches**: what comes back? `-1`, `None`, `\'\'` or `[]`?',
          '- **Exactly on a boundary**: is 50 "over 50"? Read `more than` versus `at least` word by word.',
          '- **Zero and negatives**: does a best-so-far that starts at 0 still work?',
          '- **First and last position**: loops that start at 1 or stop early miss these.',
        ),
      },
      {
        heading: 'Write the examples before the code',
        body: md(
          'Turn the edge cases into `(input, answer)` pairs before you write the function. Each pair is a decision made in advance, and later each one is a test.',
          '',
          'The prompt: "`sales` is a list of daily totals. Return the index of the best day. On a tie, the earlier day. Empty returns `-1`."',
        ),
        code: `def best_day(sales):
    if len(sales) == 0:
        return -1
    best = 0
    for i in range(1, len(sales)):
        if sales[i] > sales[best]:
            best = i
    return best

examples = [
    ([120, 340, 90], 1),
    ([120, 340, 90, 340], 1),
    ([], -1),
    ([50], 0),
]
for sales, want in examples:
    print(sales, best_day(sales), best_day(sales) == want)`,
        output: '[120, 340, 90] 1 True\n[120, 340, 90, 340] 1 True\n[] -1 True\n[50] 0 True',
      },
    ],
    mistakes: [
      'Answering a different question: returning the best value when the task asked for its index.',
      'Using `>=` where the contract says "more than", or `>` where it says "at least". Read boundaries word by word.',
      'Returning `None` when the contract says `-1`, or `[]` when it says `\'\'`.',
      'Breaking a tie the wrong way. A strict `>` keeps the first best; `>=` keeps the last.',
      'Assuming the input is sorted, non-empty or free of repeats when the prompt never said so.',
    ],
  },
  {
    id: 'l-manual',
    title: 'Solve it by hand first',
    concept:
      'Before writing code, solve a small example by hand and write down every step. The steps you took become the subgoals. The things you had to remember become your variables.',
    mentalModel:
      'You are the computer. Work the example in a table: one row per item, one column per thing you keep track of. The table is the program, written sideways.',
    whyItMatters:
      '"I don\'t know how to start" usually means "I haven\'t watched myself do it". You can already solve most small problems with a pencil. Watching how you do it tells you what the loop must do, in what order, and what it must remember.',
    sections: [
      {
        heading: 'Pick a small, honest example',
        body: md(
          'Use 4 to 6 items. Make sure the example contains the interesting part: a tie, a reset, a group that ends at the very end. `[5]` is too small to show anything.',
          '',
          'The prompt for this lesson: "`weights` is a list of people waiting for a lift, in order. The lift carries at most `capacity` kg. People board in order. When the next person would make it too heavy, the lift leaves and comes back empty. Return how many trips it makes."',
        ),
      },
      {
        heading: 'One row per step',
        body: md(
          'Write a row each time you look at a new person. Columns: the person, the load after they board, and the trips so far. The code below prints exactly the table you would write by hand.',
          '',
          'The columns that carry from row to row (`load`, `trips`) are your **state**. The value you look at once and then forget (`w`) is the loop variable.',
        ),
        code: `weights = [70, 80, 60, 90]
capacity = 160
load = 0
trips = 0
for w in weights:
    if load + w > capacity:
        trips += 1
        load = 0
    load += w
    print(w, load, trips)
if load > 0:
    trips += 1
print('trips:', trips)`,
        output: '70 70 0\n80 150 0\n60 60 1\n90 150 1\ntrips: 2',
      },
      {
        heading: 'Name the subgoals',
        body: md(
          'Say each kind of step in one sentence:',
          '',
          '1. **Fits**: the person boards, and the load goes up.',
          '2. **Does not fit**: the lift leaves (one more trip) and comes back empty. Then the person boards.',
          '3. **After the last person**: if anyone is still on board, that is one more trip.',
          '',
          'Step 3 is the one people forget. Nothing in the loop triggers it, because no next person comes along. A hand table makes it obvious: the last row still has people in the lift.',
          '',
          'Each subgoal also raises an edge case. An empty list: 0 trips. One person: 1 trip.',
        ),
      },
      {
        heading: 'Subgoals can become helpers',
        body: md(
          'When a step has a clear name, give it a function. A helper can be tested on its own, and the main function then reads like your hand steps.',
        ),
        code: `def fits(load, weight, capacity):
    return load + weight <= capacity

def count_trips(weights, capacity):
    load = 0
    trips = 0
    for w in weights:
        if not fits(load, w, capacity):
            trips += 1
            load = 0
        load += w
    if load > 0:
        trips += 1
    return trips

print(count_trips([70, 80, 60, 90], 160))
print(count_trips([], 160))
print(count_trips([100, 100, 100], 160))`,
        output: '2\n0\n3',
      },
    ],
    mistakes: [
      'Using an example too small to show anything. `[5]` has no tie, no reset and no last group.',
      'Doing the steps in your head instead of on paper. The step you skip in your head is the one you forget in code.',
      'Forgetting the step after the loop: the last run, group or load that never met a change to trigger it.',
      'Missing a column. If you had to look back at an earlier row to decide, that value is state and needs a variable.',
      'Writing one long function when the hand steps had clear names. A named helper is easier to read and to test.',
    ],
  },
  {
    id: 'l-testing',
    title: 'Test your own code',
    concept:
      'A test is an input plus the answer the contract promises. Testing your own code means picking the inputs most likely to break it, running them, and trusting the result over your confidence.',
    mentalModel:
      'Be the bug hunter, not the defence lawyer. Do not ask "does it work?". Ask "where would a bug hide?": at boundaries, at empty and one-item inputs, at ties and repeats, at the first and last positions.',
    whyItMatters:
      'Interviewers watch whether you test before you say "done". Most bugs in small functions show up on three or four well-chosen inputs, and finding them yourself is the difference between a pass and a near miss.',
    sections: [
      {
        heading: 'assert: a test in one line',
        body: md(
          '`assert condition` does nothing when the condition is true. When it is false, it raises an `AssertionError` and stops. A list of asserts is a test.',
          '',
          'The expected value comes from the contract, worked by hand. Never from running the code you are testing.',
        ),
        code: `def ships_free(total):
    return total >= 50

assert ships_free(80) == True
assert ships_free(20) == False
assert ships_free(50) == True
print('all tests passed')`,
        output: 'all tests passed',
      },
      {
        heading: 'Where bugs hide',
        body: md(
          'Choose inputs from this list before anything else:',
          '',
          '- **The boundary**: exactly 50 when the rule is "50 or more".',
          '- **Empty and one item**: code that reads `items[0]` or compares neighbours.',
          '- **Repeats and ties**: the best value twice, every value the same.',
          '- **The ends**: the answer at the first position, and at the last.',
          '- **Order**: the same values sorted up, sorted down, and mixed.',
          '',
          'The example in the prompt is the least useful test. The code was written for it, so it almost always passes.',
        ),
      },
      {
        heading: 'Think like the bug: a breaking input',
        body: md(
          'To find a bug, look for the input the code was not written for. This function reads `counts[0]` before checking the length, so the empty list is the input to try.',
        ),
        code: `def lowest(counts):
    lowest = counts[0]
    for c in counts:
        if c < lowest:
            lowest = c
    return lowest

for case in [[4, 2, 9], [7], []]:
    try:
        print(case, lowest(case))
    except IndexError as e:
        print(case, 'crashed:', e)`,
        output: '[4, 2, 9] 2\n[7] 7\n[] crashed: list index out of range',
      },
      {
        heading: 'A test as a function',
        body: md(
          'Put the asserts in a function that takes the function under test as an argument. Then one test can check a right version and a wrong one. A good test passes the first and fails the second.',
        ),
        code: `def test_count_late(count_late):
    assert count_late([1, 5, 9], 4) == 2
    assert count_late([4, 4], 4) == 0
    assert count_late([], 4) == 0

def right(days, limit):
    n = 0
    for d in days:
        if d > limit:
            n += 1
    return n

def wrong(days, limit):
    n = 0
    for d in days:
        if d >= limit:
            n += 1
    return n

test_count_late(right)
print('right version passes')
try:
    test_count_late(wrong)
except AssertionError:
    print('wrong version caught')`,
        output: 'right version passes\nwrong version caught',
      },
    ],
    mistakes: [
      'Testing only the example from the prompt. It is the case the code was written for.',
      'Getting the expected answer by running your own code. The expected value comes from the contract, worked by hand.',
      'Skipping the boundary: testing 20 and 80 but never exactly 50.',
      'Saying "it works" after one green run, without an empty input, one item or a tie.',
      'Changing the test to match the code when they disagree, instead of asking which one the contract supports.',
    ],
  },
  {
    id: 'l-improve',
    title: 'Brute force, then improve',
    concept:
      'First write the simplest correct solution, even if it is slow. Then find the work it repeats, and change the code so that work happens once.',
    mentalModel:
      'Cooking from a recipe, you could walk to the fridge for every ingredient. Faster: carry what you need once. The brute force walks to the fridge each time; improving it means noticing the walks and remembering what you already fetched.',
    whyItMatters:
      'A correct slow answer beats a fast wrong one, and it gives you an answer key to test the fast one against. In interviews you are expected to name the brute force, its cost, and the repeated work you would remove.',
    sections: [
      {
        heading: 'Start with brute force',
        body: md(
          'The prompt: "`customers` is a list of names, one per order. Count the orders from a customer who had ordered before."',
          '',
          'The simplest version follows the hand steps: for each order, look back at every earlier order. The code also counts how many comparisons it makes.',
        ),
        code: `def repeat_orders(customers):
    count = 0
    checks = 0
    for i in range(len(customers)):
        for j in range(i):
            checks += 1
            if customers[j] == customers[i]:
                count += 1
                break
    return count, checks

print(repeat_orders(['ana', 'bo', 'ana', 'cy', 'bo']))`,
        output: '(2, 7)',
      },
      {
        heading: 'Count the work',
        body: md(
          'With all different names, order number `i` looks back at `i` earlier orders. The total grows with the square of the input: ten times the orders, about a hundred times the work. That is **O(n²)**.',
        ),
        code: `for n in [10, 100, 1000]:
    checks = 0
    for i in range(n):
        for j in range(i):
            checks += 1
    print(n, checks)`,
        output: '10 45\n100 4950\n1000 499500',
      },
      {
        heading: 'Find the repeated work',
        body: md(
          'Order 5 rescans orders 1 to 4. Order 6 rescans orders 1 to 5. Every scan rediscovers what the last one already found, plus one new name.',
          '',
          'Ask two questions. What did the inner loop find out? Could I have kept that, instead of finding it again? Here the inner loop only answers "has this name appeared before?", and a set can answer that in one step.',
        ),
      },
      {
        heading: 'Remember instead of rescanning',
        body: md(
          'Keep the names seen so far. Each order is now one lookup and one add. Same answers, O(n) time, and O(n) extra space for the set.',
        ),
        code: `def repeat_orders(customers):
    seen = set()
    count = 0
    for name in customers:
        if name in seen:
            count += 1
        seen.add(name)
    return count

print(repeat_orders(['ana', 'bo', 'ana', 'cy', 'bo']))
print(repeat_orders([]))`,
        output: '2\n0',
      },
      {
        heading: 'Precompute what does not change',
        body: md(
          'The other common repeat: computing the same value inside a loop. `sum(scores)` is itself a loop, so calling it for every score makes the code O(n²). The average never changes, so compute it once, before the loop.',
        ),
        code: `scores = [60, 80, 100]
avg = sum(scores) / len(scores)
above = 0
for s in scores:
    if s > avg:
        above += 1
print(avg, above)`,
        output: '80.0 1',
      },
    ],
    mistakes: [
      'Skipping the brute force because "it won\'t be fast enough". Write it first; it is your answer key.',
      'Improving the wrong part. Find the line that runs the most times, usually inside the inner loop.',
      'Computing something inside a loop that never changes there, like `sum(scores)` or `len(items)` of a growing copy.',
      'Not rerunning the tests after improving. Faster code that changed the answer is a new bug.',
      'Forgetting the space cost. A set or dict of n items is O(n) extra memory. Say it.',
    ],
  },
]

export const workedExamples: WorkedExample[] = [
  {
    id: 'we-contract',
    title: 'Contract first: the best sales day',
    unitId: 'w2-contract',
    problem: '`sales` is a list of daily sales totals, one per day. Return the index of the day with the highest sales. On a tie, return the earlier day. An empty list returns `-1`.',
    subgoals: [
      {
        title: 'Write the contract down',
        explanation:
          'In: a list of numbers, maybe empty, maybe with repeats or negatives. Out: an index (an int), not the sales value. Edges: empty gives -1, one day gives 0, a tie gives the earlier day. Three comment lines, and the rules are decided before any code.',
        code: `# best_day(sales)
# in:  list of numbers (can be empty, can repeat, can be negative)
# out: index of the highest; the earlier day on a tie; -1 if empty`,
      },
      {
        title: 'Turn the edge cases into examples',
        explanation: 'One example per rule. These become the tests later, and writing them now forces each decision.',
        code: `examples = [
    ([120, 340, 90], 1),        # normal
    ([120, 340, 90, 340], 1),   # tie: the earlier day
    ([], -1),                   # empty
    ([50], 0),                  # one day
]`,
      },
      {
        title: 'Handle the edge case first',
        explanation: 'The empty list has no day 0 to start from, so it is answered before the loop. Everything after this line can assume at least one day.',
        code: `if len(sales) == 0:
    return -1`,
      },
      {
        title: 'Scan, keeping the best index',
        explanation:
          'Keep the index, not the value: the contract returns an index. Compare with `>`, not `>=`. An equal later day must not replace the earlier one. Starting at day 0 means negative totals work too.',
        code: `best = 0
for i in range(1, len(sales)):
    if sales[i] > sales[best]:
        best = i
return best`,
      },
    ],
    solution: `def best_day(sales):
    # in:  list of numbers (can be empty, can repeat, can be negative)
    # out: index of the highest; the earlier day on a tie; -1 if empty
    if len(sales) == 0:
        return -1
    best = 0
    for i in range(1, len(sales)):
        if sales[i] > sales[best]:
            best = i
    return best`,
    reconstructionExerciseId: 'c2-contract-rebuild',
  },
  {
    id: 'we-manual',
    title: 'By hand first: compress a string',
    unitId: 'w2-manual',
    problem: "`s` is a string. Return a compressed version: each run of the same letter becomes the letter followed by how long the run is. `'aaabcc'` becomes `'a3b1c2'`. An empty string returns `''`.",
    subgoals: [
      {
        title: 'Work the example by hand, in a table',
        explanation:
          'One row per letter. The columns are what you had to keep in mind: the letter of the current run, how long it is, and the pieces written so far. The last row is outside the loop: the final run still has to be written.',
        code: `# ch   current  count  pieces
# a    a        1      []
# a    a        2      []
# a    a        3      []
# b    b        1      ['a3']
# c    c        1      ['a3', 'b1']
# c    c        2      ['a3', 'b1']
# end                  ['a3', 'b1', 'c2']`,
      },
      {
        title: 'Name the state, and the edge case it raises',
        explanation:
          'Three columns carried from row to row, so three variables: `current`, `count` and `pieces`. Starting `current` at `s[0]` needs at least one letter, so the empty string is answered first.',
        code: `if s == '':
    return ''
pieces = []
current = s[0]
count = 0`,
      },
      {
        title: 'Write the two kinds of row',
        explanation:
          'In the table there were only two kinds of step. Same letter: the count goes up. New letter: write down the old run, then start a new run of length 1.',
        code: `for ch in s:
    if ch == current:
        count += 1
    else:
        pieces.append(current + str(count))
        current = ch
        count = 1`,
      },
      {
        title: 'Do not forget the end',
        explanation:
          'A run is only written when a new letter arrives. The last run never sees one, so it is written after the loop. This is the row the table showed and the loop alone would miss.',
        code: `pieces.append(current + str(count))
return ''.join(pieces)`,
      },
    ],
    solution: `def compress(s):
    if s == '':
        return ''
    pieces = []
    current = s[0]
    count = 0
    for ch in s:
        if ch == current:
            count += 1
        else:
            pieces.append(current + str(count))
            current = ch
            count = 1
    pieces.append(current + str(count))
    return ''.join(pieces)`,
    reconstructionExerciseId: 'c2-manual-rebuild',
  },
  {
    id: 'we-improve',
    title: 'Brute force, then improve: the first repeated ticket',
    unitId: 'w2-improve',
    problem: '`ids` is a list of ticket ids in the order they were scanned. Return the first id that is scanned a second time: the repeat that happens earliest. If nothing repeats, return `None`.',
    subgoals: [
      {
        title: 'Simple solution: look back each time',
        explanation:
          'By hand: for each scan, check whether that id appeared earlier. The first yes is the answer. This is correct and easy to trust. For the scan at position `j` it looks at `j` earlier ids, so the total is O(n²).',
        code: `def first_repeat_slow(ids):
    for j in range(len(ids)):
        if ids[j] in ids[:j]:
            return ids[j]
    return None`,
      },
      {
        title: 'Find the repeated work',
        explanation:
          'At position 5 the slice rescans positions 0 to 4. At position 6 it rescans 0 to 5. Each step re-reads everything the last step read, and learns only one new id. The question it keeps asking is "have I seen this id before?".',
      },
      {
        title: 'Remember what you have seen',
        explanation:
          'Keep the ids already scanned in a set. Checking a set is one step. Check first, then add: otherwise every id would find itself.',
        code: `seen = set()
for x in ids:
    if x in seen:
        return x
    seen.add(x)
return None`,
      },
      {
        title: 'Verify: same answers, lower cost',
        explanation:
          'Run both versions on the same inputs, including the edge cases. They must agree. Then state the cost: O(n) time instead of O(n²), paid for with O(n) space for the set.',
        code: `for case in [[4, 7, 2, 7, 4], [1, 2, 3], [], [5, 5]]:
    assert first_repeat(case) == first_repeat_slow(case)`,
      },
    ],
    solution: `def first_repeat(ids):
    seen = set()
    for x in ids:
        if x in seen:
            return x
        seen.add(x)
    return None`,
    reconstructionExerciseId: 'c2-improve-rebuild',
  },
]
