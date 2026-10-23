import type { Section } from '@/lib/types'
import { code, t, write } from '@/data/exercises/build'

/**
 * Weeks 1–2 lab builds (REPS_2_MASTER_SPEC.md §9 "Mini Lab", §17, §48). Each lab
 * has a build and a change request; the change request starts from the
 * reference build and its tests cover the new rule plus the old behaviour.
 * Definitions (brief, requirements, design questions, review) live in
 * data/course/content/labs-w1w2.ts.
 */

const lab = { lab: true, stage: 'combine', repType: 'combine', difficulty: 3 } as const

// ── Lab 1: Savings Goal Simulator ─────────────────────────────────────────

const SAVINGS_STARTER = `def apply_month(balance, deposit, rate_percent, withdrawal):
    """One month: add the deposit, take the withdrawal (never below 0),
    add interest, round to cents. Give back the new balance."""
    pass


def simulate_savings(start, goal, deposit, rate_percent, withdrawals, max_months):
    """Run month by month until the goal or the month limit.
    Give back (months, history); months is -1 if the goal was not reached."""
    pass
`

const SAVINGS_BUILD = `def apply_month(balance, deposit, rate_percent, withdrawal):
    """One month: deposit, then withdrawal (never below 0), then interest, rounded to cents."""
    balance = balance + deposit
    balance = max(balance - withdrawal, 0)
    balance = balance + balance * rate_percent / 100
    return round(balance, 2)


def simulate_savings(start, goal, deposit, rate_percent, withdrawals, max_months):
    """Return (months, history). months is -1 if the goal is not reached in max_months."""
    balance = start
    history = []
    month = 0
    while balance < goal and month < max_months:
        month += 1
        withdrawal = withdrawals.get(month, 0)
        balance = apply_month(balance, deposit, rate_percent, withdrawal)
        history.append(balance)
    if balance >= goal:
        return (month, history)
    return (-1, history)
`

const SAVINGS_CHANGE = `def apply_month(balance, deposit, rate_percent, withdrawal):
    """One month: deposit, then withdrawal (never below 0), then interest, rounded to cents."""
    balance = balance + deposit
    balance = max(balance - withdrawal, 0)
    balance = balance + balance * rate_percent / 100
    return round(balance, 2)


def simulate_savings(start, goal, deposit, rate_percent, withdrawals, max_months, deposit_cap=None):
    """Return (months, history). months is -1 if the goal is not reached in max_months."""
    balance = start
    history = []
    month = 0
    deposited = 0
    while balance < goal and month < max_months:
        month += 1
        this_deposit = deposit
        if deposit_cap is not None:
            this_deposit = min(deposit, deposit_cap - deposited)
        deposited += this_deposit
        withdrawal = withdrawals.get(month, 0)
        balance = apply_month(balance, this_deposit, rate_percent, withdrawal)
        history.append(balance)
    if balance >= goal:
        return (month, history)
    return (-1, history)
`

// ── Lab 2: Inventory Processor ────────────────────────────────────────────

const INVENTORY_STARTER = `KINDS = ('receive', 'sell', 'return')


def validate_event(stock, event):
    """None if the event can be applied, else the reason it is rejected."""
    pass


def apply_event(stock, event):
    """Change stock in place for one valid event. Gives back None."""
    pass


def process_events(stock, events):
    """Apply every valid event to stock in place.
    Give back the rejected events as a list of (index, reason)."""
    pass
`

const INVENTORY_BUILD = `KINDS = ('receive', 'sell', 'return')


def validate_event(stock, event):
    """Return None if the event can be applied, else the reason it is rejected."""
    kind, item, qty = event
    if kind not in KINDS:
        return 'unknown kind'
    if type(qty) is not int or qty <= 0:
        return 'bad quantity'
    if kind == 'sell' and stock.get(item, 0) < qty:
        return 'not enough stock'
    if kind == 'return' and item not in stock:
        return 'unknown item'
    return None


def apply_event(stock, event):
    """Change stock in place for one valid event. Returns None."""
    kind, item, qty = event
    if kind == 'sell':
        stock[item] -= qty
    else:
        stock[item] = stock.get(item, 0) + qty


def process_events(stock, events):
    """Apply every valid event to stock in place. Return the rejected ones as (index, reason)."""
    rejected = []
    for i, event in enumerate(events):
        reason = validate_event(stock, event)
        if reason is None:
            apply_event(stock, event)
        else:
            rejected.append((i, reason))
    return rejected
`

const INVENTORY_CHANGE =
  INVENTORY_BUILD +
  `

def daily_report(stock, events, threshold):
    """Process events, then report rejections and the items to reorder."""
    rejected = process_events(stock, events)
    low = set()
    for item, qty in stock.items():
        if qty < threshold:
            low.add(item)
    for i, reason in rejected:
        if reason == 'not enough stock':
            low.add(events[i][1])
    return {'rejected': rejected, 'low': sorted(low)}
`

// ── Lab 3: Pricing Engine ─────────────────────────────────────────────────

const PRICING_STARTER = `COUPONS = {'SAVE10': ('percent', 10), 'FIVEOFF': ('cents', 500)}
TAX_PERCENT = 8


def check_item(item):
    """Raise ValueError if qty is below 1 or price_cents is negative."""
    pass


def line_total(item):
    """price_cents times qty."""
    pass


def bulk_discount(item):
    """10% off a line with 10 or more units, rounded down to a whole cent."""
    pass


def coupon_discount(amount, code):
    """Cents off amount for a coupon code. None means no coupon.
    Unknown codes raise ValueError."""
    pass


def tax_on(amount):
    """8% tax, rounded to the nearest cent (half up)."""
    pass


def price_order(items, coupon=None):
    """Give back {'subtotal', 'discount', 'tax', 'total'}, all in cents."""
    pass
`

const PRICING_BUILD = `COUPONS = {'SAVE10': ('percent', 10), 'FIVEOFF': ('cents', 500)}
TAX_PERCENT = 8


def check_item(item):
    """Raise ValueError if a line item is invalid."""
    if item['qty'] < 1:
        raise ValueError('bad quantity')
    if item['price_cents'] < 0:
        raise ValueError('bad price')


def line_total(item):
    """Price times quantity, in cents."""
    return item['price_cents'] * item['qty']


def bulk_discount(item):
    """10% off a line with 10 or more units, rounded down to a whole cent."""
    if item['qty'] >= 10:
        return line_total(item) * 10 // 100
    return 0


def coupon_discount(amount, code):
    """Cents off for a coupon code. None means no coupon. Unknown codes raise ValueError."""
    if code is None:
        return 0
    key = code.strip().upper()
    if key not in COUPONS:
        raise ValueError('unknown coupon')
    kind, value = COUPONS[key]
    if kind == 'percent':
        return amount * value // 100
    return min(value, amount)


def tax_on(amount):
    """8% tax, rounded half up to a whole cent."""
    return (amount * TAX_PERCENT + 50) // 100


def price_order(items, coupon=None):
    """Return {'subtotal', 'discount', 'tax', 'total'} in cents."""
    for item in items:
        check_item(item)
    subtotal = 0
    discount = 0
    for item in items:
        subtotal += line_total(item)
        discount += bulk_discount(item)
    discount += coupon_discount(subtotal - discount, coupon)
    tax = tax_on(subtotal - discount)
    return {'subtotal': subtotal, 'discount': discount, 'tax': tax, 'total': subtotal - discount + tax}
`

const PRICING_CHANGE =
  PRICING_BUILD.replace('discount += bulk_discount(item)', 'discount += line_discount(item)') +
  `

def deal_discount(item):
    """Buy 2 get 1 free on snacks: every third unit is free."""
    if item['category'] == 'snacks':
        return (item['qty'] // 3) * item['price_cents']
    return 0


def line_discount(item):
    """A snacks line gets the deal and never the bulk discount. Every other line gets the bulk discount."""
    if item['category'] == 'snacks':
        return deal_discount(item)
    return bulk_discount(item)
`

/** One line-item literal for pricing tests. */
const item = (price: number, qty: number, category = 'misc') => `{'sku': 'x', 'price_cents': ${price}, 'qty': ${qty}, 'category': '${category}'}`

/** A check that the call raises ValueError. */
const raises = (name: string, call: string, hidden = false) =>
  t.check(name, `try:\n    ${call}\n    raise AssertionError('expected ValueError')\nexcept ValueError:\n    pass`, hidden)

// ── Lab 4: Shipping Eligibility Engine ────────────────────────────────────

const SHIPPING_STARTER = `INTERNATIONAL = {'CA', 'MX', 'GB', 'DE'}
MAX_WEIGHT = 30
EXPRESS_MAX_WEIGHT = 20


def check_order(order):
    """Raise ValueError if weight_kg is not above 0 or value is negative."""
    pass


def zone(country):
    """'domestic' for 'US', 'international' for a country in INTERNATIONAL, else None."""
    pass


def allowed_methods(order):
    """The methods this order may use, as a list in the order ['standard', 'express']."""
    pass


def cost(method, order):
    """Shipping cost in dollars for one allowed method."""
    pass


def shipping_options(order):
    """Give back {method: cost} for every allowed method. {} means it cannot ship."""
    pass
`

const SHIPPING_BUILD = `INTERNATIONAL = {'CA', 'MX', 'GB', 'DE'}
MAX_WEIGHT = 30
EXPRESS_MAX_WEIGHT = 20


def check_order(order):
    """Raise ValueError if the weight is not positive or the value is negative."""
    if order['weight_kg'] <= 0:
        raise ValueError('bad weight')
    if order['value'] < 0:
        raise ValueError('bad value')


def zone(country):
    """'domestic' for US, 'international' for a country we ship to, else None."""
    if country == 'US':
        return 'domestic'
    if country in INTERNATIONAL:
        return 'international'
    return None


def allowed_methods(order):
    """The methods this order may use, in the order ['standard', 'express']."""
    where = zone(order['country'])
    flags = order['flags']
    if where is None or order['weight_kg'] > MAX_WEIGHT:
        return []
    if 'hazmat' in flags:
        if where == 'international':
            return []
        return ['standard']
    methods = ['standard']
    express_ok = order['weight_kg'] <= EXPRESS_MAX_WEIGHT and 'oversize' not in flags
    if where == 'international' and order['value'] < 200:
        express_ok = False
    if express_ok:
        methods.append('express')
    return methods


def cost(method, order):
    """Shipping cost in dollars for one allowed method."""
    domestic = zone(order['country']) == 'domestic'
    if method == 'standard':
        if domestic:
            return 0 if order['value'] >= 50 else 5
        return 15
    return 20 if domestic else 40


def shipping_options(order):
    """Return {method: cost} for every allowed method. {} means it cannot ship."""
    check_order(order)
    return {m: cost(m, order) for m in allowed_methods(order)}
`

const SHIPPING_CHANGE = SHIPPING_BUILD.replace('EXPRESS_MAX_WEIGHT = 20', 'EXPRESS_MAX_WEIGHT = 15').replace(
  `    if 'hazmat' in flags:`,
  `    if 'battery' in flags and where == 'international':
        return []
    if 'hazmat' in flags:`,
)

/** One order literal for shipping tests. */
const order = (w: number, country: string, value: number, flags: string[] = []) =>
  `{'weight_kg': ${w}, 'country': '${country}', 'value': ${value}, 'flags': [${flags.map((f) => `'${f}'`).join(', ')}]}`

export const sections: Section[] = [
  {
    id: 'labs-w1w2',
    title: 'Labs: Weeks 1–2',
    summary: 'Four small programs built from parts: a savings simulator, an inventory processor, a pricing engine and a shipping rules engine, each with a change request.',
    exercises: [
      // ── Savings Goal Simulator ──
      write({
        ...lab,
        id: 'lab-savings-goal-build',
        title: 'Savings Goal Simulator: build',
        skills: ['while_loop', 'state_tracking', 'functions'],
        minutes: 35,
        prompt: `You are building a savings simulator. Each month the balance changes in a fixed order. You stop when the goal is reached or you run out of months.

Write two functions.

**\`apply_month(balance, deposit, rate_percent, withdrawal)\`** returns the balance after one month:
1. Add \`deposit\`.
2. Take away \`withdrawal\`. If that would go below 0, the balance becomes 0.
3. Add interest: the balance times \`rate_percent / 100\`.
4. Round to cents with \`round(balance, 2)\`.

**\`simulate_savings(start, goal, deposit, rate_percent, withdrawals, max_months)\`** runs the months:
1. The balance starts at \`start\`. Months are numbered from 1.
2. \`withdrawals\` is a dict from month number to amount. Months not in it have no withdrawal.
3. Before each month, check the balance. Stop if it is at least \`goal\`, or if \`max_months\` months have run.
4. After each month, add the new balance to a list called the history.
5. Return \`(months, history)\`. \`months\` is the number of months it took to reach the goal.
6. If the goal was never reached, \`months\` is \`-1\`.
7. If \`start\` already meets the goal, return \`(0, [])\`.

Examples:
- \`simulate_savings(0, 300, 100, 0, {}, 12)\` → \`(3, [100.0, 200.0, 300.0])\`
- \`simulate_savings(0, 1000, 100, 0, {}, 3)\` → \`(-1, [100.0, 200.0, 300.0])\` (out of months)
- \`apply_month(100, 50, 0, 500)\` → \`0\` (a withdrawal never takes the balance below 0)`,
        starterCode: SAVINGS_STARTER,
        solution: SAVINGS_BUILD,
        hints: [
          'Keep three pieces of state: the balance, the month number and the history list.',
          'The loop condition is the two stopping rules joined with `and`: keep going while the goal is not met and months remain.',
          'Use `withdrawals.get(month, 0)` for months with no withdrawal.',
        ],
        tests: [
          t.eq('apply_month(100, 50, 1, 0)', '151.5'),
          t.eq('apply_month(100, 50, 0, 500)', '0'),
          t.eq('simulate_savings(0, 300, 100, 0, {}, 12)', '(3, [100.0, 200.0, 300.0])'),
          t.eq('simulate_savings(500, 300, 100, 0, {}, 12)', '(0, [])'),
          t.eq('simulate_savings(0, 1000, 100, 0, {}, 3)', '(-1, [100.0, 200.0, 300.0])'),
          t.eq('simulate_savings(0, 300, 100, 0, {2: 150}, 12)', '(5, [100.0, 50.0, 150.0, 250.0, 350.0])'),
          t.eq('simulate_savings(1000, 1100, 0, 1, {}, 24)', '(10, [1010.0, 1020.1, 1030.3, 1040.6, 1051.01, 1061.52, 1072.14, 1082.86, 1093.69, 1104.63])'),
          t.hidden('apply_month(1000, 0, 0.5, 0)', '1005.0'),
          t.hidden('simulate_savings(0, 100, 0, 5, {}, 6)', '(-1, [0.0, 0.0, 0.0, 0.0, 0.0, 0.0])'),
          t.hidden('simulate_savings(100, 500, 100, 2, {1: 1000, 3: 50}, 10)', '(7, [0.0, 102.0, 155.04, 260.14, 367.34, 476.69, 588.22])'),
          t.hidden('simulate_savings(0, 100, 100, 0, {}, 0)', '(-1, [])'),
          t.hidden('simulate_savings(0, 250, 100, 0, {}, 3)', '(3, [100.0, 200.0, 300.0])'),
        ],
      }),
      code({
        ...lab,
        id: 'lab-savings-goal-change',
        title: 'Savings Goal Simulator: change request',
        skills: ['while_loop', 'state_tracking', 'functions'],
        minutes: 20,
        style: 'from-signature',
        prompt: `Change request: cap total contributions. The editor holds the finished simulator.

Add an optional last parameter, \`deposit_cap=None\`, to \`simulate_savings\`.
1. \`deposit_cap\` is the most money that may be deposited over the whole run.
2. Each month, deposit \`deposit\` or whatever is left under the cap, whichever is smaller.
3. Once the cap is used up, the monthly deposit is 0. Interest and withdrawals still apply.
4. \`deposit_cap=None\` means no cap. Every old call must give the same answer as before.

Examples:
- \`simulate_savings(0, 300, 100, 0, {}, 5, 250)\` → \`(-1, [100.0, 200.0, 250.0, 250.0, 250.0])\` (the last 50 fits under the cap, then nothing)
- \`simulate_savings(0, 300, 100, 0, {}, 12)\` → \`(3, [100.0, 200.0, 300.0])\` (no cap, same as before)`,
        starterCode: SAVINGS_BUILD,
        solution: SAVINGS_CHANGE,
        hints: ['Add one more piece of state: how much has been deposited so far.', 'The deposit this month is `min(deposit, deposit_cap - deposited)`.'],
        tests: [
          t.eq('simulate_savings(0, 300, 100, 0, {}, 5, 250)', '(-1, [100.0, 200.0, 250.0, 250.0, 250.0])'),
          t.eq('simulate_savings(0, 250, 100, 0, {}, 5, 250)', '(3, [100.0, 200.0, 250.0])'),
          t.eq('simulate_savings(0, 300, 100, 0, {}, 12, 1000)', '(3, [100.0, 200.0, 300.0])'),
          t.eq('simulate_savings(0, 300, 100, 0, {}, 12)', '(3, [100.0, 200.0, 300.0])'),
          t.eq('simulate_savings(0, 220, 100, 10, {}, 6, 150)', '(5, [110.0, 176.0, 193.6, 212.96, 234.26])'),
          t.hidden('simulate_savings(0, 300, 100, 0, {}, 4, 0)', '(-1, [0.0, 0.0, 0.0, 0.0])'),
          t.hidden('simulate_savings(0, 300, 100, 0, {2: 150}, 6, 300)', '(-1, [100.0, 50.0, 150.0, 150.0, 150.0, 150.0])'),
          t.hidden('simulate_savings(500, 300, 100, 0, {}, 12, 0)', '(0, [])'),
          t.hidden('simulate_savings(0, 300, 100, 0, {2: 150}, 12)', '(5, [100.0, 50.0, 150.0, 250.0, 350.0])'),
        ],
      }),

      // ── Inventory Processor ──
      write({
        ...lab,
        id: 'lab-inventory-build',
        title: 'Inventory Processor: build',
        skills: ['dict_assign', 'dict_get', 'functions'],
        minutes: 35,
        prompt: `You are building the stock counter for a small shop. \`stock\` is a dict from item name to units on hand, like \`{'pen': 5}\`. An event is a tuple \`(kind, item, qty)\`.

Write three functions. Each does one job.

**\`validate_event(stock, event)\`** returns \`None\` if the event can be applied. Otherwise it returns the reason, checked in this order:
1. \`kind\` is not \`'receive'\`, \`'sell'\` or \`'return'\` → \`'unknown kind'\`.
2. \`qty\` is not an \`int\` above 0 → \`'bad quantity'\`.
3. A sale of more units than are on hand → \`'not enough stock'\`. An item missing from \`stock\` has 0 on hand.
4. A return of an item that is not in \`stock\` → \`'unknown item'\`.

**\`apply_event(stock, event)\`** changes \`stock\` in place for one valid event and returns \`None\`.
- \`'receive'\` and \`'return'\` add \`qty\`. A new item starts at 0.
- \`'sell'\` takes away \`qty\`. An item that reaches 0 stays in the dict.

**\`process_events(stock, events)\`** applies the events in order, changing \`stock\` in place.
- Skip a rejected event and leave \`stock\` as it was.
- Return the rejections as a list of \`(index, reason)\`, where \`index\` is the event's position in \`events\`.

Examples:
- \`validate_event({'pen': 2}, ('sell', 'pen', 3))\` → \`'not enough stock'\`
- \`process_events({'pen': 5}, [('sell', 'pen', 2), ('sell', 'pen', 9)])\` → \`[(1, 'not enough stock')]\` (stock ends as \`{'pen': 3}\`)
- \`process_events({}, [])\` → \`[]\``,
        starterCode: INVENTORY_STARTER,
        solution: INVENTORY_BUILD,
        hints: [
          'Unpack the event first: `kind, item, qty = event`.',
          '`stock.get(item, 0)` gives 0 for an item that is not there yet.',
          '`process_events` only calls the other two. It should not repeat their rules.',
        ],
        tests: [
          t.eq("validate_event({'pen': 2}, ('sell', 'pen', 3))", "'not enough stock'"),
          t.eq("validate_event({'pen': 2}, ('sell', 'pen', 2))", 'None'),
          t.eq("validate_event({}, ('return', 'pen', 1))", "'unknown item'"),
          t.eq("validate_event({}, ('steal', 'pen', 1))", "'unknown kind'"),
          t.eq("validate_event({}, ('receive', 'pen', 0))", "'bad quantity'"),
          t.eq("(lambda s: (apply_event(s, ('receive', 'cup', 4)), s))({'pen': 1})", "(None, {'pen': 1, 'cup': 4})"),
          t.eq("(lambda s: (process_events(s, [('sell', 'pen', 2), ('sell', 'pen', 9), ('receive', 'cup', 4)]), s))({'pen': 5})", "([(1, 'not enough stock')], {'pen': 3, 'cup': 4})"),
          t.eq("(lambda s: (process_events(s, []), s))({})", '([], {})'),
          t.hidden("validate_event({}, ('receive', 'pen', 2.5))", "'bad quantity'"),
          t.hidden("validate_event({}, ('ship', 'pen', -1))", "'unknown kind'"),
          t.hidden(
            "(lambda s: (process_events(s, [('receive', 'a', 3), ('sell', 'a', 3), ('return', 'a', 1), ('sell', 'a', 2), ('return', 'b', 1), ('ship', 'a', 1), ('receive', 'a', -2)]), s))({})",
            "([(3, 'not enough stock'), (4, 'unknown item'), (5, 'unknown kind'), (6, 'bad quantity')], {'a': 1})",
          ),
          t.hidden("(lambda s: (process_events(s, [('sell', 'x', 1)]), s))({})", "([(0, 'not enough stock')], {})"),
          t.hidden("(lambda s: (process_events(s, [('sell', 'pen', 2)]), s))({'pen': 2})", "([], {'pen': 0})"),
        ],
      }),
      code({
        ...lab,
        id: 'lab-inventory-change',
        title: 'Inventory Processor: change request',
        skills: ['dict_assign', 'sorting', 'functions'],
        minutes: 20,
        style: 'from-signature',
        prompt: `Change request: an end-of-day reorder report. The editor holds the finished processor.

Add **\`daily_report(stock, events, threshold)\`**. Reuse \`process_events\`; do not copy its rules.
1. Process \`events\` into \`stock\` in place, exactly as before.
2. An item is **low** if its stock after processing is below \`threshold\`.
3. An item is also low if any sale of it was rejected with \`'not enough stock'\`. This holds even if the item is not in \`stock\`.
4. Return \`{'rejected': rejected, 'low': low}\`. \`rejected\` is what \`process_events\` returned.
5. \`low\` is a sorted list of item names, each name once.

Examples:
- \`daily_report({'pen': 5, 'cup': 1}, [('sell', 'pen', 2)], 3)\` → \`{'rejected': [], 'low': ['cup']}\`
- \`daily_report({'pen': 5}, [('sell', 'pen', 9)], 3)\` → \`{'rejected': [(0, 'not enough stock')], 'low': ['pen']}\` (5 is not low, but a customer wanted more)`,
        starterCode: INVENTORY_BUILD,
        solution: INVENTORY_CHANGE,
        hints: ['Collect low items in a set, then return `sorted(...)` of it.', 'The rejected index points back into `events`; `events[i][1]` is the item.'],
        tests: [
          t.eq("daily_report({'pen': 5, 'cup': 1}, [('sell', 'pen', 2)], 3)", "{'rejected': [], 'low': ['cup']}"),
          t.eq("daily_report({'pen': 5}, [('sell', 'pen', 9)], 3)", "{'rejected': [(0, 'not enough stock')], 'low': ['pen']}"),
          t.eq('daily_report({}, [], 3)', "{'rejected': [], 'low': []}"),
          t.eq("(lambda s: (daily_report(s, [('sell', 'pen', 2)], 1), s))({'pen': 5})", "({'rejected': [], 'low': []}, {'pen': 3})"),
          t.eq("(lambda s: (process_events(s, [('sell', 'pen', 2), ('sell', 'pen', 9)]), s))({'pen': 5})", "([(1, 'not enough stock')], {'pen': 3})"),
          t.hidden(
            "(lambda s: (daily_report(s, [('sell', 'a', 3), ('sell', 'zz', 1), ('receive', 'b', 10)], 1), s))({'a': 3})",
            "({'rejected': [(1, 'not enough stock')], 'low': ['a', 'zz']}, {'a': 0, 'b': 10})",
          ),
          t.hidden("daily_report({'a': 2}, [('sell', 'a', 1)], 1)", "{'rejected': [], 'low': []}"),
          t.hidden("daily_report({'a': 0}, [('sell', 'a', 1), ('sell', 'a', 2)], 1)", "{'rejected': [(0, 'not enough stock'), (1, 'not enough stock')], 'low': ['a']}"),
          t.hidden("daily_report({}, [('return', 'x', 1), ('ship', 'y', 1)], 5)", "{'rejected': [(0, 'unknown item'), (1, 'unknown kind')], 'low': []}"),
        ],
      }),

      // ── Pricing Engine ──
      write({
        ...lab,
        id: 'lab-pricing-engine-build',
        title: 'Pricing Engine: build',
        skills: ['functions', 'edge_cases', 'conditionals'],
        minutes: 40,
        prompt: `You are building the checkout total for an online shop. All money is whole cents (an \`int\`), never floats.

A line item is a dict like \`{'sku': 'tea', 'price_cents': 250, 'qty': 2, 'category': 'drinks'}\`. \`price_order(items, coupon=None)\` returns \`{'subtotal': …, 'discount': …, 'tax': …, 'total': …}\`.

The rules, in this order:
1. **Validate.** If any item has \`qty\` below 1 or \`price_cents\` below 0, raise \`ValueError\`.
2. **Subtotal.** Add up \`price_cents * qty\` for every line.
3. **Bulk discount.** A line with 10 or more units gets 10% off that line. Round down to a whole cent: \`line_total * 10 // 100\`.
4. **Coupon.** \`COUPONS\` maps a code to a rule. \`'SAVE10'\` is 10% off (rounded down) and \`'FIVEOFF'\` is 500 cents off.
5. The coupon applies to the subtotal after bulk discounts. Codes ignore case and outer spaces, so \`' save10 '\` works.
6. A fixed coupon never takes the amount below 0. \`None\` means no coupon. An unknown code raises \`ValueError\`, even for an empty cart.
7. **Tax.** 8% of the amount after all discounts, rounded to the nearest cent with halves going up: \`(amount * 8 + 50) // 100\`.
8. \`discount\` is bulk plus coupon. \`total\` is \`subtotal - discount + tax\`. An empty cart is all zeros.

Write one small function per rule, with the signatures in the editor. \`price_order\` puts them together.

Examples:
- \`price_order([{'sku': 'tea', 'price_cents': 250, 'qty': 2, 'category': 'drinks'}])\` → \`{'subtotal': 500, 'discount': 0, 'tax': 40, 'total': 540}\`
- \`price_order([])\` → \`{'subtotal': 0, 'discount': 0, 'tax': 0, 'total': 0}\`
- \`tax_on(19)\` → \`2\` (1.52 cents rounds to 2)`,
        starterCode: PRICING_STARTER,
        solution: PRICING_BUILD,
        hints: [
          'Validate every item before adding anything up. A half-priced order is worse than an error.',
          'Keep the coupon step separate: `coupon_discount(amount, code)` only needs the amount after bulk discounts.',
          '`min(500, amount)` stops a fixed coupon from going below 0.',
        ],
        tests: [
          t.eq(`price_order([${item(250, 2)}])`, "{'subtotal': 500, 'discount': 0, 'tax': 40, 'total': 540}"),
          t.eq('price_order([])', "{'subtotal': 0, 'discount': 0, 'tax': 0, 'total': 0}"),
          t.eq(`price_order([${item(199, 10)}])`, "{'subtotal': 1990, 'discount': 199, 'tax': 143, 'total': 1934}"),
          t.eq(`price_order([${item(1000, 1)}], 'save10')`, "{'subtotal': 1000, 'discount': 100, 'tax': 72, 'total': 972}"),
          t.eq(`price_order([${item(300, 1)}], ' fiveoff ')`, "{'subtotal': 300, 'discount': 300, 'tax': 0, 'total': 0}"),
          t.eq('tax_on(19)', '2'),
          t.eq(`bulk_discount(${item(199, 9)})`, '0'),
          raises('unknown coupon raises ValueError', `price_order([${item(100, 1)}], 'BOGUS')`),
          t.hidden(`price_order([${item(1999, 3)}, ${item(105, 12)}], 'SAVE10')`, "{'subtotal': 7257, 'discount': 839, 'tax': 513, 'total': 6931}"),
          t.hidden("price_order([], 'SAVE10')", "{'subtotal': 0, 'discount': 0, 'tax': 0, 'total': 0}"),
          t.hidden(`price_order([${item(0, 3)}])`, "{'subtotal': 0, 'discount': 0, 'tax': 0, 'total': 0}"),
          t.hidden('coupon_discount(1999, None)', '0'),
          raises('unknown coupon on an empty cart raises', "price_order([], 'NOPE')", true),
          raises('qty 0 raises ValueError', `price_order([${item(100, 0)}])`, true),
          raises('negative price raises ValueError', `price_order([${item(100, 1)}, ${item(-5, 1)}])`, true),
        ],
      }),
      code({
        ...lab,
        id: 'lab-pricing-engine-change',
        title: 'Pricing Engine: change request',
        skills: ['functions', 'edge_cases', 'conditionals'],
        minutes: 25,
        style: 'from-signature',
        prompt: `Change request: buy 2, get 1 free on snacks. The editor holds the finished pricing engine.

1. The deal applies to any line whose \`category\` is \`'snacks'\`.
2. Every third unit on that line is free: the deal is \`(qty // 3) * price_cents\` off.
3. A snacks line gets the deal and never the bulk discount, even with 10 or more units.
4. Every other line keeps the bulk discount as before.
5. The deal counts as part of \`discount\`. The coupon then applies to what is left, as before.

Add \`deal_discount(item)\` and \`line_discount(item)\`, then use \`line_discount\` in \`price_order\`.

Examples:
- \`price_order([{'sku': 'chips', 'price_cents': 200, 'qty': 3, 'category': 'snacks'}])\` → \`{'subtotal': 600, 'discount': 200, 'tax': 32, 'total': 432}\`
- \`price_order([{'sku': 'chips', 'price_cents': 100, 'qty': 2, 'category': 'snacks'}])\` → \`{'subtotal': 200, 'discount': 0, 'tax': 16, 'total': 216}\` (two units, nothing free)`,
        starterCode: PRICING_BUILD,
        solution: PRICING_CHANGE,
        hints: ['Change one line in `price_order`: the per-line discount now comes from `line_discount(item)`.'],
        tests: [
          t.eq(`price_order([${item(200, 3, 'snacks')}])`, "{'subtotal': 600, 'discount': 200, 'tax': 32, 'total': 432}"),
          t.eq(`price_order([${item(100, 2, 'snacks')}])`, "{'subtotal': 200, 'discount': 0, 'tax': 16, 'total': 216}"),
          t.eq(`price_order([${item(100, 12, 'snacks')}])`, "{'subtotal': 1200, 'discount': 400, 'tax': 64, 'total': 864}"),
          t.eq(`price_order([${item(100, 3, 'drinks')}])`, "{'subtotal': 300, 'discount': 0, 'tax': 24, 'total': 324}"),
          t.eq(`price_order([${item(199, 10)}])`, "{'subtotal': 1990, 'discount': 199, 'tax': 143, 'total': 1934}"),
          t.eq(`line_discount(${item(100, 12)})`, '120'),
          t.hidden(`price_order([${item(150, 7, 'snacks')}, ${item(100, 10)}], 'FIVEOFF')`, "{'subtotal': 2050, 'discount': 900, 'tax': 92, 'total': 1242}"),
          t.hidden(`deal_discount(${item(100, 12, 'snacks')})`, '400'),
          t.hidden(`deal_discount(${item(100, 12, 'drinks')})`, '0'),
          t.hidden('price_order([])', "{'subtotal': 0, 'discount': 0, 'tax': 0, 'total': 0}"),
          raises('unknown coupon still raises', `price_order([${item(100, 3, 'snacks')}], 'BOGUS')`, true),
        ],
      }),

      // ── Shipping Eligibility Engine ──
      write({
        ...lab,
        id: 'lab-shipping-eligibility-build',
        title: 'Shipping Eligibility Engine: build',
        skills: ['edge_cases', 'conditionals', 'functions'],
        minutes: 40,
        prompt: `You are building the rules that decide how an order can ship. An order is a dict like \`{'weight_kg': 2, 'country': 'US', 'value': 30, 'flags': []}\`. \`value\` is in dollars. \`flags\` is a list of strings such as \`'hazmat'\` or \`'oversize'\`.

\`shipping_options(order)\` returns a dict from method to cost in dollars, like \`{'standard': 5, 'express': 20}\`. An empty dict means the order cannot ship.

The rules:
1. If \`weight_kg\` is 0 or less, or \`value\` is below 0, raise \`ValueError\`.
2. \`'US'\` is domestic. \`'CA'\`, \`'MX'\`, \`'GB'\` and \`'DE'\` are international. Any other country cannot ship.
3. An order over 30 kg cannot ship. Exactly 30 kg can.
4. A \`'hazmat'\` order gets standard only. Internationally, a \`'hazmat'\` order cannot ship at all.
5. Express needs a weight of 20 kg or less and no \`'oversize'\` flag.
6. International express also needs a \`value\` of at least 200.
7. Standard costs 5 domestic, or 0 when \`value\` is at least 50. International standard costs 15.
8. Express costs 20 domestic and 40 international.

Write one small function per job, with the signatures in the editor. The tests check the edges of every rule, so test them yourself first: 20 and 30 kg exactly, value 50 and 200 exactly.

Examples:
- \`shipping_options({'weight_kg': 2, 'country': 'US', 'value': 30, 'flags': []})\` → \`{'standard': 5, 'express': 20}\`
- \`shipping_options({'weight_kg': 5, 'country': 'CA', 'value': 199, 'flags': []})\` → \`{'standard': 15}\` (international express needs 200)
- \`shipping_options({'weight_kg': 2, 'country': 'FR', 'value': 500, 'flags': []})\` → \`{}\``,
        starterCode: SHIPPING_STARTER,
        solution: SHIPPING_BUILD,
        hints: [
          'Decide which methods are allowed first. Price them in a separate step.',
          'Return early for the cases that cannot ship at all: unknown country, over 30 kg, hazmat abroad.',
          'Keep the limits in named constants at the top. A rule change should be a one-line edit.',
        ],
        tests: [
          t.eq(`shipping_options(${order(2, 'US', 30)})`, "{'standard': 5, 'express': 20}"),
          t.eq(`shipping_options(${order(2, 'US', 50)})`, "{'standard': 0, 'express': 20}"),
          t.eq(`shipping_options(${order(2, 'FR', 500)})`, '{}'),
          t.eq(`shipping_options(${order(5, 'CA', 199)})`, "{'standard': 15}"),
          t.eq(`shipping_options(${order(5, 'CA', 200)})`, "{'standard': 15, 'express': 40}"),
          t.eq(`shipping_options(${order(5, 'US', 80, ['hazmat'])})`, "{'standard': 0}"),
          t.eq(`allowed_methods(${order(5, 'US', 10, ['oversize'])})`, "['standard']"),
          raises('weight 0 raises ValueError', `shipping_options(${order(0, 'US', 10)})`),
          t.hidden(`shipping_options(${order(30, 'US', 10)})`, "{'standard': 5}"),
          t.hidden(`shipping_options(${order(30.5, 'US', 10)})`, '{}'),
          t.hidden(`shipping_options(${order(20, 'US', 10)})`, "{'standard': 5, 'express': 20}"),
          t.hidden(`shipping_options(${order(20.1, 'US', 10)})`, "{'standard': 5}"),
          t.hidden(`shipping_options(${order(5, 'DE', 900, ['hazmat'])})`, '{}'),
          t.hidden(`shipping_options(${order(5, 'GB', 300, ['fragile'])})`, "{'standard': 15, 'express': 40}"),
          raises('negative value raises ValueError', `shipping_options(${order(1, 'US', -1)})`, true),
        ],
      }),
      code({
        ...lab,
        id: 'lab-shipping-eligibility-change',
        title: 'Shipping Eligibility Engine: rule change',
        skills: ['edge_cases', 'conditionals', 'functions'],
        minutes: 20,
        style: 'from-signature',
        prompt: `Rule change from the carrier. The editor holds the finished engine.

1. Express now needs a weight of **15 kg** or less, down from 20 kg. Exactly 15 kg still gets express.
2. A new flag, \`'battery'\`, means the order cannot ship internationally at all.
3. A domestic \`'battery'\` order ships as normal.
4. Every other rule stays the same.

Before you change the code, list the old tests this breaks. Then add the new edges: 15 kg, just over 15 kg, and a battery order on each side of the border.

Examples:
- \`shipping_options({'weight_kg': 16, 'country': 'US', 'value': 10, 'flags': []})\` → \`{'standard': 5}\` (over the new express limit)
- \`shipping_options({'weight_kg': 2, 'country': 'CA', 'value': 900, 'flags': ['battery']})\` → \`{}\``,
        starterCode: SHIPPING_BUILD,
        solution: SHIPPING_CHANGE,
        hints: ['If the express limit is a named constant, the first rule is a one-line change.', 'Put the battery check next to the hazmat check: both stop an international order early.'],
        tests: [
          t.eq(`shipping_options(${order(16, 'US', 10)})`, "{'standard': 5}"),
          t.eq(`shipping_options(${order(15, 'US', 10)})`, "{'standard': 5, 'express': 20}"),
          t.eq(`shipping_options(${order(2, 'CA', 900, ['battery'])})`, '{}'),
          t.eq(`shipping_options(${order(2, 'US', 60, ['battery'])})`, "{'standard': 0, 'express': 20}"),
          t.eq(`shipping_options(${order(2, 'US', 30)})`, "{'standard': 5, 'express': 20}"),
          t.eq(`shipping_options(${order(5, 'CA', 200)})`, "{'standard': 15, 'express': 40}"),
          t.hidden(`shipping_options(${order(15.5, 'GB', 300)})`, "{'standard': 15}"),
          t.hidden(`shipping_options(${order(20, 'US', 10)})`, "{'standard': 5}"),
          t.hidden(`shipping_options(${order(5, 'US', 80, ['hazmat', 'battery'])})`, "{'standard': 0}"),
          t.hidden(`shipping_options(${order(2, 'FR', 500)})`, '{}'),
          t.hidden(`shipping_options(${order(30.5, 'US', 10)})`, '{}'),
          raises('weight 0 still raises ValueError', `shipping_options(${order(0, 'CA', 10, ['battery'])})`, true),
        ],
      }),
    ],
  },
]
