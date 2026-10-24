import type { Lesson } from '@/data/course/types'

/**
 * Applied Engineering and junior system design, Weeks 1–5: software as a system, then application
 * boundaries. Short lessons (5–10 minutes), runnable examples, think-then-reveal checks. Never counted.
 * Scheduled in data/course/applied.ts; the lane is described in docs/applied-engineering.md.
 */

const md = (...lines: string[]) => lines.join('\n')

export const appliedLessons: Lesson[] = [
  {
    id: 'sd-program-design',
    title: 'Designing a small program',
    thread: 'design',
    minutes: 7,
    concept:
      'Before you write a program, answer eight questions about it: what it needs (requirements), what goes in and comes out, which parts it has, what it must remember, how data moves through it, what can go wrong, what it must check, and what you are trading off.',
    mentalModel:
      'REQUIREMENTS → INPUT / OUTPUT → COMPONENTS → STATE → DATA FLOW → FAILURES → VALIDATION → TRADEOFFS. The same eight questions describe a 20-line function and a whole application. Every lab in this course asks them, and so do system design interviews.',
    whyItMatters:
      'Most bugs are design mistakes made before the first line: a missed edge case, state kept in the wrong place, a check done after the damage. Answering the questions first is faster than debugging later, and it is exactly what an interviewer means by "talk me through your design".',
    sections: [
      {
        heading: 'The eight questions',
        body: md(
          '1. **Requirements**: what must it do, in one or two sentences? What is out of scope?',
          '2. **Input / output**: what does the caller give it, and what exactly comes back (type, shape, meaning of special values)?',
          '3. **Components**: which small functions does it split into, each with one job?',
          '4. **State**: what must be remembered from one step to the next, and who owns it?',
          '5. **Data flow**: in what order does information enter, change and leave?',
          '6. **Failures**: what can go wrong: bad input, an empty case, a loop that never ends?',
          '7. **Validation**: what is checked, where, and what happens when a check fails?',
          '8. **Tradeoffs**: what did you choose, and what did that choice cost?',
          '',
          'You will not need all eight for every program. A tiny function might only need 2, 6 and 7. But walking the list is how you avoid forgetting one.'
        )
      },
      {
        heading: 'Worked example: a tip splitter',
        body: md(
          'Requirement: "Split a restaurant bill between friends, adding a tip. Everyone pays the same, in whole cents."',
          '',
          '- **Input / output**: in, `bill_cents` (int), `people` (int), `tip_percent` (int). Out, the amount each person pays, in cents.',
          '- **Components**: one function adds the tip, one splits it. Each is easy to test on its own.',
          '- **State**: none. Every answer depends only on the inputs.',
          '- **Data flow**: bill → add tip → split → round up so nobody is short.',
          '- **Failures**: `people` is 0 (dividing by zero), a negative bill.',
          '- **Validation**: reject both before doing any maths, with a clear message.',
          '- **Tradeoff**: rounding up means the group may pay a cent or two extra. Rounding down means the restaurant is short. We choose up, and say so.'
        ),
        code: `def with_tip(bill_cents, tip_percent):
    return bill_cents + bill_cents * tip_percent // 100

def split(total_cents, people):
    # Round up: -(-a // b) is ceiling division for positive numbers.
    return -(-total_cents // people)

def each_pays(bill_cents, people, tip_percent):
    if people <= 0:
        raise ValueError('people must be at least 1')
    if bill_cents < 0:
        raise ValueError('bill cannot be negative')
    return split(with_tip(bill_cents, tip_percent), people)

print(each_pays(10000, 3, 20))
try:
    each_pays(10000, 0, 20)
except ValueError as e:
    print('rejected:', e)`,
        output: '4000\nrejected: people must be at least 1'
      },
      {
        heading: 'Where state lives changes the design',
        body: md(
          'The tip splitter has no state. A program that runs over time usually does: a balance that changes each month, stock that goes up and down. Ask **who owns it** and **who is allowed to change it**.',
          '',
          'If three functions each change the same dict, a bug in any one of them corrupts it, and you cannot tell which. If one function owns the change and the others only read, the bug has one place to live. That is the reason labs ask you to split "validate" from "apply".'
        )
      },
      {
        heading: 'Validate before you act',
        body: md(
          'Order matters in data flow. If a program changes state and only then checks the input, a bad input has already done damage. Check first, then act:'
        ),
        code: `stock = {'apple': 3}

def remove(stock, item, qty):
    if qty <= 0:
        return 'rejected: quantity must be positive'
    if stock.get(item, 0) < qty:
        return 'rejected: not enough ' + item
    stock[item] -= qty
    return 'ok'

print(remove(stock, 'apple', 5))
print(stock)
print(remove(stock, 'apple', 2))
print(stock)`,
        output: "rejected: not enough apple\n{'apple': 3}\nok\n{'apple': 1}"
      }
    ],
    mistakes: [
      'Starting to code before writing down the output shape, then discovering the caller needed something else.',
      'Keeping the same state in two places (a count and a list) and updating only one of them.',
      'Checking input after changing state, so a rejected input still leaves damage behind.',
      'Treating "it works on my example" as validation. The edge cases from question 6 are the tests.',
      'Answering "tradeoffs" with "none". Every choice costs something: memory, speed, simplicity or a rounding cent.'
    ],
    checks: [
      {
        prompt:
          'A function `average_rating(ratings)` returns the mean of a list of 1–5 star ratings. Name two failures it must handle, and what you would return or raise for each.',
        answer:
          'An empty list (dividing by zero): return None or raise ValueError, and say which in the contract. A rating outside 1–5 (bad input): raise ValueError naming the bad value, rather than silently averaging it in.'
      },
      {
        prompt:
          'A program records deposits into an account. Function A adds to the balance, function B appends to a history list, function C does both again when a deposit is "confirmed". What design problem do you see?',
        answer:
          'The same state (balance and history) is changed in more than one place, so a deposit can be counted twice and the two can drift apart. Give one function ownership of applying a deposit (balance and history together), and have the others call it.'
      },
      {
        prompt: 'For the tip splitter, why is "round up" a tradeoff and not just a detail? What would you write in the contract?',
        answer:
          'Rounding changes who absorbs the leftover cents: rounding up means the group may overpay slightly, rounding down means the bill is short. It is a business decision, so the contract states it: "each person pays the total divided by people, rounded up to the cent".'
      }
    ]
  },  {
    id: 'ae-contracts-validation',
    title: 'Contracts and validation',
    thread: 'applied',
    minutes: 8,
    concept:
      'A contract is the deal between a caller and your code: what the caller promises to send, and what your code promises to do with it. Validation is where your code checks the caller kept their side, before it acts.',
    mentalModel:
      'A bouncer at the door. Everything that arrives is checked once, at the boundary, against a clear list. Inside, the rest of the code can trust what it holds. Anything that fails the check is turned away with a reason, not let in quietly.',
    whyItMatters:
      'Real inputs come from forms, files, other services and people in a hurry. If your code trusts them because they arrived, one bad value can charge the wrong price or ship to nobody, and nobody notices until a customer complains. Clear rejections are also how other engineers learn to call your code correctly.',
    sections: [
      {
        heading: 'Two sides of every contract',
        body: md(
          '**The caller promises** the shape of the input: which fields, which types, which ranges. A quantity is a whole number, at least 1.',
          '',
          '**Your code promises** the result: what it returns, what it changes, and what happens when the input breaks the deal.',
          '',
          'Write both down before you code. "Returns the seats left. Raises ValueError, naming the bad value, if `requested` is not a whole number of at least 1, or more than the seats left."'
        )
      },
      {
        heading: 'Rejecting with a reason: raise ValueError',
        body: md(
          '`raise ValueError("...")` stops the function at once and sends an error back to the caller. The caller can catch it with `try` / `except` and decide what to do. Name the bad value in the message: "got 0" is far more useful than "invalid input".'
        ),
        code: `def book_seats(seats_left, requested):
    if not isinstance(requested, int):
        raise ValueError(f'requested must be a whole number, got {requested!r}')
    if requested <= 0:
        raise ValueError(f'requested must be at least 1, got {requested}')
    if requested > seats_left:
        raise ValueError(f'only {seats_left} seats left, asked for {requested}')
    return seats_left - requested

for asked in [2, 0, 'two', 9]:
    try:
        print('ok, seats left:', book_seats(5, asked))
    except ValueError as e:
        print('rejected:', e)`,
        output: "ok, seats left: 3\nrejected: requested must be at least 1, got 0\nrejected: requested must be a whole number, got 'two'\nrejected: only 5 seats left, asked for 9"
      },
      {
        heading: 'Reject, repair or ignore?',
        body: md(
          'When input breaks the contract you have three choices:',
          '',
          '- **Reject**: raise an error, or return a clear error result. The safe default.',
          '- **Repair**: fix it and carry on, like trimming spaces from a name. Only when the fix is obvious and harmless, and the contract says so.',
          '- **Ignore**: drop it silently and carry on. Almost always a bug waiting to happen.',
          '',
          'Silent ignoring is risky because nobody finds out. Here a typo in a discount code (a letter O instead of a zero) quietly charges full price:'
        ),
        code: `def apply_discount(price_cents, code):
    if code == 'SAVE10':
        return price_cents - price_cents // 10
    return price_cents  # unknown code: silently ignored

def apply_discount_strict(price_cents, code):
    if code == 'SAVE10':
        return price_cents - price_cents // 10
    raise ValueError(f'unknown discount code {code!r}')

print(apply_discount(2000, 'SAVE1O'))
try:
    apply_discount_strict(2000, 'SAVE1O')
except ValueError as e:
    print('rejected:', e)`,
        output: "2000\nrejected: unknown discount code 'SAVE1O'"
      },
      {
        heading: 'Where the boundary goes',
        body: md(
          'Validate once, at the edge where data enters: the top of the public function. The small helpers inside can then assume clean input, which keeps them short and testable.',
          '',
          'Some inputs are not errors: an order that is valid but simply cannot ship might return an empty answer. Deciding which cases are **errors** (raise) and which are **valid but empty** (return) is part of the contract. This week\'s Pricing Engine and Shipping Eligibility labs ask exactly that question; answer it in writing before you build.',
          '',
          '**The tradeoff**: strict validation turns away some inputs a friendlier system might have guessed at. In exchange, nothing wrong gets through quietly.'
        )
      }
    ],
    mistakes: [
      'Trusting input because it came from "our own" form or service. Forms get bypassed and services change.',
      'Error messages like "invalid input" that do not say which value was wrong or why.',
      'Silently ignoring an unknown value (a coupon, a category) and carrying on with a default.',
      'Validating in several places, each slightly differently, instead of once at the boundary.',
      'Raising for cases the contract calls valid, like an order that simply has no shipping options.'
    ],
    checks: [
      {
        prompt:
          '`transfer(from_account, to_account, amount)` moves money between accounts. List three checks it needs before it changes any balance, and say what it should do when each one fails.',
        answer:
          'The amount is a positive number (raise ValueError naming it); both accounts exist (raise, naming the unknown account); the sender has enough money (raise or return a clear "insufficient funds" result). All three before any balance changes, so a failed transfer leaves both accounts untouched. Also worth checking: the two accounts are not the same one.'
      },
      {
        prompt:
          'A signup function receives an email of `"  Sam@Example.com "`. Is this a case to reject, repair or ignore? Justify your choice.',
        answer:
          'Repair is reasonable: trimming spaces and lower-casing an email is a safe, obvious fix, and the contract can say so. An email with no @ at all should be rejected, because there is no safe guess. Ignoring (storing it as given) leads to duplicate accounts and failed logins.'
      },
      {
        prompt: 'Why is "unknown coupon → charge full price, say nothing" worse than raising an error, even though the customer still gets charged?',
        answer:
          'Nobody learns anything went wrong: the customer expected a discount, support gets an angry email later, and the typo or bad code is never fixed. Raising (or returning a clear error) tells the caller at once, so the customer can correct the code before paying.'
      }
    ]
  },
  {
    id: 'ae-requirements-change',
    title: 'When requirements change',
    thread: 'applied',
    minutes: 6,
    concept:
      'Software changes mostly because the people who use it ask for something new. A requirement change is a new rule, a new case or a new field. Handling one well means changing the code without breaking anyone who relied on the old behaviour.',
    mentalModel:
      'Renovating a house people still live in. Before you knock anything down, find out who uses that room. Keep the doors they use where they are, add the new room beside them, and check the old rooms still work when you are done.',
    whyItMatters:
      'Every lab in this course has a change request, because real work does. On a job, most of your time goes into changing existing code safely, not writing new code from nothing. Forward deployed engineers live this daily: the customer learns what they want by using what you built.',
    sections: [
      {
        heading: 'Five questions for any change',
        body: md(
          '1. **What changed?** Say the new rule in one sentence.',
          '2. **Which assumptions broke?** What did the old code take for granted that is no longer true?',
          '3. **What must stay the same?** Who already calls this code, and what do they rely on?',
          '4. **Which tests change?** Old tests that still describe correct behaviour stay. New tests cover the new rule.',
          '5. **What new failure is possible?** A new input means new edge cases.'
        )
      },
      {
        heading: 'Worked example: free delivery for members',
        body: md(
          'Old rule: delivery is free up to 5 km, otherwise 300 cents. New request: "Members get free delivery up to 10 km."',
          '',
          'What must stay the same: every existing caller passes only a distance. So the new information comes in as a parameter with a **default** that reproduces the old behaviour. Old callers change nothing; their tests still pass.'
        ),
        code: `def delivery_fee(distance_km):
    if distance_km <= 5:
        return 0
    return 300

# The old tests still pass:
print(delivery_fee(3), delivery_fee(8))

# New requirement: members get free delivery up to 10 km.
def delivery_fee(distance_km, member=False):
    limit = 10 if member else 5
    if distance_km <= limit:
        return 0
    return 300

# Old callers do not pass member, so they behave exactly as before.
print(delivery_fee(3), delivery_fee(8))
# The new rule:
print(delivery_fee(8, member=True), delivery_fee(12, member=True))`,
        output: '0 300\n0 300\n0 300'
      },
      {
        heading: 'Tests are the record of what must not break',
        body: md(
          'Before changing anything, run the existing tests. They are the list of promises already made. After the change, run them again, then add tests for the new rule and its edges: a member at exactly 10 km, just over it, a non-member at 8 km.',
          '',
          'If an old test now fails, stop and ask: is this test wrong now (the requirement really changed), or did I break something? Never delete a failing test just to make the run green.',
          '',
          '**The tradeoff**: keeping old behaviour with defaults is safe, but every extra parameter makes the function a little harder to read. When the options pile up, it is time to restructure, and that is a change of its own, with its own tests.'
        )
      }
    ],
    mistakes: [
      'Changing the meaning of an existing parameter, so old callers silently get new behaviour.',
      'Deleting or rewriting old tests to make them pass, instead of asking whether they still describe correct behaviour.',
      'Testing only the new rule and not the boundary where old and new meet (exactly 5 km, exactly 10 km).',
      'Copying the whole function to make a "v2" and fixing bugs in only one copy.'
    ],
    checks: [
      {
        prompt:
          'A function `price(items)` returns a total. The customer now wants "a 5% loyalty discount for returning customers". Twenty places in the code already call `price(items)`. How do you add the rule without touching those twenty places?',
        answer:
          'Add a parameter with a default that keeps the old behaviour, such as `price(items, returning=False)`. Existing callers keep calling `price(items)` and get exactly what they got before; only the code that knows a customer is returning passes `returning=True`. Then add tests for both cases and the rounding of the discount.'
      },
      {
        prompt:
          'After a change, an old test `assert delivery_fee(8) == 300` fails. Name two possible explanations and what you would do for each.',
        answer:
          'Either the change broke old behaviour by accident (a bug: fix the code, keep the test), or the requirement really changed for everyone (the test is now wrong: confirm the new rule with whoever asked for it, then update the test and say so in the change description). You only know which by asking, not by guessing.'
      }
    ]
  },
  {
    id: 'sd-apis',
    title: 'APIs: requests, responses and contracts',
    thread: 'design',
    minutes: 8,
    concept:
      'An API is the way one program asks another for something. The client sends a request to an endpoint; the server checks it, does the work, and sends back a response with a status code and a body, usually as JSON.',
    mentalModel:
      'client → request → server → response. Like ordering at a counter: you ask for something specific (the request), the counter checks it is on the menu (validation), and you get either your order or a clear "we do not have that" (the response and its status).',
    whyItMatters:
      'Almost every application is made of parts talking through APIs: the app to its server, the server to a payment service, your code to an AI model. A junior engineer is expected to read and design simple request and response shapes, and to know what happens when a request is wrong.',
    sections: [
      {
        heading: 'The words',
        body: md(
          '- **Client**: the program asking (a phone app, a website, another service).',
          '- **Server**: the program answering.',
          '- **Endpoint**: an address for one kind of request, like `/orders`.',
          '- **Request**: what the client sends: the endpoint, plus data (the body).',
          '- **Response**: what comes back: a **status code** and a **body**.',
          '- **Status codes**: 200 or 201 mean success (201: something was created). 400 means the request was wrong. 404 means no such endpoint or thing. 500 means the server itself failed.',
          '',
          '```',
          'client ──request──▶ server',
          'client ◀─response── server',
          '```'
        )
      },
      {
        heading: 'JSON: data as text',
        body: md(
          'Between programs, data travels as text. JSON is the usual format, and it maps almost one-to-one onto Python dicts and lists. `json.dumps` turns data into text; `json.loads` turns text back into data.'
        ),
        code: `import json

# What travels between client and server is text. JSON turns data into text and back.
order = {'order_id': 'A42', 'amount': 25, 'paid': False}
text = json.dumps(order)
print(type(text).__name__, text)
back = json.loads(text)
print(back['amount'] + 5, back['paid'])`,
        output: 'str {"order_id": "A42", "amount": 25, "paid": false}\n30 False'
      },
      {
        heading: 'A server, as one function',
        body: md(
          'You do not need a web framework to understand a server. At its core it is a function: request in, response out. It validates the request at the boundary, and every outcome, good or bad, comes back as a status and a body the client can read.'
        ),
        code: `import json

def handle(request):
    if request.get('path') != '/orders':
        return {'status': 404, 'body': {'error': 'no such endpoint'}}
    body = request.get('body', {})
    if 'item' not in body:
        return {'status': 400, 'body': {'error': 'missing field: item'}}
    if not isinstance(body.get('qty'), int):
        return {'status': 400, 'body': {'error': 'qty must be a whole number'}}
    return {'status': 201, 'body': {'order_id': 'A42', 'item': body['item'], 'qty': body['qty']}}

requests = [
    {'path': '/orders', 'body': {'item': 'mug', 'qty': 2}},
    {'path': '/orders', 'body': {'qty': 2}},
    {'path': '/orders', 'body': {'item': 'mug', 'qty': 'two'}},
    {'path': '/refunds', 'body': {}},
]
for r in requests:
    response = handle(r)
    print(response['status'], json.dumps(response['body']))`,
        output:
          '201 {"order_id": "A42", "item": "mug", "qty": 2}\n400 {"error": "missing field: item"}\n400 {"error": "qty must be a whole number"}\n404 {"error": "no such endpoint"}'
      },
      {
        heading: 'Why callers need the contract to stay stable',
        body: md(
          'Once a phone app reads `order_id` from your response, renaming it to `id` breaks every phone that has not updated, and you cannot update them all at once. So APIs grow by **adding** optional fields, and old fields keep their meaning. A breaking change gets a new endpoint or version instead.',
          '',
          '**The tradeoff**: stability means carrying old fields and old decisions for a long time. That is the price of other people being able to depend on you.'
        )
      }
    ],
    mistakes: [
      'Returning 200 with an error message inside the body, so clients that check the status think it worked.',
      'Error bodies that do not say which field was wrong.',
      'Renaming or removing a response field that clients already read.',
      'Trusting the client to have validated the data. The server checks again, every time.',
      'Mixing up JSON text and Python data: `"25"` (text) is not `25` (a number).'
    ],
    checks: [
      {
        prompt:
          'A client sends `{"item": "mug", "qty": -3}` to `/orders`. Which status code should come back, and what should the body say? Which part of the system is responsible for catching it?',
        answer:
          '400, with a body naming the problem, such as `{"error": "qty must be at least 1"}`. The server catches it at its boundary, in its validation, before any order is created. The client may also check, but the server cannot rely on that.'
      },
      {
        prompt:
          'Your teammate wants to rename the response field `order_id` to `id` "because it is shorter". Explain what breaks, and suggest a safer way to get there.',
        answer:
          'Every client that reads `order_id`, including app versions already installed on phones, breaks immediately. Safer: add `id` alongside `order_id` for a while, move clients over, and only remove the old field once nobody reads it (or never). Bigger changes get a new version of the endpoint.'
      }
    ],
    resources: [{ title: 'Writing tools for agents (Anthropic)', url: 'https://www.anthropic.com/engineering/writing-tools-for-agents', note: 'later in the course: an API designed for a model to call' }]
  },
  {
    id: 'sd-persistence',
    title: 'Where state lives: memory and storage',
    thread: 'design',
    minutes: 7,
    concept:
      'State kept in a variable lives in memory and disappears when the program stops. State that must survive a restart is persisted: written to a file or a database, where each record is stored under an identifier and read back later.',
    mentalModel:
      'Memory is a whiteboard; storage is a filing cabinet. The whiteboard is fast and handy, and it is wiped every night. Anything you need tomorrow goes in the cabinet, in a labelled folder (the id), so you can find exactly that folder again.',
    whyItMatters:
      'Servers restart all the time: new releases, crashes, scaling up. A design that keeps important data only in memory loses it. Knowing which state is temporary and which must be stored is one of the first questions in any application design, including the undo and redo history you build this week.',
    sections: [
      {
        heading: 'Records and identifiers',
        body: md(
          'A database holds **records**: one per note, order or user. Each record has an **identifier** (id) that never changes and is unique, so the program can say "load order A42" and get exactly one thing back.',
          '',
          'You can picture a table as a dict from id to record. Real databases add a query language (for example `SELECT * FROM notes WHERE id = \'n2\'`), safety when two writes happen at once, and the guarantee that a saved record survives power loss. The idea underneath is the same: write by id, read by id.'
        )
      },
      {
        heading: 'A restart, simulated',
        body: md(
          'Here a dict stands in for the database, and `App` keeps a list of recent notes in memory. "Restarting" means creating a fresh `App`: the in-memory list is gone, the stored records are not.'
        ),
        code: `# A dict stands in for a database table: records keyed by an id.
database = {}

def save_note(note_id, text):
    database[note_id] = {'id': note_id, 'text': text}

def load_note(note_id):
    return database.get(note_id)

class App:
    def __init__(self):
        self.recent = []          # in memory: gone when the app restarts

    def write(self, note_id, text):
        save_note(note_id, text)  # persisted: survives a restart
        self.recent.append(note_id)

app = App()
app.write('n1', 'buy milk')
app.write('n2', 'call Sam')
print(app.recent, len(database))

app = App()                       # restart: a new process, fresh memory
print(app.recent, len(database))
print(load_note('n2'))
print(load_note('n9'))`,
        output: "['n1', 'n2'] 2\n[] 2\n{'id': 'n2', 'text': 'call Sam'}\nNone"
      },
      {
        heading: 'Deciding what to persist',
        body: md(
          'Ask of each piece of state: **if the program stopped right now, would losing this hurt?**',
          '',
          '- A customer\'s order: yes. Persist it.',
          '- A list of "recently viewed" items: probably not. Keep it in memory, or rebuild it.',
          '- An editor\'s undo history: it depends on the product. Losing it on restart is normal for many editors; a document app might store it.',
          '',
          'Also notice `load_note(\'n9\')` returned `None`: reading an id that is not there is a normal case your code must handle, not a crash.',
          '',
          '**The tradeoff**: storage is slower than memory and every write can fail. Memory is fast and free, and it forgets. Many systems keep a fast copy in memory (a cache) and the true copy in storage.'
        )
      }
    ],
    mistakes: [
      'Keeping the only copy of important data in a variable on a server that will restart.',
      'Using a position in a list as an id, so deleting one record changes the "id" of every record after it.',
      'Assuming a record exists and crashing when the id is unknown.',
      'Storing the same fact in memory and in storage and updating only one of them.'
    ],
    checks: [
      {
        prompt:
          'A shopping site keeps each user\'s cart in a dict on the server. After a release, every cart is empty and customers complain. What went wrong in the design, and what would you change?',
        answer:
          'The carts lived only in server memory, which is wiped when the server restarts for the release. Carts matter to customers, so they should be persisted (stored by user id in a database). The server can still keep a fast in-memory copy, but storage holds the truth.'
      },
      {
        prompt:
          'For a to-do app, classify each as persist or memory only, and say why: the list of tasks, which task is currently highlighted on screen, the time each task was created.',
        answer:
          'Tasks: persist, they are the whole point of the app. Highlighted task: memory only, it is screen state and harmless to lose. Created time: persist, as part of each task record, since it cannot be rebuilt later.'
      }
    ]
  },
  {
    id: 'ae-external-dependencies',
    title: 'Depending on things you do not control',
    thread: 'applied',
    minutes: 8,
    concept:
      'Most useful software calls other systems: a payment service, a weather API, a database, an AI model. Your code depends on them, but you do not control them. They can be slow, unavailable, or send back something wrong, and your code must decide what to do in each case.',
    mentalModel:
      'Ordering a part from a supplier. Usually it arrives. Sometimes it is late, sometimes the supplier is closed, sometimes the wrong part comes. A good workshop plans for all three before the customer is waiting.',
    whyItMatters:
      'In production, the failures that wake people up at night are usually at these boundaries, not in your own loops. Later in the course an AI model becomes one of these dependencies, and treating it as "something that can be slow, fail or be wrong" is the single most important habit in applied AI engineering.',
    sections: [
      {
        heading: 'Three ways a dependency lets you down',
        body: md(
          '- **Slow**: the answer takes seconds instead of milliseconds. Your user waits, or your request piles up behind others.',
          '- **Unavailable**: the call fails outright: the service is down, or the network dropped.',
          '- **Wrong**: a reply arrives, but it is not what the contract promised: a missing field, text where a number should be, an error dressed up as success.',
          '',
          'Two tools exist for the first two, and next week covers them properly: a **timeout** (stop waiting after a set time) and a **retry** (try again, carefully). This week, the habit is noticing every place your code calls out.'
        )
      },
      {
        heading: 'A flaky service, simulated',
        body: md(
          'Real services fail at random. To test your handling, use a stand-in (a fake) that fails exactly when you tell it to. Here the fake weather service fails on its second call and knows nothing about Atlantis. `describe` turns each case into something a user can read, instead of crashing.'
        ),
        code: `class FakeWeather:
    """Behaves like a weather service we do not control."""
    def __init__(self, broken_calls):
        self.calls = 0
        self.broken_calls = broken_calls

    def get_temp(self, city):
        self.calls += 1
        if self.calls in self.broken_calls:
            raise ConnectionError('weather service unavailable')
        if city == 'Atlantis':
            return {'error': 'unknown city'}
        return {'city': city, 'temp_c': 14}

def describe(service, city):
    try:
        reply = service.get_temp(city)
    except ConnectionError:
        return 'Weather is unavailable right now.'
    if 'temp_c' not in reply:
        return f'No weather for {city}.'
    return f"{city}: {reply['temp_c']}C"

service = FakeWeather(broken_calls={2})
print(describe(service, 'Leeds'))
print(describe(service, 'Leeds'))
print(describe(service, 'Leeds'))
print(describe(service, 'Atlantis'))`,
        output: 'Leeds: 14C\nWeather is unavailable right now.\nLeeds: 14C\nNo weather for Atlantis.'
      },
      {
        heading: 'Validate the reply, not just your input',
        body: md(
          'Contracts work both ways. Your code validates what callers send it, and it also validates what dependencies send back. A price that arrives as the text `"12.99"`, or not at all, must not flow into a bill.'
        ),
        code: `def get_price(catalog_reply):
    price = catalog_reply.get('price_cents')
    if not isinstance(price, int) or price < 0:
        raise ValueError(f'catalog sent a bad price: {price!r}')
    return price

print(get_price({'price_cents': 1299}))
for bad in [{'price_cents': '12.99'}, {}, {'price_cents': -5}]:
    try:
        get_price(bad)
    except ValueError as e:
        print('rejected:', e)`,
        output: "1299\nrejected: catalog sent a bad price: '12.99'\nrejected: catalog sent a bad price: None\nrejected: catalog sent a bad price: -5"
      },
      {
        heading: 'Fail gracefully, or fail loudly?',
        body: md(
          'When a dependency fails, choose per case:',
          '',
          '- **Degrade gracefully** when the feature is optional: show the page without the weather.',
          '- **Fail loudly** when continuing would be wrong: never complete a checkout with a price you could not read.',
          '',
          'How would you notice in production? The error messages and logs from these boundaries (Week 7) tell you which dependency failed and how often.',
          '',
          '**The tradeoff**: graceful fallbacks keep users moving but can hide a broken dependency for weeks; loud failures are honest but stop the user. Decide which per feature, and write it down.'
        )
      }
    ],
    mistakes: [
      'Assuming a call to another service always succeeds, so one outage crashes your whole program.',
      'Trusting the reply\'s shape without checking it, so a missing field becomes a confusing error three functions later.',
      'Hiding every failure behind a friendly fallback, including ones where carrying on is wrong (like charging a customer).',
      'Testing only with the real service, so failure paths never run until production.'
    ],
    checks: [
      {
        prompt:
          'A checkout calls a tax service. Name one way it can be slow, one way it can be unavailable and one way it can be wrong. For "unavailable", should checkout degrade gracefully or fail? Why?',
        answer:
          'Slow: it takes 10 seconds at peak time. Unavailable: the service is down or the network fails. Wrong: it returns a negative or missing tax amount. For unavailable, checkout should fail clearly ("we cannot complete your order right now, please try again") rather than charge a guessed tax, because charging the wrong amount is worse than a short delay.'
      },
      {
        prompt: 'Why test with a fake that fails on purpose, instead of only with the real service?',
        answer:
          'The real service almost never fails while you are testing, so your error-handling code would never run before production. A fake that fails exactly when told to makes each failure path run every time the tests run, deterministically.'
      },
      {
        prompt:
          'A product page shows "recommended for you" from a recommendations service. The service is down. What should the page do, and how would the team find out the service is down?',
        answer:
          'Show the rest of the page without the recommendations (degrade gracefully; it is an optional feature). The team finds out through the errors logged at that boundary and a count of failed calls, not through the page, which now hides it. That is why graceful fallbacks need logging.'
      }
    ]
  }
]
