import type { Section } from '@/lib/types'
import { debug, fill, output, t, write } from '@/data/exercises/build'

/**
 * Reps 2.0, Week 1: execution, state, while loops, loop control, running
 * state, mutation and references, decomposition, and the four Week 1 gates.
 * Lessons and worked examples live in data/course/content/week1.ts.
 */

export const sections: Section[] = [
  // ───────────────────────────── State ─────────────────────────────
  {
    id: 'c1-state',
    title: 'State',
    summary: 'What a program remembers, and how one line changes it.',
    exercises: [
      output({
        id: 'c1-state-predict',
        title: 'Trace: a bank balance',
        skills: ['accumulator'],
        prompt: 'Lines run top to bottom, one at a time. A variable keeps its newest value until a line changes it.\n\nPredict the output.',
        code: `balance = 100
deposit = 40
balance = balance + deposit
deposit = 10
print(balance, deposit)
balance = balance - deposit
print(balance)`,
        expectedOutput: '140 10\n130',
        note: '**State** is information the program remembers because something later depends on it. `balance = balance + deposit` reads the old `balance`, adds, then stores the new value back in the same name.',
        explanation: 'Line 3 makes balance 140. Line 4 changes deposit to 10 but leaves balance alone. Line 6 uses the new deposit: 140 - 10 = 130.',
        signature: 'trace:state-reassign',
      }),
      output({
        id: 'c1-state-table',
        title: 'Trace: a table of steps',
        skills: ['accumulator', 'for_loop'],
        prompt: 'Draw a table on paper with one column per variable: `s`, `total`, `days`. Add a row after each pass of the loop. `//` divides and drops the remainder.\n\nPredict the output.',
        code: `steps = [3000, 4500, 2000]
total = 0
days = 0
for s in steps:
    total = total + s
    days = days + 1
    print(days, total)
print("average:", total // days)`,
        expectedOutput: '1 3000\n2 7500\n3 9500\naverage: 3166',
        note: 'A variable table is the most useful habit in this course. One column per variable, one row per pass. When code surprises you, the table shows the exact line where your picture and the program split.',
        explanation: '`total` and `days` survive from one pass to the next because they were made before the loop. 9500 // 3 is 3166.',
        signature: 'trace:state-table',
      }),
      fill({
        id: 'c1-state-counter',
        title: 'Fill: count the good days',
        skills: ['accumulator', 'conditionals'],
        prompt: '`steps` is a list of step counts, one per day. `goal` is a number. `days_over_goal(steps, goal)` returns how many days had at least `goal` steps.\n\n`days_over_goal([8000, 12000, 10000], 10000)` → `2`\n\nFill in the two blanks.',
        starterCode: `def days_over_goal(steps, goal):
    count = ____
    for s in steps:
        if s >= goal:
            count = ____
    return count
`,
        solution: `def days_over_goal(steps, goal):
    count = 0
    for s in steps:
        if s >= goal:
            count = count + 1
    return count
`,
        tests: [
          t.eq('days_over_goal([8000, 12000, 10000], 10000)', '2'),
          t.eq('days_over_goal([500, 700], 1000)', '0'),
          t.eq('days_over_goal([1000, 1000, 1000], 1000)', '3'),
          t.hidden('days_over_goal([], 5000)', '0'),
          t.hidden('days_over_goal([9999], 10000)', '0'),
        ],
        hints: ['A count starts at nothing counted yet.', 'Each good day adds one to the old count.'],
        signature: 'state:counter-fill',
      }),
      write({
        id: 'c1-state-swap',
        title: 'Swap two drinks',
        style: 'finish',
        skills: ['state_tracking'],
        prompt: '`left` holds `"coffee"` and `right` holds `"tea"`. Swap them, so `left` is `"tea"` and `right` is `"coffee"`.\n\nThe two lines `left = right` and `right = left` do not work. After the first one, the old value of `left` is gone. Save it in a third variable first.',
        note: 'A swap needs one extra piece of state: the value you are about to overwrite. Python also has a one-line swap, `left, right = right, left`, which saves both values for you before assigning.',
        starterCode: `left = "coffee"
right = "tea"
# swap them here

print(left, right)
`,
        solution: `left = "coffee"
right = "tea"
old_left = left
left = right
right = old_left

print(left, right)
`,
        tests: [t.check('left is now "tea"', 'assert left == "tea", left'), t.check('right is now "coffee"', 'assert right == "coffee", right')],
        hints: ['Save `left` in `old_left` before you change it.', 'Then `left = right`, then `right = old_left`.'],
        signature: 'state:swap-two',
        minutes: 2,
      }),
      write({
        id: 'c1-state-overdrawn',
        title: 'Count overdrawn moments',
        skills: ['accumulator', 'conditionals'],
        prompt: '`start` is a bank balance. `changes` is a list of amounts added to it in order. A negative amount is money taken out.\n\nApply the changes one by one. Return how many times the balance was below 0 right after a change.\n\n`count_overdrawn(50, [-20, -40, 30, -50])` → `2` (balances 30, -10, 20, -30)\n`count_overdrawn(10, [])` → `0` (no changes)',
        note: 'Two pieces of state here: the balance, which every change updates, and the count, which only some changes update.',
        starterCode: `def count_overdrawn(start, changes):
    pass
`,
        solution: `def count_overdrawn(start, changes):
    balance = start
    count = 0
    for change in changes:
        balance = balance + change
        if balance < 0:
            count = count + 1
    return count
`,
        tests: [
          t.eq('count_overdrawn(50, [-20, -40, 30, -50])', '2'),
          t.eq('count_overdrawn(10, [])', '0'),
          t.eq('count_overdrawn(0, [-5, -5])', '2'),
          t.hidden('count_overdrawn(-10, [10])', '0'),
          t.hidden('count_overdrawn(100, [-100, -1, 1])', '1'),
        ],
        hints: ['Keep `balance` and `count`, both made before the loop.', 'Update the balance first, then check it.'],
        signature: 'state:balance-and-count',
        minutes: 4,
      }),
      debug({
        id: 'c1-state-dbg-reset',
        title: 'Debug: the total keeps forgetting',
        skills: ['accumulator', 'for_loop'],
        prompt: '`purchases` is a list of amounts spent. `total_spent(purchases)` should return their sum, and `0` for an empty list.\n\n`total_spent([12, 5, 8])` → `25`\n\nIt returns the wrong answer, and crashes on an empty list. Fix it.',
        brokenCode: `def total_spent(purchases):
    for p in purchases:
        total = 0
        total = total + p
    return total
`,
        solution: `def total_spent(purchases):
    total = 0
    for p in purchases:
        total = total + p
    return total
`,
        tests: [t.eq('total_spent([12, 5, 8])', '25'), t.eq('total_spent([])', '0'), t.eq('total_spent([7])', '7'), t.hidden('total_spent([1, 1, 1, 1])', '4'), t.hidden('total_spent([-3, 3])', '0')],
        hints: ['Trace it with a table. What is `total` at the start of the second pass?', 'State that must survive every pass is created once, before the loop.'],
        explanation: 'Setting total = 0 inside the loop wipes the memory on every pass. Only the last purchase survives. Created before the loop, it remembers everything.',
        signature: 'debug:state-reset-in-loop',
      }),
    ],
  },

  // ───────────────────────────── While loops ─────────────────────────────
  {
    id: 'c1-while',
    title: 'While loops',
    summary: 'State, check, do work, change state, check again.',
    exercises: [
      output({
        id: 'c1-while-trace-savings',
        title: 'Trace: saving up',
        skills: ['while_loop', 'accumulator'],
        prompt: 'A `while` loop checks its condition. If it is true, the body runs once, then it checks again. When the condition is false, the program moves on to the line after the loop.\n\nPredict the output.',
        code: `savings = 0
week = 0
while savings < 100:
    week = week + 1
    savings = savings + 30
    print("week", week, "savings", savings)
print("done after", week, "weeks")`,
        expectedOutput: 'week 1 savings 30\nweek 2 savings 60\nweek 3 savings 90\nweek 4 savings 120\ndone after 4 weeks',
        note: 'Every while loop is the same cycle: **STATE → CHECK → DO WORK → CHANGE STATE → CHECK AGAIN.** Here the state is `savings` and `week`, the check is `savings < 100`, and the change is `savings + 30`.',
        explanation: 'After week 3, savings is 90 and 90 < 100 is still true, so the body runs a fourth time. After week 4, 120 < 100 is false and the loop ends.',
        signature: 'trace:while-accumulate',
      }),
      output({
        id: 'c1-while-trace-check-top',
        title: 'Trace: when the check happens',
        skills: ['while_loop'],
        prompt: 'The condition is checked only at the top of the loop, before each pass. It is not checked in the middle of the body.\n\nPredict the output.',
        code: `n = 3
while n > 0:
    print("n is", n)
    n = n - 1
    print("now", n)
print("after", n)`,
        expectedOutput: 'n is 3\nnow 2\nn is 2\nnow 1\nn is 1\nnow 0\nafter 0',
        explanation: '"now 0" prints even though n > 0 is already false at that moment. The body finishes its pass first. The check happens at the top of the next pass.',
        signature: 'trace:while-check-at-top',
      }),
      fill({
        id: 'c1-while-fill-change',
        title: 'Fill: the missing change',
        skills: ['while_loop', 'accumulator'],
        prompt: '`goal` is an amount to save. `per_week` is how much you save each week, and it is at least 1. `weeks_to_goal(goal, per_week)` returns how many weeks it takes to have at least `goal` saved.\n\n`weeks_to_goal(100, 30)` → `4`\n\nThe loop is missing its state change. Fill in the blank.',
        starterCode: `def weeks_to_goal(goal, per_week):
    saved = 0
    weeks = 0
    while saved < goal:
        ____
        weeks = weeks + 1
    return weeks
`,
        solution: `def weeks_to_goal(goal, per_week):
    saved = 0
    weeks = 0
    while saved < goal:
        saved = saved + per_week
        weeks = weeks + 1
    return weeks
`,
        tests: [t.eq('weeks_to_goal(100, 30)', '4'), t.eq('weeks_to_goal(90, 30)', '3'), t.eq('weeks_to_goal(0, 10)', '0'), t.hidden('weeks_to_goal(1, 50)', '1'), t.hidden('weeks_to_goal(250, 25)', '10')],
        hints: ['Which variable does the condition read?', 'That variable has to change on every pass.'],
        note: 'Look at the condition, `saved < goal`. If nothing in the body changes `saved`, the answer to the check never changes, and the loop never ends.',
        signature: 'while:fill-state-change',
      }),
      write({
        id: 'c1-while-rebuild-countdown',
        title: 'Rebuild: countdown',
        stage: 'reconstruct',
        skills: ['while_loop', 'list_append'],
        prompt: '`n` is a whole number. Return a list that counts down from `n` to `1`. If `n` is 0 or less, return an empty list.\n\nUse a while loop. Write it from a blank editor.\n\n`countdown(3)` → `[3, 2, 1]`\n`countdown(0)` → `[]` (nothing to count)',
        starterCode: '',
        solution: `def countdown(n):
    said = []
    current = n
    while current >= 1:
        said.append(current)
        current = current - 1
    return said
`,
        tests: [t.eq('countdown(3)', '[3, 2, 1]'), t.eq('countdown(0)', '[]'), t.eq('countdown(1)', '[1]'), t.hidden('countdown(-2)', '[]'), t.hidden('countdown(6)', '[6, 5, 4, 3, 2, 1]')],
        hints: ['State: the number you are on, and the list so far.', 'Check, append, change the number, check again.'],
        signature: 'while:countdown-list',
        minutes: 4,
        important: true,
      }),
      write({
        id: 'c1-while-countdown-by',
        title: 'Count down by steps',
        skills: ['while_loop', 'list_append'],
        prompt: '`start` is a whole number, 0 or more. `step` is how much to subtract each time, and it is at least 1.\n\nStart at `start`. Keep subtracting `step`. Return a list of every number you land on, starting with `start`. Stop before a number would go below 0.\n\n`countdown_by(10, 3)` → `[10, 7, 4, 1]` (the next one, -2, is below 0)\n`countdown_by(0, 5)` → `[0]`',
        starterCode: `def countdown_by(start, step):
    pass
`,
        solution: `def countdown_by(start, step):
    landed = []
    current = start
    while current >= 0:
        landed.append(current)
        current = current - step
    return landed
`,
        tests: [t.eq('countdown_by(10, 3)', '[10, 7, 4, 1]'), t.eq('countdown_by(0, 5)', '[0]'), t.eq('countdown_by(6, 2)', '[6, 4, 2, 0]'), t.hidden('countdown_by(4, 10)', '[4]'), t.hidden('countdown_by(3, 1)', '[3, 2, 1, 0]')],
        hints: ['Same shape as the countdown. What changes is the check and the step.', 'Keep going while the number is 0 or more.'],
        signature: 'while:countdown-step',
        minutes: 4,
      }),
      write({
        id: 'c1-while-halve-steps',
        title: 'Clearance sale',
        skills: ['while_loop', 'accumulator'],
        prompt: '`price` is a whole number, 0 or more. `k` is a whole number, at least 1. Each day of a sale, the price is cut in half and rounded down: `price // 2`.\n\nReturn how many days pass until the price is below `k`. If it is already below `k`, return `0`.\n\n`days_until_below(100, 10)` → `4` (100 → 50 → 25 → 12 → 6)\n`days_until_below(5, 10)` → `0` (already below)',
        starterCode: `def days_until_below(price, k):
    pass
`,
        solution: `def days_until_below(price, k):
    days = 0
    while price >= k:
        price = price // 2
        days = days + 1
    return days
`,
        tests: [t.eq('days_until_below(100, 10)', '4'), t.eq('days_until_below(5, 10)', '0'), t.eq('days_until_below(10, 10)', '1'), t.hidden('days_until_below(1, 1)', '1'), t.hidden('days_until_below(1000, 1)', '10')],
        hints: ['Keep going while the price is still `k` or more.', 'Each pass: halve the price, count one day.'],
        signature: 'while:halve-until-below',
        minutes: 4,
      }),
      debug({
        id: 'c1-while-dbg-stuck',
        title: 'Debug: the run that never ends',
        skills: ['while_loop'],
        prompt: '`distance` is how far a runner wants to go. `lap` is the length of one lap, at least 1. `laps_to_finish(distance, lap)` should return how many laps it takes to cover at least `distance`.\n\n`laps_to_finish(1000, 400)` → `3`\n\nIt never finishes on some inputs. Fix it.',
        brokenCode: `def laps_to_finish(distance, lap):
    laps = 0
    remaining = distance
    while remaining > 0:
        laps = laps + 1
        distance = distance - lap
    return laps
`,
        solution: `def laps_to_finish(distance, lap):
    laps = 0
    remaining = distance
    while remaining > 0:
        laps = laps + 1
        remaining = remaining - lap
    return laps
`,
        tests: [t.eq('laps_to_finish(1000, 400)', '3'), t.eq('laps_to_finish(800, 400)', '2'), t.eq('laps_to_finish(0, 400)', '0'), t.hidden('laps_to_finish(1, 400)', '1'), t.hidden('laps_to_finish(400, 1)', '400')],
        hints: ['Which variable does the condition check?', 'Does the body ever change that variable?'],
        explanation: 'The check reads `remaining`, but the body changed `distance`. The answer to the check could never change. The fix is to change the state the check depends on.',
        signature: 'debug:while-wrong-state-changes',
      }),
      debug({
        id: 'c1-while-dbg-boundary',
        title: 'Debug: one stop short',
        skills: ['while_loop', 'conditionals'],
        prompt: 'A road is `distance` km long. A bus stop goes at km 0 and then every `gap` km, as long as it is still on the road. A stop exactly at the end counts. `gap` is at least 1.\n\n`bus_stops(10, 5)` → `3` (stops at 0, 5 and 10)\n\n`bus_stops(distance, gap)` should return how many stops there are. It is wrong for some roads. Fix it.',
        brokenCode: `def bus_stops(distance, gap):
    stops = 0
    km = 0
    while km < distance:
        stops = stops + 1
        km = km + gap
    return stops
`,
        solution: `def bus_stops(distance, gap):
    stops = 0
    km = 0
    while km <= distance:
        stops = stops + 1
        km = km + gap
    return stops
`,
        tests: [t.eq('bus_stops(10, 5)', '3'), t.eq('bus_stops(12, 5)', '3'), t.eq('bus_stops(0, 5)', '1'), t.hidden('bus_stops(4, 5)', '1'), t.hidden('bus_stops(3, 1)', '4')],
        hints: ['Trace `bus_stops(10, 5)`. What is `km` when the loop stops?', 'Should a stop at exactly `km == distance` be counted?'],
        explanation: '`<` leaves out the boundary value. Whenever a loop condition compares with a limit, ask out loud: is the limit itself included?',
        signature: 'debug:while-boundary',
      }),
    ],
  },

  // ───────────────────────────── Loop control ─────────────────────────────
  {
    id: 'c1-loop-control',
    title: 'Loop control',
    summary: 'Walk a list by index, stop early, and know which exit you took.',
    exercises: [
      output({
        id: 'c1-loop-trace-index',
        title: 'Trace: walking by index',
        skills: ['while_loop', 'list_index'],
        prompt: '`i` is an **index**: a position in the list. The first item is at index 0.\n\nPredict the output. Pay attention to the last line.',
        code: `temps = [12, 15, 9, 20]
i = 0
while i < len(temps):
    print(i, temps[i])
    i = i + 1
print("stopped at", i)`,
        expectedOutput: '0 12\n1 15\n2 9\n3 20\nstopped at 4',
        note: '`while i < len(temps):` is the guard that keeps `temps[i]` safe. The last valid index is `len(temps) - 1`. When `i` reaches `len(temps)`, the check fails, and the loop ends before reading past the end.',
        explanation: 'After the last pass, i becomes 4, which is len(temps). 4 < 4 is false, so the loop stops. i is left one past the last index.',
        signature: 'trace:while-index-walk',
      }),
      fill({
        id: 'c1-loop-fill-scan',
        title: 'Fill: scan to the first hot day',
        skills: ['while_loop', 'list_index'],
        prompt: '`temps` is a list of daily temperatures. `first_hot_day(temps, hot)` returns the index of the first day that is at least `hot`. If there is none, it returns `-1`.\n\n`first_hot_day([18, 22, 31, 35], 30)` → `2`\n\nFill in the blank.',
        starterCode: `def first_hot_day(temps, hot):
    i = 0
    while i < len(temps) and ____:
        i = i + 1
    if i == len(temps):
        return -1
    return i
`,
        solution: `def first_hot_day(temps, hot):
    i = 0
    while i < len(temps) and temps[i] < hot:
        i = i + 1
    if i == len(temps):
        return -1
    return i
`,
        tests: [t.eq('first_hot_day([18, 22, 31, 35], 30)', '2'), t.eq('first_hot_day([18, 22], 30)', '-1'), t.eq('first_hot_day([30], 30)', '0'), t.hidden('first_hot_day([], 30)', '-1'), t.hidden('first_hot_day([29, 30, 29], 30)', '1')],
        hints: ['Keep walking while the day is not hot yet.', 'Not hot yet means `temps[i] < hot`.'],
        note: 'This loop has **two exits**. Either it found a hot day (`i` points at it), or it ran out of days (`i == len(temps)`). After the loop, check which exit you took.',
        signature: 'while:scan-until-fill',
      }),
      write({
        id: 'c1-loop-rebuild-first-negative',
        title: 'Rebuild: first negative balance',
        stage: 'reconstruct',
        skills: ['while_loop', 'list_index', 'early_return'],
        prompt: '`balances` is a list of end-of-day bank balances. Return the index of the first balance below 0. If there is none, return `-1`.\n\nUse a while loop and an index. Write it from a blank editor.\n\n`first_negative([40, 15, -5, 20, -1])` → `2`\n`first_negative([])` → `-1` (no days at all)',
        starterCode: '',
        solution: `def first_negative(balances):
    i = 0
    while i < len(balances):
        if balances[i] < 0:
            return i
        i = i + 1
    return -1
`,
        tests: [t.eq('first_negative([40, 15, -5, 20, -1])', '2'), t.eq('first_negative([])', '-1'), t.eq('first_negative([3, 0, 8])', '-1'), t.hidden('first_negative([-1])', '0'), t.hidden('first_negative([0, 0, -2])', '2')],
        hints: ['The scan ends when you run out of balances.', 'Return as soon as you see a negative one. After the loop, nothing was found.'],
        signature: 'while:first-negative-index',
        minutes: 4,
        important: true,
      }),
      write({
        id: 'c1-loop-break',
        title: 'Total before closing',
        skills: ['for_loop', 'accumulator', 'conditionals'],
        prompt: '`sales` is a list of sale amounts from one day. A `0` in the list means the shop closed. Everything after it does not count.\n\nReturn the total of the amounts before the first `0`. If there is no `0`, return the total of all of them.\n\n`total_before_close([20, 5, 0, 40])` → `25`\n`total_before_close([])` → `0`',
        note: '`break` ends a loop right away, even in the middle of the list. The program continues at the first line after the loop. Inside a function, `return` does the same and also leaves the function.',
        starterCode: `def total_before_close(sales):
    pass
`,
        solution: `def total_before_close(sales):
    total = 0
    for amount in sales:
        if amount == 0:
            break
        total = total + amount
    return total
`,
        tests: [t.eq('total_before_close([20, 5, 0, 40])', '25'), t.eq('total_before_close([])', '0'), t.eq('total_before_close([7, 3])', '10'), t.hidden('total_before_close([0, 50])', '0'), t.hidden('total_before_close([1, 0, 0, 9])', '1')],
        hints: ['Check for the `0` before you add.', 'When you see it, `break`.'],
        signature: 'loop:break-on-marker',
        minutes: 4,
      }),
      write({
        id: 'c1-loop-two-exits',
        title: 'The day the goal was reached',
        skills: ['while_loop', 'list_index', 'accumulator'],
        prompt: '`daily_steps` is a list of step counts, one per day. `goal` is a total to reach.\n\nAdd the days up in order. Return the index of the day on which the total first reaches `goal` or more. If it never does, return `-1`.\n\n`goal_day([4000, 3000, 5000], 7000)` → `1` (4000 + 3000 = 7000 on day 1)\n`goal_day([100], 500)` → `-1`',
        starterCode: `def goal_day(daily_steps, goal):
    pass
`,
        solution: `def goal_day(daily_steps, goal):
    total = 0
    i = 0
    while i < len(daily_steps):
        total = total + daily_steps[i]
        if total >= goal:
            return i
        i = i + 1
    return -1
`,
        tests: [t.eq('goal_day([4000, 3000, 5000], 7000)', '1'), t.eq('goal_day([100], 500)', '-1'), t.eq('goal_day([9000, 1], 5000)', '0'), t.hidden('goal_day([], 10)', '-1'), t.hidden('goal_day([1, 1, 1, 1], 4)', '3')],
        hints: ['Two pieces of state: the index and the total so far.', 'Add first, then check. Return the index if the goal is met.'],
        signature: 'while:two-exits-running-total',
        minutes: 5,
      }),
      debug({
        id: 'c1-loop-dbg-past-end',
        title: 'Debug: walking off the end',
        skills: ['while_loop', 'list_index'],
        prompt: '`forecast` is a list of strings like `"sun"` and `"rain"`, one per day. `days_before_rain(forecast)` should return how many days come before the first `"rain"`. If there is no rain, it should return the number of days.\n\n`days_before_rain(["sun", "sun", "rain"])` → `2`\n\nIt crashes on some inputs. Fix it.',
        brokenCode: `def days_before_rain(forecast):
    i = 0
    while i <= len(forecast) and forecast[i] != "rain":
        i = i + 1
    return i
`,
        solution: `def days_before_rain(forecast):
    i = 0
    while i < len(forecast) and forecast[i] != "rain":
        i = i + 1
    return i
`,
        tests: [t.eq('days_before_rain(["sun", "sun", "rain"])', '2'), t.eq('days_before_rain(["sun", "cloud"])', '2'), t.eq('days_before_rain([])', '0'), t.hidden('days_before_rain(["rain"])', '0'), t.hidden('days_before_rain(["cloud", "rain", "rain"])', '1')],
        hints: ['Trace `["sun", "cloud"]`. What is `i` when it crashes?', 'What is the last index you are allowed to read?'],
        explanation: 'The last valid index is len(forecast) - 1. With `<=`, i reaches len(forecast) and forecast[i] reads past the end. With `<`, the guard stops first.',
        signature: 'debug:while-index-past-end',
      }),
      write({
        id: 'c1-loop-last-match',
        title: 'Last big sale',
        skills: ['while_loop', 'list_index', 'early_return'],
        prompt: '`sales` is a list of sale amounts in time order. `min_amount` is a number.\n\nReturn the index of the **last** sale that is at least `min_amount`. Start at the end of the list and walk backward. If there is none, return `-1`.\n\n`last_big_sale([50, 200, 30, 120, 10], 100)` → `3`\n`last_big_sale([], 100)` → `-1`',
        note: 'Walking backward is the same loop with the state running the other way: start at `len(sales) - 1`, keep going while `i >= 0`, and change the state with `i = i - 1`.',
        starterCode: `def last_big_sale(sales, min_amount):
    pass
`,
        solution: `def last_big_sale(sales, min_amount):
    i = len(sales) - 1
    while i >= 0:
        if sales[i] >= min_amount:
            return i
        i = i - 1
    return -1
`,
        tests: [t.eq('last_big_sale([50, 200, 30, 120, 10], 100)', '3'), t.eq('last_big_sale([], 100)', '-1'), t.eq('last_big_sale([5, 6], 100)', '-1'), t.hidden('last_big_sale([100], 100)', '0'), t.hidden('last_big_sale([300, 1, 1], 100)', '0')],
        hints: ['Start `i` at the last index.', 'Keep going while `i >= 0`, stepping `i = i - 1`.'],
        signature: 'while:scan-backward',
        minutes: 4,
      }),
    ],
  },

  // ───────────────────────────── Running state ─────────────────────────────
  {
    id: 'c1-running-state',
    title: 'Running state',
    summary: 'Carry a best so far, a count or the previous value through one pass.',
    exercises: [
      output({
        id: 'c1-running-trace-best',
        title: 'Trace: new best score',
        skills: ['state_tracking', 'conditionals'],
        prompt: 'Predict the output. Keep a column for `s` and a column for `best`.',
        code: `scores = [40, 75, 60, 90, 85]
best = scores[0]
for s in scores:
    if s > best:
        best = s
        print("new best", best)
print("best", best)`,
        expectedOutput: 'new best 75\nnew best 90\nbest 90',
        note: '**Running state** is a small summary of everything seen so far. You do not keep the whole history. You keep only what the rest of the scan needs: here, the best score.',
        explanation: '`best` only changes when a score beats it. 60 and 85 do not, so nothing prints for them.',
        signature: 'trace:best-so-far',
      }),
      fill({
        id: 'c1-running-fill-prev',
        title: 'Fill: remember yesterday',
        skills: ['state_tracking', 'conditionals'],
        prompt: '`temps` is a list of daily temperatures. `warmer_days(temps)` returns how many days were warmer than the day before.\n\n`warmer_days([10, 12, 11, 15])` → `2` (12 and 15)\n\n`prev` holds the day before. It starts as `None` because the first day has no day before it. Fill in the blank.',
        starterCode: `def warmer_days(temps):
    count = 0
    prev = None
    for temp in temps:
        if prev is not None and temp > prev:
            count = count + 1
        ____
    return count
`,
        solution: `def warmer_days(temps):
    count = 0
    prev = None
    for temp in temps:
        if prev is not None and temp > prev:
            count = count + 1
        prev = temp
    return count
`,
        tests: [t.eq('warmer_days([10, 12, 11, 15])', '2'), t.eq('warmer_days([5])', '0'), t.eq('warmer_days([3, 3, 3])', '0'), t.hidden('warmer_days([])', '0'), t.hidden('warmer_days([-5, -2, 0, 1])', '3')],
        hints: ['At the end of a pass, today becomes "the day before" for the next pass.'],
        note: 'A **previous value** is state you update at the very end of each pass, after you are done comparing with it.',
        signature: 'running:prev-value-fill',
      }),
      write({
        id: 'c1-running-rebuild-best',
        title: 'Rebuild: peak balance',
        stage: 'reconstruct',
        skills: ['state_tracking', 'accumulator'],
        prompt: '`start` is a bank balance. `changes` is a list of amounts added to it in order. A negative amount is money taken out.\n\nReturn the highest the balance ever was. The starting balance counts.\n\nWrite it from a blank editor.\n\n`peak_balance(100, [50, -30, 40, -100])` → `160` (balances 150, 120, 160, 60)\n`peak_balance(100, [-10, -20])` → `100` (it never beat the start)',
        starterCode: '',
        solution: `def peak_balance(start, changes):
    balance = start
    peak = start
    for change in changes:
        balance = balance + change
        if balance > peak:
            peak = balance
    return peak
`,
        tests: [t.eq('peak_balance(100, [50, -30, 40, -100])', '160'), t.eq('peak_balance(100, [-10, -20])', '100'), t.eq('peak_balance(0, [])', '0'), t.hidden('peak_balance(-50, [10, 10])', '-30'), t.hidden('peak_balance(5, [5, -5, 5, -5])', '10')],
        hints: ['Two pieces of state: the balance now, and the best balance so far.', 'Update the balance every time. Update the peak only when the balance beats it.'],
        signature: 'running:peak-balance',
        minutes: 4,
        important: true,
      }),
      write({
        id: 'c1-running-records',
        title: 'Count new records',
        skills: ['state_tracking', 'accumulator'],
        prompt: '`scores` is a list of game scores in the order they were played.\n\nA game sets a **record** when its score beats every score before it. The first game always sets a record. A tie is not a record. Return how many records were set.\n\n`count_records([10, 8, 12, 12, 15])` → `3` (10, 12 and 15)\n`count_records([])` → `0`',
        starterCode: `def count_records(scores):
    pass
`,
        solution: `def count_records(scores):
    records = 0
    best = None
    for s in scores:
        if best is None or s > best:
            records = records + 1
            best = s
    return records
`,
        tests: [t.eq('count_records([10, 8, 12, 12, 15])', '3'), t.eq('count_records([])', '0'), t.eq('count_records([5, 4, 3])', '1'), t.hidden('count_records([1, 2, 3, 4])', '4'), t.hidden('count_records([-3, -5, -1])', '2')],
        hints: ['Keep the best score so far and a count.', 'A record is a score that beats the best so far. Then it becomes the new best.'],
        signature: 'running:count-records',
        minutes: 4,
      }),
      write({
        id: 'c1-running-longest-same',
        title: 'Longest run of the same roll',
        skills: ['state_tracking', 'conditionals'],
        prompt: '`rolls` is a list of dice rolls in order.\n\nA **run** is the same value several times in a row, like 5, 5, 5. Return the length of the longest run. One value on its own is a run of 1. An empty list has no runs, so return `0`.\n\n`longest_same([3, 3, 5, 5, 5, 2])` → `3`\n`longest_same([])` → `0`',
        starterCode: `def longest_same(rolls):
    pass
`,
        solution: `def longest_same(rolls):
    best = 0
    current = 0
    prev = None
    for r in rolls:
        if r == prev:
            current = current + 1
        else:
            current = 1
        if current > best:
            best = current
        prev = r
    return best
`,
        tests: [t.eq('longest_same([3, 3, 5, 5, 5, 2])', '3'), t.eq('longest_same([])', '0'), t.eq('longest_same([4])', '1'), t.hidden('longest_same([1, 2, 2, 1, 1, 1, 1])', '4'), t.hidden('longest_same([6, 5, 4])', '1')],
        hints: ['Three pieces of state: the previous roll, the current run length, and the best run.', 'Same as the previous roll: the run grows. Different: it starts again at 1. Check the best on every pass.'],
        signature: 'running:longest-equal-run',
        minutes: 6,
      }),
      debug({
        id: 'c1-running-dbg-last-run',
        title: 'Debug: the last dry spell',
        skills: ['state_tracking', 'conditionals'],
        prompt: '`rain` is a list of millimetres of rain, one per day. `longest_dry_spell(rain)` should return the most days in a row with `0` rain.\n\n`longest_dry_spell([5, 0, 0, 3, 0])` → `2`\n\nIt is wrong for some inputs. Fix it.',
        brokenCode: `def longest_dry_spell(rain):
    best = 0
    current = 0
    for mm in rain:
        if mm == 0:
            current = current + 1
        else:
            if current > best:
                best = current
            current = 0
    return best
`,
        solution: `def longest_dry_spell(rain):
    best = 0
    current = 0
    for mm in rain:
        if mm == 0:
            current = current + 1
        else:
            current = 0
        if current > best:
            best = current
    return best
`,
        tests: [t.eq('longest_dry_spell([5, 0, 0, 3, 0])', '2'), t.eq('longest_dry_spell([5, 0, 0, 0])', '3'), t.eq('longest_dry_spell([0])', '1'), t.hidden('longest_dry_spell([])', '0'), t.hidden('longest_dry_spell([1, 2])', '0')],
        hints: ['Try `[5, 0, 0, 0]`. When does `best` get updated?', 'A spell that runs to the end of the list never meets a rainy day.'],
        explanation: 'The best was only checked when a rainy day ended a spell. A spell still going at the end was never compared. Checking the best on every pass fixes it.',
        signature: 'debug:running-last-run-missed',
      }),
    ],
  },

  // ───────────────────────────── Mutation ─────────────────────────────
  {
    id: 'c1-mutation',
    title: 'Mutation',
    summary: 'Lists change in place; some functions change them, others return a new one.',
    exercises: [
      output({
        id: 'c1-mut-trace-cart',
        title: 'Trace: a shopping cart',
        skills: ['list_append', 'list_index'],
        prompt: '`append` adds to the end. `cart[0] = ...` replaces one item. `pop()` removes the last item and gives it back.\n\nPredict the output.',
        code: `cart = ["milk", "eggs"]
cart.append("bread")
cart[0] = "oat milk"
last = cart.pop()
print(cart)
print(last)
print(len(cart))`,
        expectedOutput: "['oat milk', 'eggs']\nbread\n2",
        note: 'To **mutate** a list is to change it in place. No new list is made: the same list now holds different items.',
        explanation: 'After append the cart is ["milk", "eggs", "bread"]. Then index 0 becomes "oat milk", and pop() takes "bread" off the end and hands it to `last`.',
        signature: 'trace:list-mutation',
      }),
      output({
        id: 'c1-mut-trace-return',
        title: 'Trace: change it or return a new one',
        skills: ['functions', 'list_append'],
        prompt: 'One function changes the list it is given. The other builds a new list and returns it. A function with no `return` gives back `None`.\n\nPredict the output.',
        code: `def add_tip(bill):
    bill.append(5)

def with_tip(bill):
    return bill + [5]

a = [20, 30]
add_tip(a)
print(a)
b = [20, 30]
c = with_tip(b)
print(b)
print(c)
print(add_tip([1]))`,
        expectedOutput: '[20, 30, 5]\n[20, 30]\n[20, 30, 5]\nNone',
        explanation: '`add_tip` mutates the caller\'s list and returns nothing. `bill + [5]` builds a new list, so `b` is untouched.',
        signature: 'trace:mutate-vs-return',
      }),
      write({
        id: 'c1-mut-cap-scores',
        title: 'Cap the scores in place',
        skills: ['list_index', 'accumulator'],
        prompt: '`scores` is a list of numbers. `limit` is the highest score allowed.\n\nChange `scores` in place: replace every score above `limit` with `limit`. Do not build a new list. Return how many scores you changed.\n\n`cap_scores([5, 12, 9, 30], 10)` → `2` (the list becomes `[5, 10, 9, 10]`)\n`cap_scores([], 10)` → `0`',
        note: 'To change an item in place you need its index: `scores[i] = limit`. `for s in scores: s = limit` only changes the loop variable `s`, never the list.',
        starterCode: `def cap_scores(scores, limit):
    pass
`,
        solution: `def cap_scores(scores, limit):
    changed = 0
    i = 0
    while i < len(scores):
        if scores[i] > limit:
            scores[i] = limit
            changed = changed + 1
        i = i + 1
    return changed
`,
        tests: [
          t.eq('cap_scores([5, 12, 9, 30], 10)', '2'),
          t.eq('cap_scores([], 10)', '0'),
          t.check('the list itself changes', 's = [5, 12, 9, 30]\ncap_scores(s, 10)\nassert s == [5, 10, 9, 10], s'),
          t.check('a score equal to the limit stays', 's = [10, 11]\nn = cap_scores(s, 10)\nassert s == [10, 10] and n == 1, (s, n)'),
          t.hidden('cap_scores([1, 2], 10)', '0'),
          t.check('negatives too', 's = [-5, 0]\ncap_scores(s, -1)\nassert s == [-5, -1], s', true),
        ],
        hints: ['Walk by index so you can write `scores[i] = limit`.', 'Count each one you change.'],
        signature: 'mutate:cap-in-place',
        minutes: 5,
      }),
      write({
        id: 'c1-mut-new-list',
        title: 'Restock without touching the original',
        skills: ['list_append', 'functions'],
        prompt: '`stock` is a list of item counts. `amount` is how many of each item arrive.\n\nReturn a **new** list where every count is `amount` higher. Do not change `stock`.\n\n`restock([3, 0, 5], 2)` → `[5, 2, 7]`\n`restock([], 2)` → `[]`',
        starterCode: `def restock(stock, amount):
    pass
`,
        solution: `def restock(stock, amount):
    result = []
    for count in stock:
        result.append(count + amount)
    return result
`,
        tests: [
          t.eq('restock([3, 0, 5], 2)', '[5, 2, 7]'),
          t.eq('restock([], 2)', '[]'),
          t.check('stock is not changed', 's = [3, 0, 5]\nr = restock(s, 2)\nassert s == [3, 0, 5], s\nassert r is not s'),
          t.hidden('restock([1], 0)', '[1]'),
          t.hidden('restock([10, 20], -5)', '[5, 15]'),
        ],
        hints: ['Start an empty `result` list.', 'Append each new count to it, then return it.'],
        signature: 'mutate:new-list-not-in-place',
        minutes: 3,
      }),
      debug({
        id: 'c1-mut-dbg-remove',
        title: 'Debug: removing while walking',
        skills: ['while_loop', 'list_index'],
        prompt: '`boxes` is a list of item counts. `remove_empty(boxes)` should remove every `0` from `boxes` in place. It changes the list itself and returns nothing.\n\nAfter `remove_empty(b)` with `b = [3, 0, 0, 4]`, `b` is `[3, 4]`.\n\nIt crashes on some inputs. Fix it.',
        brokenCode: `def remove_empty(boxes):
    for i in range(len(boxes)):
        if boxes[i] == 0:
            boxes.pop(i)
`,
        solution: `def remove_empty(boxes):
    i = 0
    while i < len(boxes):
        if boxes[i] == 0:
            boxes.pop(i)
        else:
            i = i + 1
`,
        tests: [
          t.check('removes two zeros in a row', 'b = [3, 0, 0, 4]\nremove_empty(b)\nassert b == [3, 4], b'),
          t.check('removes a zero at the end', 'b = [1, 0]\nremove_empty(b)\nassert b == [1], b'),
          t.check('nothing to remove', 'b = [1, 2]\nremove_empty(b)\nassert b == [1, 2], b'),
          t.check('all zeros', 'b = [0, 0, 0]\nremove_empty(b)\nassert b == [], b', true),
          t.check('empty list', 'b = []\nremove_empty(b)\nassert b == [], b', true),
        ],
        hints: ['After `pop(i)`, the list is one shorter. What happened to the item that was at `i + 1`?', '`range(len(boxes))` was decided before anything was removed. A while loop rechecks the length every pass.'],
        explanation: 'Popping shifts every later item one place left. So after a pop, the next item to check is at the same index: only move `i` forward when you did not remove.',
        signature: 'debug:remove-while-iterating',
        minutes: 4,
      }),
    ],
  },

  // ───────────────────────────── References ─────────────────────────────
  {
    id: 'c1-references',
    title: 'References',
    summary: 'Two names can share one list; a copy is a second list.',
    exercises: [
      output({
        id: 'c1-ref-trace-alias',
        title: 'Trace: two names, one list',
        skills: ['list_append'],
        prompt: '`yours = mine` does not copy the list. It gives the same list a second name. `mine[:]` makes a new list with the same items.\n\n`is` asks: are these the very same list?\n\nPredict the output.',
        code: `mine = [1, 2]
yours = mine
yours.append(3)
print(mine)
copy = mine[:]
copy.append(4)
print(mine)
print(copy)
print(yours is mine, copy is mine)`,
        expectedOutput: '[1, 2, 3]\n[1, 2, 3]\n[1, 2, 3, 4]\nTrue False',
        note: 'A variable is a **name tag** on a value, not a box that holds it. `yours = mine` puts a second tag on the same list. Changing the list through either name changes it for both. This is called **aliasing**.',
        explanation: 'yours and mine are one list, so appending 3 through yours shows up in mine. copy is a separate list, so 4 only appears there.',
        signature: 'trace:alias-vs-copy',
      }),
      output({
        id: 'c1-ref-trace-function',
        title: 'Trace: a function gets the same list',
        skills: ['functions', 'list_append'],
        prompt: 'When you pass a list to a function, the parameter is another name for the caller\'s list. Assigning a new list to the parameter only moves that name.\n\nPredict the output.',
        code: `def add_bonus(scores):
    scores.append(10)

def reset(scores):
    scores = []

team = [3, 4]
add_bonus(team)
print(team)
reset(team)
print(team)`,
        expectedOutput: '[3, 4, 10]\n[3, 4, 10]',
        explanation: '`scores.append` changes the shared list. `scores = []` points the local name at a new empty list. The caller\'s list is untouched.',
        signature: 'trace:function-shares-list',
      }),
      write({
        id: 'c1-ref-rebuild-shared',
        title: 'Rebuild: cart history',
        stage: 'reconstruct',
        skills: ['list_append', 'functions'],
        prompt: '`items` is a list of item names added to a shopping cart, in order. The cart starts empty.\n\nReturn a list of what the cart held after each item was added. Each entry is a list.\n\nWrite it from a blank editor.\n\n`cart_history(["milk", "eggs"])` → `[["milk"], ["milk", "eggs"]]`\n`cart_history([])` → `[]` (nothing added)',
        starterCode: '',
        solution: `def cart_history(items):
    cart = []
    history = []
    for item in items:
        cart.append(item)
        history.append(cart[:])
    return history
`,
        tests: [
          t.eq('cart_history(["milk", "eggs"])', '[["milk"], ["milk", "eggs"]]'),
          t.eq('cart_history([])', '[]'),
          t.eq('cart_history(["tea"])', '[["tea"]]'),
          t.hidden('cart_history(["a", "b", "c"])', '[["a"], ["a", "b"], ["a", "b", "c"]]'),
          t.check('the entries are separate lists', 'h = cart_history(["a", "b"])\nassert h[0] is not h[1]', true),
        ],
        hints: ['Keep one `cart` that you change, and a `history` list.', 'Save a copy of the cart each time, not the cart itself.'],
        signature: 'ref:snapshot-copy',
        minutes: 4,
        important: true,
      }),
      write({
        id: 'c1-ref-top-three',
        title: 'Top three, without side effects',
        skills: ['sorting', 'functions'],
        prompt: '`scores` is a list of numbers. Return the three highest, largest first. If there are fewer than three, return all of them, largest first.\n\nDo not change `scores`. The caller still needs it in its original order.\n\n`top_three([50, 90, 70, 80])` → `[90, 80, 70]`\n`top_three([5])` → `[5]`',
        note: '`scores.sort()` sorts the list in place: the caller\'s list changes too. `sorted(scores)` builds a new sorted list and leaves the original alone. Both accept `reverse=True`.',
        starterCode: `def top_three(scores):
    pass
`,
        solution: `def top_three(scores):
    ordered = sorted(scores, reverse=True)
    return ordered[:3]
`,
        tests: [
          t.eq('top_three([50, 90, 70, 80])', '[90, 80, 70]'),
          t.eq('top_three([5])', '[5]'),
          t.check('scores keeps its order', 's = [50, 90, 70, 80]\ntop_three(s)\nassert s == [50, 90, 70, 80], s'),
          t.hidden('top_three([])', '[]'),
          t.hidden('top_three([3, 3, 1, 3])', '[3, 3, 3]'),
        ],
        hints: ['Make a sorted copy first.', '`sorted(scores, reverse=True)`, then take the first three with `[:3]`.'],
        signature: 'ref:no-side-effects',
        minutes: 3,
      }),
      debug({
        id: 'c1-ref-dbg-grid',
        title: 'Debug: booking one seat books a column',
        skills: ['list_index', 'list_append'],
        prompt: '`book_seat(rows, cols, r, c)` should build a seating plan with `rows` rows and `cols` seats per row, all `0`. Then it sets the seat at row `r`, seat `c` to `1` and returns the plan.\n\n`book_seat(2, 3, 0, 1)` → `[[0, 1, 0], [0, 0, 0]]`\n\nIt books more than one seat. Fix it.',
        brokenCode: `def book_seat(rows, cols, r, c):
    plan = [[0] * cols] * rows
    plan[r][c] = 1
    return plan
`,
        solution: `def book_seat(rows, cols, r, c):
    plan = []
    for _ in range(rows):
        plan.append([0] * cols)
    plan[r][c] = 1
    return plan
`,
        tests: [
          t.eq('book_seat(2, 3, 0, 1)', '[[0, 1, 0], [0, 0, 0]]'),
          t.eq('book_seat(3, 2, 2, 0)', '[[0, 0], [0, 0], [1, 0]]'),
          t.eq('book_seat(1, 1, 0, 0)', '[[1]]'),
          t.hidden('book_seat(2, 2, 1, 1)', '[[0, 0], [0, 1]]'),
        ],
        hints: ['`[row] * 2` repeats the same row object twice. How many row lists exist?', 'Make a fresh `[0] * cols` for every row.'],
        explanation: '`[[0] * cols] * rows` makes one row list and puts it in the plan `rows` times. Every row is the same list. Building each row separately gives each its own list.',
        signature: 'debug:repeated-row-alias',
      }),
    ],
  },

  // ───────────────────────────── Decomposition ─────────────────────────────
  {
    id: 'c1-decompose',
    title: 'Decomposition',
    summary: 'Small functions with one job each, then put them together.',
    exercises: [
      write({
        id: 'c1-dec-parse',
        title: 'Job 1: parse one order',
        skills: ['functions', 'string_methods'],
        prompt: '`line` is one order from a shop\'s log, written as `"name,quantity,price"`. The price is in cents. Every line has exactly two commas.\n\nReturn a tuple `(name, quantity, price)` with `quantity` and `price` turned into whole numbers.\n\n`parse_order("tea,2,250")` → `("tea", 2, 250)`\n`parse_order(",0,99")` → `("", 0, 99)` (parse it, even if it looks wrong)',
        note: 'This function has one job: turn text into values. Checking whether the order makes sense is a different job, for a different function.',
        starterCode: `def parse_order(line):
    pass
`,
        solution: `def parse_order(line):
    parts = line.split(",")
    name = parts[0]
    quantity = int(parts[1])
    price = int(parts[2])
    return (name, quantity, price)
`,
        tests: [t.eq('parse_order("tea,2,250")', '("tea", 2, 250)'), t.eq('parse_order(",0,99")', '("", 0, 99)'), t.eq('parse_order("pen,10,99")', '("pen", 10, 99)'), t.hidden('parse_order("gift card,1,0")', '("gift card", 1, 0)'), t.hidden('parse_order("x,-1,5")', '("x", -1, 5)')],
        hints: ['`line.split(",")` gives a list of three strings.', '`int(...)` turns `"250"` into `250`.'],
        signature: 'decompose:parse',
        minutes: 3,
      }),
      write({
        id: 'c1-dec-validate',
        title: 'Job 2: is the order valid?',
        skills: ['functions', 'conditionals'],
        prompt: '`order` is a tuple `(name, quantity, price)`.\n\nReturn `True` if the order is valid and `False` if it isn\'t. The name must not be empty. The quantity must be at least 1. The price must be 0 or more.\n\n`is_valid(("tea", 2, 250))` → `True`\n`is_valid(("", 1, 100))` → `False` (no name)',
        starterCode: `def is_valid(order):
    pass
`,
        solution: `def is_valid(order):
    name, quantity, price = order
    if name == "":
        return False
    if quantity < 1:
        return False
    if price < 0:
        return False
    return True
`,
        tests: [t.eq('is_valid(("tea", 2, 250))', 'True'), t.eq('is_valid(("", 1, 100))', 'False'), t.eq('is_valid(("pen", 0, 99))', 'False'), t.hidden('is_valid(("gift", 1, 0))', 'True'), t.hidden('is_valid(("mug", 3, -1))', 'False')],
        hints: ['Unpack it: `name, quantity, price = order`.', 'Check each rule. Return `False` as soon as one fails.'],
        signature: 'decompose:validate',
        minutes: 3,
      }),
      write({
        id: 'c1-dec-summarise',
        title: 'Job 3: summarise the orders',
        skills: ['functions', 'accumulator'],
        prompt: '`orders` is a list of valid `(name, quantity, price)` tuples. Prices are in cents.\n\nReturn a tuple `(items, total)`. `items` is the sum of the quantities. `total` is the sum of quantity times price.\n\n`summarise([("tea", 2, 250), ("pen", 1, 99)])` → `(3, 599)`\n`summarise([])` → `(0, 0)`',
        starterCode: `def summarise(orders):
    pass
`,
        solution: `def summarise(orders):
    items = 0
    total = 0
    for name, quantity, price in orders:
        items = items + quantity
        total = total + quantity * price
    return (items, total)
`,
        tests: [t.eq('summarise([("tea", 2, 250), ("pen", 1, 99)])', '(3, 599)'), t.eq('summarise([])', '(0, 0)'), t.eq('summarise([("gift", 4, 0)])', '(4, 0)'), t.hidden('summarise([("a", 1, 1), ("b", 1, 1), ("c", 1, 1)])', '(3, 3)')],
        hints: ['Two running totals.', 'Unpack each tuple in the `for` line.'],
        signature: 'decompose:summarise',
        minutes: 3,
      }),
      write({
        id: 'c1-dec-report',
        title: 'Put the jobs together',
        stage: 'combine',
        repType: 'combine',
        style: 'finish',
        skills: ['functions', 'conditionals', 'accumulator'],
        prompt: '`lines` is a list of order lines like `"tea,2,250"`. Three helpers are given in the editor: one parses a line, one checks it, one summarises.\n\nReturn a dict with four keys. `"orders"` is how many lines were valid. `"skipped"` is how many were not. `"items"` and `"total"` come from summarising the valid orders only.\n\n`report(["tea,2,250", ",1,100"])` → `{"orders": 1, "skipped": 1, "items": 2, "total": 500}`\n`report([])` → `{"orders": 0, "skipped": 0, "items": 0, "total": 0}`',
        note: '`report` should read like a list of steps: parse each line, keep the valid ones, summarise. If it needs a comment to explain a block, that block probably wants to be its own function.',
        starterCode: `def parse_order(line):
    parts = line.split(",")
    return (parts[0], int(parts[1]), int(parts[2]))


def is_valid(order):
    name, quantity, price = order
    return name != "" and quantity >= 1 and price >= 0


def summarise(orders):
    items = 0
    total = 0
    for name, quantity, price in orders:
        items = items + quantity
        total = total + quantity * price
    return (items, total)


def report(lines):
    pass
`,
        solution: `def parse_order(line):
    parts = line.split(",")
    return (parts[0], int(parts[1]), int(parts[2]))


def is_valid(order):
    name, quantity, price = order
    return name != "" and quantity >= 1 and price >= 0


def summarise(orders):
    items = 0
    total = 0
    for name, quantity, price in orders:
        items = items + quantity
        total = total + quantity * price
    return (items, total)


def report(lines):
    valid = []
    skipped = 0
    for line in lines:
        order = parse_order(line)
        if is_valid(order):
            valid.append(order)
        else:
            skipped = skipped + 1
    items, total = summarise(valid)
    return {"orders": len(valid), "skipped": skipped, "items": items, "total": total}
`,
        tests: [
          t.eq('report(["tea,2,250", ",1,100"])', '{"orders": 1, "skipped": 1, "items": 2, "total": 500}'),
          t.eq('report([])', '{"orders": 0, "skipped": 0, "items": 0, "total": 0}'),
          t.eq('report(["tea,2,250", "pen,1,99"])', '{"orders": 2, "skipped": 0, "items": 3, "total": 599}'),
          t.hidden('report(["mug,0,800", "cup,-1,5"])', '{"orders": 0, "skipped": 2, "items": 0, "total": 0}'),
          t.hidden('report(["gift,1,0", "tea,3,100", "x,1,-5"])', '{"orders": 2, "skipped": 1, "items": 4, "total": 300}'),
        ],
        hints: ['Loop over the lines. Parse each one.', 'Valid orders go in a list. Invalid ones add to `skipped`. Summarise the list at the end.'],
        signature: 'decompose:compose-report',
        minutes: 6,
      }),
      debug({
        id: 'c1-dec-dbg-helper',
        title: 'Debug: one helper does its job wrong',
        skills: ['functions', 'string_methods'],
        prompt: '`report(lines)` should count valid and skipped order lines and total up the valid ones. All the code is in the editor.\n\n`report(["tea,2,250"])` → `{"orders": 1, "skipped": 0, "items": 2, "total": 500}`\n\nIt crashes. Call each helper on its own to find the one that is wrong, then fix it.',
        brokenCode: `def parse_order(line):
    parts = line.split(",")
    return (parts[0], parts[1], parts[2])


def is_valid(order):
    name, quantity, price = order
    return name != "" and quantity >= 1 and price >= 0


def summarise(orders):
    items = 0
    total = 0
    for name, quantity, price in orders:
        items = items + quantity
        total = total + quantity * price
    return (items, total)


def report(lines):
    valid = []
    skipped = 0
    for line in lines:
        order = parse_order(line)
        if is_valid(order):
            valid.append(order)
        else:
            skipped = skipped + 1
    items, total = summarise(valid)
    return {"orders": len(valid), "skipped": skipped, "items": items, "total": total}
`,
        solution: `def parse_order(line):
    parts = line.split(",")
    return (parts[0], int(parts[1]), int(parts[2]))


def is_valid(order):
    name, quantity, price = order
    return name != "" and quantity >= 1 and price >= 0


def summarise(orders):
    items = 0
    total = 0
    for name, quantity, price in orders:
        items = items + quantity
        total = total + quantity * price
    return (items, total)


def report(lines):
    valid = []
    skipped = 0
    for line in lines:
        order = parse_order(line)
        if is_valid(order):
            valid.append(order)
        else:
            skipped = skipped + 1
    items, total = summarise(valid)
    return {"orders": len(valid), "skipped": skipped, "items": items, "total": total}
`,
        tests: [
          t.eq('parse_order("tea,2,250")', '("tea", 2, 250)'),
          t.eq('report(["tea,2,250"])', '{"orders": 1, "skipped": 0, "items": 2, "total": 500}'),
          t.eq('report(["tea,2,250", "pen,0,99"])', '{"orders": 1, "skipped": 1, "items": 2, "total": 500}'),
          t.hidden('report([])', '{"orders": 0, "skipped": 0, "items": 0, "total": 0}'),
        ],
        hints: ['Run `print(parse_order("tea,2,250"))`. Is `2` a number or text?', 'Each helper promises something. `parse_order` promises whole numbers.'],
        explanation: 'parse_order handed on text, so `"2" >= 1` failed inside is_valid. Small helpers make this quick to find: test each one alone, and the broken promise shows up at once.',
        signature: 'debug:decompose-broken-helper',
      }),
    ],
  },

  // ───────────────────────────── Gates ─────────────────────────────
  {
    id: 'c1-gates',
    title: 'Week 1 gates',
    summary: 'Cold checks: loop control, index scans, running state, mutation and references.',
    exercises: [
      // g-loop-control
      write({
        id: 'c1-g-countdown-steps',
        title: 'Steps to zero',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'state_tracking'],
        prompt: '`n` is a whole number, 0 or more. `k` is at least 1. Each step subtracts `k` from `n`. Return how many steps it takes for `n` to reach 0 or below.\n\n`steps_to_zero(10, 3)` → `4`\n`steps_to_zero(0, 5)` → `0`',
        starterCode: `def steps_to_zero(n, k):
    pass
`,
        solution: `def steps_to_zero(n, k):
    steps = 0
    while n > 0:
        n = n - k
        steps = steps + 1
    return steps
`,
        tests: [t.eq('steps_to_zero(10, 3)', '4'), t.eq('steps_to_zero(0, 5)', '0'), t.eq('steps_to_zero(9, 3)', '3'), t.hidden('steps_to_zero(1, 100)', '1'), t.hidden('steps_to_zero(7, 1)', '7')],
        signature: 'gate:loop-subtract-count',
        minutes: 4,
      }),
      write({
        id: 'c1-g-until-total',
        title: 'Months to a goal',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'state_tracking'],
        prompt: 'An account starts with `balance`. Each month, `deposit` is added, and `deposit` is at least 1. Return how many months until the balance is at least `goal`.\n\n`months_to_goal(50, 20, 110)` → `3`\n`months_to_goal(200, 20, 110)` → `0`',
        starterCode: `def months_to_goal(balance, deposit, goal):
    pass
`,
        solution: `def months_to_goal(balance, deposit, goal):
    months = 0
    while balance < goal:
        balance = balance + deposit
        months = months + 1
    return months
`,
        tests: [t.eq('months_to_goal(50, 20, 110)', '3'), t.eq('months_to_goal(200, 20, 110)', '0'), t.eq('months_to_goal(0, 10, 100)', '10'), t.hidden('months_to_goal(109, 1, 110)', '1'), t.hidden('months_to_goal(110, 5, 110)', '0')],
        signature: 'gate:loop-add-until',
        minutes: 4,
      }),
      write({
        id: 'c1-g-double-until',
        title: 'Days to grow',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'state_tracking'],
        prompt: 'A plant is `height` cm tall, and `height` is at least 1. Its height doubles every day. Return how many days until it is at least `target` cm tall.\n\n`days_to_reach(3, 20)` → `3`\n`days_to_reach(5, 5)` → `0`',
        starterCode: `def days_to_reach(height, target):
    pass
`,
        solution: `def days_to_reach(height, target):
    days = 0
    while height < target:
        height = height * 2
        days = days + 1
    return days
`,
        tests: [t.eq('days_to_reach(3, 20)', '3'), t.eq('days_to_reach(5, 5)', '0'), t.eq('days_to_reach(1, 8)', '3'), t.hidden('days_to_reach(1, 9)', '4'), t.hidden('days_to_reach(10, 1)', '0')],
        signature: 'gate:loop-double-until',
        minutes: 4,
      }),
      write({
        id: 'c1-g-halve-count',
        title: 'Even splits',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'state_tracking'],
        prompt: '`n` is a whole number, at least 1. Return how many times you can split `n` into two equal whole halves, one split after another. Stop when `n` is odd.\n\n`times_even(40)` → `3` (40, 20, 10, 5)\n`times_even(7)` → `0`',
        starterCode: `def times_even(n):
    pass
`,
        solution: `def times_even(n):
    count = 0
    while n % 2 == 0:
        n = n // 2
        count = count + 1
    return count
`,
        tests: [t.eq('times_even(40)', '3'), t.eq('times_even(7)', '0'), t.eq('times_even(1)', '0'), t.hidden('times_even(64)', '6'), t.hidden('times_even(12)', '2')],
        signature: 'gate:loop-split-while-even',
        minutes: 4,
      }),

      // g-index-scan
      write({
        id: 'c1-g-first-over',
        title: 'First reading over the limit',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'list_index', 'range'],
        prompt: '`readings` is a list of numbers. Return the index of the first reading above `limit`. If there is none, return `-1`.\n\n`first_over([4, 9, 2, 11], 8)` → `1`\n`first_over([], 8)` → `-1`',
        starterCode: `def first_over(readings, limit):
    pass
`,
        solution: `def first_over(readings, limit):
    i = 0
    while i < len(readings):
        if readings[i] > limit:
            return i
        i = i + 1
    return -1
`,
        tests: [t.eq('first_over([4, 9, 2, 11], 8)', '1'), t.eq('first_over([], 8)', '-1'), t.eq('first_over([8, 8], 8)', '-1'), t.hidden('first_over([100], 8)', '0'), t.hidden('first_over([1, 2, 3, 9], 8)', '3')],
        signature: 'gate:scan-first-over',
        minutes: 4,
      }),
      write({
        id: 'c1-g-last-even-index',
        title: 'Last even number',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'list_index', 'range'],
        prompt: '`nums` is a list of whole numbers. Return the index of the last even number in it. If there is none, return `-1`.\n\n`last_even_index([4, 7, 2, 9])` → `2`\n`last_even_index([1, 3])` → `-1`',
        starterCode: `def last_even_index(nums):
    pass
`,
        solution: `def last_even_index(nums):
    i = len(nums) - 1
    while i >= 0:
        if nums[i] % 2 == 0:
            return i
        i = i - 1
    return -1
`,
        tests: [t.eq('last_even_index([4, 7, 2, 9])', '2'), t.eq('last_even_index([1, 3])', '-1'), t.eq('last_even_index([])', '-1'), t.hidden('last_even_index([0])', '0'), t.hidden('last_even_index([2, 4, 6])', '2')],
        signature: 'gate:scan-last-even',
        minutes: 4,
      }),
      write({
        id: 'c1-g-count-before-stop',
        title: 'Songs before the ad',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'list_index', 'range'],
        prompt: '`playlist` is a list of strings. Return how many items come before the first `"ad"`. If there is no `"ad"`, return the length of the list.\n\n`count_before_ad(["song", "song", "ad", "song"])` → `2`\n`count_before_ad(["song"])` → `1`',
        starterCode: `def count_before_ad(playlist):
    pass
`,
        solution: `def count_before_ad(playlist):
    i = 0
    while i < len(playlist) and playlist[i] != "ad":
        i = i + 1
    return i
`,
        tests: [t.eq('count_before_ad(["song", "song", "ad", "song"])', '2'), t.eq('count_before_ad(["song"])', '1'), t.eq('count_before_ad([])', '0'), t.hidden('count_before_ad(["ad", "ad"])', '0'), t.hidden('count_before_ad(["talk", "song", "song"])', '3')],
        signature: 'gate:scan-count-before',
        minutes: 4,
      }),
      write({
        id: 'c1-g-index-of-max',
        title: 'Busiest hour',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['while_loop', 'list_index', 'range'],
        prompt: '`visitors` is a list of visitor counts, one per hour. Return the index of the largest count. If it is tied, return the earliest index. If the list is empty, return `-1`.\n\n`index_of_max([3, 9, 4, 9])` → `1`\n`index_of_max([])` → `-1`',
        starterCode: `def index_of_max(visitors):
    pass
`,
        solution: `def index_of_max(visitors):
    if not visitors:
        return -1
    best = 0
    i = 1
    while i < len(visitors):
        if visitors[i] > visitors[best]:
            best = i
        i = i + 1
    return best
`,
        tests: [t.eq('index_of_max([3, 9, 4, 9])', '1'), t.eq('index_of_max([])', '-1'), t.eq('index_of_max([7])', '0'), t.hidden('index_of_max([1, 2, 3])', '2'), t.hidden('index_of_max([-5, -2, -9])', '1')],
        signature: 'gate:scan-index-of-max',
        minutes: 4,
      }),

      // g-running-state
      write({
        id: 'c1-g-longest-rise',
        title: 'Longest climb',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['state_tracking', 'accumulator'],
        prompt: '`heights` is a list of numbers. A climb is a stretch in a row where each value is bigger than the one before it. One value on its own is a climb of length 1. Return the length of the longest climb, or `0` for an empty list.\n\n`longest_rise([1, 2, 3, 1, 2])` → `3`\n`longest_rise([])` → `0`',
        starterCode: `def longest_rise(heights):
    pass
`,
        solution: `def longest_rise(heights):
    best = 0
    current = 0
    prev = None
    for h in heights:
        if prev is not None and h > prev:
            current = current + 1
        else:
            current = 1
        if current > best:
            best = current
        prev = h
    return best
`,
        tests: [t.eq('longest_rise([1, 2, 3, 1, 2])', '3'), t.eq('longest_rise([])', '0'), t.eq('longest_rise([5, 5, 5])', '1'), t.hidden('longest_rise([3, 1, 2, 3, 4])', '4'), t.hidden('longest_rise([9])', '1')],
        signature: 'gate:running-longest-rise',
        minutes: 6,
      }),
      write({
        id: 'c1-g-max-gap',
        title: 'Longest wait',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['state_tracking', 'accumulator'],
        prompt: '`times` is a list of bus arrival times in minutes, smallest first. Return the longest wait between one bus and the next. With fewer than two buses, return `0`.\n\n`max_gap([1, 4, 5, 11])` → `6`\n`max_gap([7])` → `0`',
        starterCode: `def max_gap(times):
    pass
`,
        solution: `def max_gap(times):
    best = 0
    prev = None
    for t in times:
        if prev is not None and t - prev > best:
            best = t - prev
        prev = t
    return best
`,
        tests: [t.eq('max_gap([1, 4, 5, 11])', '6'), t.eq('max_gap([7])', '0'), t.eq('max_gap([])', '0'), t.hidden('max_gap([0, 10, 12])', '10'), t.hidden('max_gap([5, 5, 5])', '0')],
        signature: 'gate:running-max-gap',
        minutes: 5,
      }),
      write({
        id: 'c1-g-new-lows',
        title: 'New low prices',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['state_tracking', 'accumulator'],
        prompt: '`prices` is a list of prices in time order. A price is a new low when it is lower than every price before it. The first price is always a new low. Return how many new lows there are.\n\n`new_lows([5, 7, 3, 3, 1])` → `3`\n`new_lows([])` → `0`',
        starterCode: `def new_lows(prices):
    pass
`,
        solution: `def new_lows(prices):
    count = 0
    low = None
    for p in prices:
        if low is None or p < low:
            count = count + 1
            low = p
    return count
`,
        tests: [t.eq('new_lows([5, 7, 3, 3, 1])', '3'), t.eq('new_lows([])', '0'), t.eq('new_lows([1, 2, 3])', '1'), t.hidden('new_lows([4, 3, 2, 1])', '4'), t.hidden('new_lows([0, -1, 5, -1])', '2')],
        signature: 'gate:running-new-lows',
        minutes: 5,
      }),
      write({
        id: 'c1-g-streak-of',
        title: 'Longest streak of one activity',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['state_tracking', 'accumulator'],
        prompt: '`days` is a list of activity names, one per day. Return the most days in a row that were `target`. If `target` never appears, return `0`.\n\n`streak_of(["run", "run", "rest", "run"], "run")` → `2`\n`streak_of(["rest"], "run")` → `0`',
        starterCode: `def streak_of(days, target):
    pass
`,
        solution: `def streak_of(days, target):
    best = 0
    current = 0
    for d in days:
        if d == target:
            current = current + 1
        else:
            current = 0
        if current > best:
            best = current
    return best
`,
        tests: [t.eq('streak_of(["run", "run", "rest", "run"], "run")', '2'), t.eq('streak_of(["rest"], "run")', '0'), t.eq('streak_of([], "run")', '0'), t.hidden('streak_of(["rest", "run", "run", "run"], "run")', '3'), t.hidden('streak_of(["swim", "swim"], "swim")', '2')],
        signature: 'gate:running-streak',
        minutes: 5,
      }),

      // g-mutation-references
      output({
        id: 'c1-g-alias-trace',
        title: 'Three names',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['list_append', 'functions', 'list_index'],
        prompt: 'Predict the output.',
        code: `def grow(xs):
    xs.append(0)

a = [1, 2]
b = a
c = list(a)
grow(b)
c[0] = 5
print(a)
print(b)
print(c)`,
        expectedOutput: '[1, 2, 0]\n[1, 2, 0]\n[5, 2]',
        signature: 'gate:alias-trace',
        minutes: 2,
      }),
      write({
        id: 'c1-g-remove-in-place',
        title: 'Clear out one value',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['list_append', 'functions', 'list_index'],
        prompt: '`items` is a list. Remove every item equal to `target` from `items` itself. Do not build a new list, and return nothing.\n\nAfter `remove_all(x, "x")` with `x = ["a", "x", "x", "b"]`, `x` is `["a", "b"]`.',
        starterCode: `def remove_all(items, target):
    pass
`,
        solution: `def remove_all(items, target):
    i = 0
    while i < len(items):
        if items[i] == target:
            items.pop(i)
        else:
            i = i + 1
`,
        tests: [
          t.check('removes neighbours', 'x = ["a", "x", "x", "b"]\nremove_all(x, "x")\nassert x == ["a", "b"], x'),
          t.check('removes at both ends', 'x = [0, 1, 0]\nremove_all(x, 0)\nassert x == [1], x'),
          t.check('returns nothing', 'x = [1]\nassert remove_all(x, 2) is None and x == [1]'),
          t.check('all removed', 'x = [3, 3, 3]\nremove_all(x, 3)\nassert x == [], x', true),
          t.check('same list object', 'x = [1, 2, 1]\ny = x\nremove_all(x, 1)\nassert y == [2], y', true),
        ],
        signature: 'gate:remove-in-place',
        minutes: 5,
      }),
      write({
        id: 'c1-g-copy-not-alias',
        title: 'Blank game board',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['list_append', 'functions', 'list_index'],
        prompt: 'Return a game board with `rows` rows and `cols` columns. Every cell is `"."`. Changing one cell must change only that cell.\n\n`make_board(2, 3)` → `[[".", ".", "."], [".", ".", "."]]`\n`make_board(0, 3)` → `[]`',
        starterCode: `def make_board(rows, cols):
    pass
`,
        solution: `def make_board(rows, cols):
    board = []
    for _ in range(rows):
        board.append(["."] * cols)
    return board
`,
        tests: [
          t.eq('make_board(2, 3)', '[[".", ".", "."], [".", ".", "."]]'),
          t.eq('make_board(0, 3)', '[]'),
          t.check('one cell changes alone', 'b = make_board(3, 2)\nb[0][1] = "X"\nassert b == [[".", "X"], [".", "."], [".", "."]], b'),
          t.check('rows are separate lists', 'b = make_board(2, 2)\nassert b[0] is not b[1]', true),
        ],
        signature: 'gate:board-separate-rows',
        minutes: 4,
      }),
      write({
        id: 'c1-g-swap-ends',
        title: 'Swap first and last',
        gate: true,
        stage: 'retrieval',
        repType: 'cold',
        skills: ['list_append', 'functions', 'list_index'],
        prompt: '`items` is a list. Swap its first and last items in `items` itself, and return nothing. A list with fewer than two items stays the same.\n\nAfter `swap_ends(x)` with `x = [1, 2, 3]`, `x` is `[3, 2, 1]`.',
        starterCode: `def swap_ends(items):
    pass
`,
        solution: `def swap_ends(items):
    if len(items) < 2:
        return
    first = items[0]
    items[0] = items[-1]
    items[-1] = first
`,
        tests: [
          t.check('three items', 'x = [1, 2, 3]\nswap_ends(x)\nassert x == [3, 2, 1], x'),
          t.check('two items', 'x = ["a", "b"]\nswap_ends(x)\nassert x == ["b", "a"], x'),
          t.check('returns nothing', 'x = [1, 2]\nassert swap_ends(x) is None'),
          t.check('empty and single', 'x = []\nswap_ends(x)\ny = [7]\nswap_ends(y)\nassert x == [] and y == [7]', true),
          t.check('same list object', 'x = [1, 5, 9, 4]\ny = x\nswap_ends(x)\nassert y == [4, 5, 9, 1], y', true),
        ],
        signature: 'gate:swap-ends-in-place',
        minutes: 4,
      }),
    ],
  },
]
