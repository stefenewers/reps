import type { Lab } from '@/data/course/types'

/**
 * Labs for Weeks 9–13 (REPS_2_MASTER_SPEC.md §9 "Mini Lab", §17, §34, §47, §48).
 * Exercises live in data/exercises/course/labs-w9w13.ts.
 */
export const labs: Lab[] = [
  {
    id: 'lab-dependency-planner',
    title: 'Dependency Planner',
    week: 9,
    unitId: 'w9-cycles',
    brief:
      'A release pipeline has tasks that must wait for other tasks. Build the planner that checks the task list, finds a cycle when there is one, and otherwise produces an order the pipeline can run.',
    requirements: [
      '`tasks` is a dict from a task name to the list of tasks it needs first.',
      '`check_tasks(tasks)` returns a sorted list of problems, one per prerequisite that is not a task, like "deploy needs unknown test".',
      '`find_cycle(tasks)` returns one cycle that starts and ends with the same task, or `[]`. Tasks and prerequisites are visited in alphabetical order.',
      '`plan_order(tasks)` returns every task after all of its prerequisites. Among ready tasks, the alphabetically smallest goes first. A cycle gives `None`.',
      '`plan(tasks)` returns `("error", problems)`, then `("cycle", cycle)`, then `("ok", order)`, in that order of priority.',
      'An empty task dict is a valid, empty plan. A task listed twice as a prerequisite counts once.',
    ],
    designQuestions: [
      'Which way do your edges point: from a task to what it needs, or from a prerequisite to what it unlocks? Which function wants which direction?',
      'What are the three states a task can be in during the cycle search, and what does reaching a "visiting" task mean?',
      'How do you turn the path you are on into the cycle you return?',
      'For the order, what do you keep per task so you know when it becomes ready? What structure holds the ready tasks?',
      'Why must unknown prerequisites be caught before the order is computed? What would break otherwise?',
      'How can you tell from the order alone that a cycle stopped it?',
      'What are the time and space costs in terms of tasks and prerequisites?',
    ],
    buildExerciseId: 'lab-dependency-planner-build',
    changeRequest: {
      title: 'Run independent tasks at the same time',
      description:
        'The team now has enough runners to work in parallel. Add `plan_batches(tasks)`: the first batch is every task that needs nothing, and each later batch is every task whose prerequisites are all in earlier batches. Invalid input or a cycle gives `None`.',
      exerciseId: 'lab-dependency-planner-change',
    },
    review: [
      'A self-dependency (`{"a": ["a"]}`) and a three-task loop are both reported as cycles.',
      'The cycle you return really is a path: each task in it needs the next one.',
      'Every task appears exactly once in the order, after all of its prerequisites.',
      'No function mutates the `tasks` dict it was given.',
      'You can say why the visiting/done states are needed, not just a single visited set.',
    ],
  },
  {
    id: 'lab-priority-queue',
    title: 'Priority Support Queue',
    week: 9,
    unitId: 'w9-heaps',
    optional: true,
    brief:
      'A support desk needs to always work on the most urgent open ticket. Build the queue with `heapq`: serve the next ticket, close tickets early, and show the top few without removing them.',
    requirements: [
      'Priority 1 is the most urgent. Equal priority goes by earlier arrival, then by smaller id.',
      '`add(ticket_id, priority, arrival)` raises `ValueError` for an id that is already open.',
      '`serve()` removes and returns the most urgent open id, or `None` when nothing is open.',
      '`close(ticket_id)` returns `True` if the ticket was open, else `False`. A closed ticket is never served.',
      '`top_k(k)` returns up to `k` open ids in serve order and removes nothing.',
      '`size()` counts open tickets. A served or closed id can be added again.',
    ],
    designQuestions: [
      'What tuple or list do you push so the heap orders tickets by priority, then arrival, then id?',
      'Removing from the middle of a heap is slow. How will `close` work instead, and when does a closed entry get thrown away?',
      'If an id is closed and then added again with the same values, how do you tell the old heap entry from the new one?',
      'What does `top_k` cost with your design? When would keeping a separate size-k heap be better?',
      'What state does the queue hold, and which method is allowed to change each part of it?',
      'What should happen on `serve()` when the heap only holds closed tickets?',
    ],
    buildExerciseId: 'lab-priority-queue-build',
    changeRequest: {
      title: 'Escalate a ticket',
      description:
        'Agents need to bump a ticket that became more urgent. Add `escalate(ticket_id, priority)`: an open ticket gets a smaller priority and keeps its arrival time. Return `False` and change nothing if it is not open or the new priority is not smaller. Teach `run` the new operation.',
      exerciseId: 'lab-priority-queue-change',
    },
    review: [
      'No method sorts the whole queue; `serve` is O(log n) apart from skipping stale entries.',
      'A closed or escalated ticket never comes out of `serve` twice.',
      'Ties are broken exactly as required, and there is a test for each tie rule.',
      '`top_k` leaves the queue unchanged: `size()` and the next `serve()` are the same before and after.',
    ],
  },
  {
    id: 'lab-calendar-conflicts',
    title: 'Calendar Conflict Engine',
    week: 10,
    unitId: 'w10-intervals',
    brief:
      'A team calendar needs to flag double bookings and suggest open time. Build the engine that finds conflicting meetings, merges busy time into blocks, and lists the free slots long enough for a new meeting.',
    requirements: [
      'A meeting `(start, end)` is in minutes after midnight and covers `start` up to, but not including, `end`.',
      'Any meeting with `end <= start` raises `ValueError`.',
      '`conflicts(meetings)` returns the sorted pairs `(i, j)`, `i < j`, of meetings that overlap. Touching meetings do not conflict.',
      '`busy_blocks(meetings)` returns merged blocks sorted by start. Overlapping or touching meetings become one block.',
      '`free_slots(meetings, day_start, day_end, d)` returns the gaps inside the day that last at least `d` minutes.',
      'Parts of meetings outside the day are ignored.',
    ],
    designQuestions: [
      'Write the overlap test for two half-open meetings. Why does `(540, 600)` not conflict with `(600, 660)`?',
      'Why does sorting by start turn "compare every pair" into "compare with the block before"?',
      '`conflicts` must report original positions. How do you sort without losing them?',
      'Where does the cursor start in `free_slots`, and how do you clip a block that crosses the edge of the day?',
      'Touching blocks merge for busy time but are not a conflict. Is that a contradiction? Explain.',
      'What should every function do with an empty list?',
      'What does each function cost, and which one can be worse than O(n log n)? Why?',
    ],
    buildExerciseId: 'lab-calendar-conflicts-build',
    changeRequest: {
      title: 'Buffers and group scheduling',
      description:
        'People want a break after each meeting, and they want a slot that works for a whole group. `free_slots` takes `buffer` (default 0): each meeting blocks that many extra minutes after it. Add `common_free(calendars, day_start, day_end, d, buffer=0)` for a list of calendars.',
      exerciseId: 'lab-calendar-conflicts-change',
    },
    review: [
      'Inputs are not mutated, and unsorted input gives the same answers as sorted input.',
      'There are tests for touching meetings, a meeting inside another, and meetings that start before or end after the day.',
      'A gap exactly `d` minutes long is returned; one minute shorter is not.',
      '`common_free` reuses `free_slots` instead of copying its loop.',
      'Old calls without `buffer` give exactly the old answers.',
    ],
  },
  {
    id: 'lab-package-configurator',
    title: 'Package Configurator',
    week: 11,
    unitId: 'w11-backtracking',
    brief:
      'A laptop store lets customers pick one item from each category, but some items cannot go together and every order has a budget. Build the configurator that lists every valid configuration and finds the cheapest one.',
    requirements: [
      '`options` maps a category to its items. A configuration picks exactly one item per category.',
      '`banned` lists item pairs that cannot be in one configuration. A pair bans both orders.',
      '`prices` maps items to prices; a missing item costs 0. A configuration must cost at most `budget`.',
      '`configurations(options, banned, prices, budget)` returns every valid configuration, in category order and item order.',
      'A partial configuration that breaks a rule is not explored further.',
      '`cheapest(...)` returns the cheapest valid configuration, the first found on a tie, or `None`.',
    ],
    designQuestions: [
      'What is the state while you search: what has been chosen, which category is next, and what has it cost so far?',
      'Name the choose, explore and undo lines in your code. What breaks if you forget the undo?',
      'Why do you append a copy of the current choices instead of the list itself?',
      'Which rules can prune a partial configuration early, and why is that safe here? (Hint: prices are never negative.)',
      'How many configurations can there be in the worst case? What does pruning change and not change about that bound?',
      'What should `configurations({}, ...)` return, and why?',
    ],
    buildExerciseId: 'lab-package-configurator-build',
    changeRequest: {
      title: 'Items that require other items',
      description:
        'Some items only work with another item, like an i7 that needs 16gb of RAM. `configurations` and `cheapest` take `requires` (default `None`), a dict from an item to the item it needs. A configuration with such an item must also contain what it needs.',
      exerciseId: 'lab-package-configurator-change',
    },
    review: [
      'The search state is restored after every branch: run it twice and get the same answer.',
      'Banned pairs and the budget prune early; requirements are checked only on complete configurations, and you can say why.',
      'Results come out in category order and item order, with no duplicates.',
      'An empty category gives no configurations; no categories gives one empty configuration.',
    ],
  },
  {
    id: 'lab-minimum-cost',
    title: 'Minimum-Cost Plan',
    week: 11,
    unitId: 'w11-dp',
    brief:
      'A supplier sells units in packs of different sizes and prices. Build the planner that finds the fewest packs, the cheapest price and an actual cheapest plan for exactly `n` units, or says it cannot be done.',
    requirements: [
      '`fewest_packs(sizes, n)` returns the fewest packs that add up to exactly `n` units, or `-1`.',
      '`cheapest_cost(packs, n)` takes `(units, price)` packs and returns the lowest total price, or `-1`.',
      '`cheapest_plan(packs, n)` returns one cheapest plan as a sorted list of pack indexes, or `None`.',
      'Any number of each pack may be bought.',
      '`n = 0` needs no packs.',
      'The answer must be exact: taking the biggest pack first is not always best.',
    ],
    designQuestions: [
      'STATE: what does `best[a]` mean, in one sentence?',
      'BASE: what is `best[0]`, and what value marks "impossible" for the other amounts?',
      'RECURRENCE: how is `best[a]` built from smaller amounts?',
      'ORDER: in which order must amounts be filled so every value you read is final?',
      'Find a pack set where taking the biggest pack first gives the wrong answer.',
      'What extra table do you need to rebuild the plan, not just its price?',
      'What are the time and space costs in terms of `n` and the number of packs?',
    ],
    buildExerciseId: 'lab-minimum-cost-build',
    changeRequest: {
      title: 'Limited stock',
      description:
        'The warehouse is running low. A pack can now be `(units, price, stock)` and may be bought at most `stock` times; a two-item pack is still unlimited. `cheapest_cost` and `cheapest_plan` must respect stock.',
      exerciseId: 'lab-minimum-cost-change',
    },
    review: [
      'You can state STATE, BASE, RECURRENCE and ORDER for your solution out loud.',
      'Impossible amounts return `-1` or `None`, never infinity.',
      'The returned plan adds up to exactly `n` and costs exactly the cheapest price.',
      'Each limited pack is used at most `stock` times; you can say why the loop direction matters.',
      'There is a test where taking the biggest pack first is wrong.',
    ],
  },
  {
    id: 'lab-support-router',
    title: 'Support Router',
    week: 12,
    unitId: 'w12-dp-greedy',
    aiFde: true,
    brief:
      'A support desk lets a model propose one tool call per customer message. The model is a simulated, deterministic function that is sometimes malformed or proposes something it should not. Build the deterministic code around it that parses, validates, asks a human when the action is risky, runs the tool and keeps an audit log.',
    requirements: [
      '`parse_action(text)` returns `{"tool", "args"}` from the model\'s JSON text, or `None` if it is malformed.',
      '`validate(action)` rejects unknown tools, missing arguments, wrong argument types and unexpected arguments, using the `TOOLS` registry.',
      'A refund over `REFUND_APPROVAL_OVER` needs human approval. No approver means the action is denied.',
      'A malformed reply is retried once. A second malformed reply ends with status `failed`.',
      'A tool that raises ends with status `error`; the router itself never crashes.',
      '`handle` returns `{"status", "result", "log"}`. The log lists every step that happened, ending with `status:STATUS`.',
      'Everything is deterministic and local: no network, no randomness.',
    ],
    designQuestions: [
      'Draw the data flow from message to result. Where is the line between what the model decides and what your code decides?',
      'List the ways the model can fail (bad JSON, wrong shape, unknown tool, wrong types, extra args). Which check catches each one?',
      'Why is invalid output not retried, while malformed output is? When might retrying an invalid action make sense?',
      'Which actions need a human, and why should "no approver" mean no? What does the approver need to see?',
      'What goes in the audit log, and what must never go in it (think: customer data, secrets)? How would someone debug a bad refund from it?',
      'Each model call costs money and time. How many calls can one message cost, and where would you add a timeout?',
      'How would you eval this router: what labelled messages would you collect, and what would you measure?',
      'Why pass `model` and `approve` in as arguments instead of calling them directly?',
    ],
    buildExerciseId: 'lab-support-router-build',
    changeRequest: {
      title: 'Cancellations and a hard refund limit',
      description:
        'The customer wants order cancellation and a hard limit on refunds. Add a `cancel_order` tool that always needs human approval and fails for shipped orders. Refunds over `REFUND_BLOCK_OVER = 500` are blocked outright: they never reach the approver and never run.',
      exerciseId: 'lab-support-router-change',
    },
    review: [
      'Nothing the model returns runs before it is parsed, validated and, when needed, approved.',
      'Every status (`done`, `failed`, `invalid`, `denied`, `error`) has a test, and each one\'s log reads like a story.',
      '`True` is rejected as an amount; you can say why `isinstance` would let it through.',
      'Only `ValueError` is caught when parsing JSON; tool errors are caught where tools run.',
      'The model is called at most twice per message, and the log shows how many times.',
      'You can name one failure this design still does not handle.',
    ],
  },
  {
    id: 'lab-fde-workflow',
    title: 'FDE Customer Workflow',
    week: 13,
    unitId: 'w13-transfer',
    aiFde: true,
    brief:
      'A customer wants their intake emails routed to the right team. A simulated model extracts fields from each email; your workflow validates them, routes the ticket and measures routing accuracy on a labelled set. Halfway through, the customer changes the requirements.',
    requirements: [
      '`extract(text)` returns the dict in the model\'s JSON text, or `None` if it is not a JSON object.',
      '`validate(fields)` reports missing required fields, a bad email and an unknown category, in that order.',
      '`route(fields)` sends invalid tickets to `manual_review`. Valid ones go to `QUEUES[category]`, plus `_urgent` when urgency is high.',
      '`process(message, model)` runs model, extract, validate and route. Unreadable model text goes to `manual_review` with the error `unparseable`.',
      '`evaluate(labelled, model)` returns the routing accuracy, rounded to 2 places, and the positions it got wrong.',
      'The customer\'s categories, queues and required fields are data, not code scattered through functions.',
    ],
    designQuestions: [
      'What are the inputs, outputs and state of this workflow? Which parts belong to the customer and which to you?',
      'List the ways the model output can be wrong. Which are caught by validation, and which only show up in the eval?',
      'Why does an invalid ticket go to `manual_review` instead of being dropped or guessed?',
      'What does accuracy on six labelled emails tell you, and what does it not? What would you add to the labelled set next?',
      'Look at the misses. Is the fix in the model, the prompt, the validation or the routing rules?',
      'If each model call costs money and takes a second, what does running the eval cost, and how often would you run it?',
      'What would you log for each ticket so the customer can audit a wrong routing, without logging more personal data than needed?',
      'Which parts of your code will change if the customer adds a category or a field? Keep that list short.',
    ],
    buildExerciseId: 'lab-fde-workflow-build',
    changeRequest: {
      title: 'New security team and a required account id',
      description:
        'Mid-build, the customer adds a `security` category (queue `security`, always urgent) and makes `account_id` a required field. An account id is `ACC-` followed by digits. They also send a new labelled set, which must score 1.0.',
      exerciseId: 'lab-fde-workflow-change',
    },
    review: [
      'The change touched configuration plus one routing rule, not every function.',
      'Every field from the model passes through `validate` before it affects routing.',
      'The eval runs on the customer\'s labelled set and reports which examples missed, not just a number.',
      'You can explain each miss in plain language to the customer.',
      'Swapping in a different model function needs no code change.',
    ],
  },
]
