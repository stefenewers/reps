import type { Lab } from '@/data/course/types'

/**
 * Weeks 1–2 labs (REPS_2_MASTER_SPEC.md §9 "Mini Lab", §17, §34, §48):
 * DESIGN → BUILD → REVIEW → CHANGE REQUEST. The build and change exercises
 * live in data/exercises/course/labs-w1w2.ts.
 */
export const labs: Lab[] = [
  {
    id: 'lab-savings-goal',
    title: 'Savings Goal Simulator',
    week: 1,
    unitId: 'w1-loop-control',
    brief:
      'You are saving toward a goal. Each month you deposit money, sometimes withdraw some, and earn interest. Build a simulator that runs month by month and tells you how long it takes, with the balance after every month.',
    requirements: [
      '`apply_month(balance, deposit, rate_percent, withdrawal)` returns the balance after one month: add the deposit, take the withdrawal, add interest, round to cents.',
      'A withdrawal never takes the balance below 0; the balance becomes 0 instead.',
      '`simulate_savings(start, goal, deposit, rate_percent, withdrawals, max_months)` returns `(months, history)`.',
      'Months are numbered from 1. `withdrawals` maps a month number to an amount; other months have none.',
      'Stop as soon as the balance is at least the goal, or after `max_months` months.',
      '`history` holds the balance after each month that ran, in order.',
      '`months` is -1 if the goal was never reached. If `start` already meets the goal, return `(0, [])`.',
    ],
    designQuestions: [
      'Inputs: what does each parameter mean, and which ones can be 0 or empty?',
      'Outputs: what exactly is in the tuple, and what does -1 mean to the caller?',
      'State: what must the loop remember from one month to the next (balance, month number, history)?',
      'Functions: what belongs in `apply_month`, and what belongs in the loop around it?',
      'Data flow: in what order do deposit, withdrawal, interest and rounding happen, and why does the order change the answer?',
      'Failure modes: what stops the loop if the balance never grows (no deposit, no interest)?',
      'Validation: what should happen when the start already meets the goal, or `max_months` is 0?',
      'Tradeoffs: why a `while` loop here instead of `for month in range(max_months)`?',
    ],
    buildExerciseId: 'lab-savings-goal-build',
    changeRequest: {
      title: 'Cap total contributions',
      description:
        'Add an optional `deposit_cap=None` parameter to `simulate_savings`. It is the most money that may be deposited over the whole run. Each month deposit `deposit` or what is left under the cap, whichever is smaller; once the cap is used up the deposit is 0, while interest and withdrawals still apply. With no cap, every old call gives the same answer.',
      exerciseId: 'lab-savings-goal-change',
    },
    review: [
      'Every function does one job: `apply_month` knows one month, `simulate_savings` knows the loop.',
      'The loop condition states both stopping rules, and every pass changes the state it checks.',
      'Edge cases tested: goal already met, out of months, a withdrawal bigger than the balance, `max_months` of 0.',
      'Money is rounded once per month, in one place.',
      'The change request added state without touching `apply_month`, and old calls still pass.',
    ],
  },
  {
    id: 'lab-inventory',
    title: 'Inventory Processor',
    week: 1,
    unitId: 'w1-integration',
    brief:
      'A small shop logs every delivery, sale and customer return as an event. Build the processor that turns a day of events into current stock per item. Bad events are rejected and recorded, and the stock never goes negative.',
    requirements: [
      '`stock` is a dict from item to units on hand; an event is a tuple `(kind, item, qty)`.',
      '`validate_event(stock, event)` returns `None` or the first failing reason: `\'unknown kind\'`, `\'bad quantity\'`, `\'not enough stock\'`, `\'unknown item\'`.',
      '`qty` must be an `int` above 0. A sale cannot take more than is on hand. A return needs an item already in `stock`.',
      '`apply_event(stock, event)` changes `stock` in place: receive and return add, sell subtracts. It returns `None`.',
      'An item that reaches 0 stays in the dict with 0.',
      '`process_events(stock, events)` applies events in order and returns the rejections as `(index, reason)`.',
      'A rejected event leaves `stock` unchanged.',
    ],
    designQuestions: [
      'Inputs: what does one event look like, and what can be wrong with it?',
      'Outputs: the stock dict changes in place, so what does `process_events` return, and why?',
      'State: which object is mutated, and who else holding a reference to it will see the change?',
      'Functions: what is the one job of each of `validate_event`, `apply_event` and `process_events`?',
      'Data flow: why validate before applying, and what would go wrong if you applied first and checked after?',
      'Failure modes: which event types could make stock negative, and how is each one caught?',
      'Validation: in what order are the checks done, and does the order change the reason reported?',
      'Tradeoffs: rejecting a bad event and carrying on, versus stopping the whole batch at the first error.',
    ],
    buildExerciseId: 'lab-inventory-build',
    changeRequest: {
      title: 'End-of-day reorder report',
      description:
        "Add `daily_report(stock, events, threshold)`. It processes the events in place with `process_events`, then returns `{'rejected': rejected, 'low': low}`. An item is low if its stock is below `threshold`, or if any sale of it was rejected with 'not enough stock' (even when the item is not in `stock`). `low` is a sorted list of names with no repeats.",
      exerciseId: 'lab-inventory-change',
    },
    review: [
      'Every function does one job, and `process_events` only calls the other two.',
      'Stock is updated in place; no function builds and returns a new dict.',
      'Edge cases tested: empty event list, selling exactly what is on hand, selling an unknown item, a return of an unknown item, a zero or float quantity.',
      'Rejections carry the index, so a person can find the bad event in the log.',
      'The report reuses `process_events` instead of copying its rules.',
    ],
  },
  {
    id: 'lab-pricing-engine',
    title: 'Pricing Engine',
    week: 2,
    unitId: 'w2-contract',
    brief:
      'An online shop needs a checkout total from a cart of line items. The rules (bulk discount, coupons, tax, rounding) are simple one by one, but the order they apply in and the edge cases decide the answer. Work out the contract before writing code.',
    requirements: [
      "A line item is `{'sku', 'price_cents', 'qty', 'category'}`. All money is whole cents.",
      "`price_order(items, coupon=None)` returns `{'subtotal', 'discount', 'tax', 'total'}`.",
      'Any item with `qty` below 1 or a negative `price_cents` raises `ValueError`.',
      'A line with 10 or more units gets 10% off that line, rounded down to a whole cent.',
      "Coupons apply after bulk discounts: `'SAVE10'` is 10% off (rounded down), `'FIVEOFF'` is 500 cents off but never below 0. Codes ignore case and outer spaces.",
      'An unknown coupon raises `ValueError`, even on an empty cart. `None` means no coupon.',
      'Tax is 8% of the amount after discounts, rounded to the nearest cent with halves going up.',
      '`total` is `subtotal - discount + tax`. An empty cart is all zeros.',
    ],
    designQuestions: [
      'Inputs: what does a line item contain, and which values are invalid?',
      'Outputs: why return all four numbers instead of just the total?',
      'State: what running totals does `price_order` keep while it walks the cart?',
      'Functions: which rule does each small function own, and which function decides the order?',
      'Data flow: write the cart for `[250 x 2]` with `SAVE10` through every step by hand: subtotal, bulk, coupon, tax, total.',
      'Failure modes: what should an unknown coupon or a 0-quantity line do, and why is silently ignoring it risky?',
      'Validation: what is the rounding rule for discounts and for tax, and why use integer cents instead of floats?',
      'Tradeoffs: raising an error for a bad coupon versus ignoring it and charging full price.',
    ],
    buildExerciseId: 'lab-pricing-engine-build',
    changeRequest: {
      title: 'Buy 2, get 1 free on snacks',
      description:
        "Lines whose `category` is 'snacks' get every third unit free: `(qty // 3) * price_cents` off. A snacks line gets this deal and never the bulk discount, even with 10 or more units. Other lines keep the bulk discount. The deal counts in `discount`, and the coupon then applies to what is left. Add `deal_discount(item)` and `line_discount(item)`, and use `line_discount` in `price_order`.",
      exerciseId: 'lab-pricing-engine-change',
    },
    review: [
      'Every function does one job, and each rule lives in exactly one place.',
      'All money is integer cents, and each rounding rule is written once.',
      'Edge cases tested: empty cart, empty cart with a bad coupon, exactly 9 and 10 units, a fixed coupon larger than the order, a price of 0.',
      'Invalid input fails loudly with `ValueError` before any totals are computed.',
      'The change request was a new function plus a one-line change in `price_order`.',
    ],
  },
  {
    id: 'lab-shipping-eligibility',
    title: 'Shipping Eligibility Engine',
    week: 2,
    unitId: 'w2-testing',
    brief:
      'Given an order’s weight, destination, value and flags, decide which shipping methods it can use and what each costs. The rules have many boundaries, so most of the work is choosing the inputs that would break it. Write your own edge cases before you run the acceptance tests.',
    requirements: [
      "`shipping_options(order)` returns a dict from method to cost in dollars, like `{'standard': 5, 'express': 20}`. `{}` means it cannot ship.",
      'A weight of 0 or less, or a negative value, raises `ValueError`.',
      "'US' is domestic; 'CA', 'MX', 'GB' and 'DE' are international; any other country cannot ship.",
      'Over 30 kg cannot ship; exactly 30 kg can.',
      "A 'hazmat' order is standard only, and cannot ship internationally at all.",
      "Express needs 20 kg or less and no 'oversize' flag. International express also needs a value of at least 200.",
      'Standard costs 5 domestic (0 at a value of 50 or more) and 15 international. Express costs 20 domestic and 40 international.',
    ],
    designQuestions: [
      'Inputs: which fields of the order does each rule read?',
      'Outputs: why a dict of method to cost, and what does an empty dict tell the caller?',
      'State: does this engine need any state, or is every answer a function of the order alone?',
      'Functions: split it into eligibility (which methods) and pricing (what each costs). Where does each rule go?',
      'Data flow: in what order are the "cannot ship at all" checks done before the per-method checks?',
      'Failure modes: list every boundary (20 kg, 30 kg, value 50, value 200) and the inputs just below, on and above it.',
      'Validation: which inputs are errors (raise) and which are valid orders that simply cannot ship (return `{}`)?',
      'Tradeoffs: limits as named constants at the top versus numbers written inside the `if` statements.',
    ],
    buildExerciseId: 'lab-shipping-eligibility-build',
    changeRequest: {
      title: 'Carrier rule change',
      description:
        "Express now needs 15 kg or less, down from 20 kg (exactly 15 kg still qualifies). A new flag, 'battery', means the order cannot ship internationally at all; a domestic battery order ships as normal. Every other rule stays the same. List which old tests change before editing the code.",
      exerciseId: 'lab-shipping-eligibility-change',
    },
    review: [
      'Every function does one job: eligibility and pricing are separate.',
      'Edge cases tested: 20 and 30 kg exactly and just over, value 50 and 200 exactly, an unknown country, hazmat at home and abroad.',
      'Limits live in named constants, so the weight change was a one-line edit.',
      'Errors (bad weight, negative value) raise; valid orders that cannot ship return `{}`.',
      'After the rule change, the old tests that should still pass were run again and do.',
    ],
  },
]
