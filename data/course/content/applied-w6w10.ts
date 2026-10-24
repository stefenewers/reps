import type { Lesson } from '@/data/course/types'

/**
 * Applied Engineering and junior system design, Weeks 6–10: reliability, observability, permissions,
 * production awareness and small design cases. Short lessons, runnable examples, think-then-reveal
 * checks. Never counted. Scheduled in data/course/applied.ts (docs/applied-engineering.md).
 */

const md = (...lines: string[]) => lines.join('\n')

export const appliedLessons: Lesson[] = [
  {
    id: "ae-reliability",
    title: "Timeouts, retries and doing it twice safely",
    thread: 'applied',
    minutes: 8,
    concept:
      "When your code calls something over a network, three things keep it reliable: a timeout (stop waiting after a limit), a retry (try again when the failure was temporary) and idempotency (doing the same action twice has the same effect as doing it once).",
    mentalModel:
      "attempt 1 ✕ → wait → attempt 2 ✓. Give every call a deadline, retry only what is safe to repeat, and stop after a few tries with a clear error. Before retrying anything that changes the world, ask: \"If this runs twice, will I charge the customer twice?\"",
    whyItMatters:
      "Networks drop requests, services restart, and answers arrive late. Code that waits forever freezes for the user. Code that never retries fails on every small hiccup. Code that retries blindly can double-charge a customer. Getting these three right is most of what \"reliable\" means for a junior engineer.",
    sections: [
      {
        heading: "Timeouts: waiting forever is a bug",
        body: md(
          "A call to another service can hang: the other side is slow, overloaded or gone. Without a limit, your code waits with it, and so does the user.",
          "",
          "A **timeout** says \"if there is no answer in 2 seconds, treat it as a failure\". Now the failure is something your code can handle: show a message, try again, or use a fallback. Every network call deserves a timeout, chosen from how long the answer is worth waiting for."
        )
      },
      {
        heading: "Retries: when they help and when they hurt",
        body: md(
          "Retrying helps when the failure is **temporary**: a timeout, a dropped connection, a \"try again later\". The same request a moment later often works.",
          "",
          "Retrying hurts when the failure is **permanent**: invalid input, \"not allowed\", \"not found\". The fourth try fails exactly like the first. Retrying also hurts an **overloaded** service, because every client retrying at once adds load. So retries are **bounded** (a small maximum), and real systems wait a little longer between each try (backoff).",
          "",
          "Here a fake service fails the first call, then works. The retry loop tries at most 3 times and then gives up with a clear error."
        ),
        code: `class FlakyService:
    """Fails the first bad calls, then works. Stands in for a real network call."""
    def __init__(self, bad):
        self.bad = bad
        self.calls = 0

    def get_rate(self):
        self.calls += 1
        if self.calls <= self.bad:
            raise TimeoutError('no answer within 2s')
        return 1.08

def with_retries(call, attempts):
    for n in range(1, attempts + 1):
        try:
            result = call()
            print('attempt', n, 'ok')
            return result
        except TimeoutError as e:
            print('attempt', n, 'failed:', e)
    raise RuntimeError('gave up after ' + str(attempts) + ' attempts')

print(with_retries(FlakyService(1).get_rate, 3))
try:
    with_retries(FlakyService(5).get_rate, 3)
except RuntimeError as e:
    print('caller sees:', e)`,
        output: "attempt 1 failed: no answer within 2s\nattempt 2 ok\n1.08\nattempt 1 failed: no answer within 2s\nattempt 2 failed: no answer within 2s\nattempt 3 failed: no answer within 2s\ncaller sees: gave up after 3 attempts"
      },
      {
        heading: "Idempotency: the same action twice",
        body: md(
          "A retry is only safe if repeating the action does no harm. Reading a price twice is harmless. Charging a card twice is not. A useful rule from the provider docs: APIs with side effects are not safe to retry unless they provide idempotency.",
          "",
          "The usual fix is an **idempotency key**: the caller sends a unique id with the action (\"order-77\"). The service remembers keys it has already handled and returns the same result instead of acting again."
        ),
        code: `charged = []
seen = {}

def charge(idempotency_key, customer, cents):
    if idempotency_key in seen:
        return seen[idempotency_key]
    charged.append((customer, cents))
    receipt = 'receipt-' + str(len(charged))
    seen[idempotency_key] = receipt
    return receipt

print(charge('order-77', 'ana', 2500))
print(charge('order-77', 'ana', 2500))
print(charged)`,
        output: "receipt-1\nreceipt-1\n[('ana', 2500)]"
      },
      {
        heading: "Graceful failure",
        body: md(
          "When retries run out, fail in a way people can understand and act on. The caller gets a clear error (\"payment service did not answer, please try again\"), nothing is left half done, and the failure is recorded so someone can find it later.",
          "",
          "The tradeoff: more retries hide more hiccups but make the user wait longer and add load. A short timeout fails fast but gives up on answers that were nearly there. You choose limits from what the user can tolerate."
        )
      }
    ],
    mistakes: [
      "Calling a network service with no timeout, so one slow dependency freezes the whole request.",
      "Retrying an invalid request (\"amount must be positive\"). It will fail every time.",
      "Retrying a payment or an email without an idempotency key, so a timeout that actually succeeded runs the action twice.",
      "Retrying forever, or with no pause, which turns one struggling service into an outage.",
      "Swallowing the final error, so the user sees nothing and nobody knows it failed."
    ],
    checks: [
      {
        prompt:
          "A call to a weather API times out. A call to a payment API returns \"card number is invalid\". For each: retry or fail? Why?",
        answer:
          "Weather timeout: retry a small number of times, because a timeout is often temporary and reading weather is safe to repeat. Invalid card: fail straight away and tell the user. The input is wrong, so every retry fails the same way."
      },
      {
        prompt:
          "Your code charges a customer, the payment service times out, and your code retries. The customer is charged twice. What happened, and what is the fix?",
        answer:
          "The first charge actually succeeded; only the answer was lost. Retrying repeated a side effect. Send an idempotency key (for example the order id) with the charge, so the service recognises the retry and returns the first result instead of charging again."
      },
      {
        prompt:
          "Why do retries have a maximum and a growing wait between them?",
        answer:
          "A maximum stops the user waiting forever and lets the code fail clearly. The growing wait (backoff) gives a struggling service room to recover instead of every client hammering it at once."
      }
    ],
    resources: [
      { title: "Timeouts, retries and backoff with jitter (AWS Builders Library)", url: "https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter", note: "Why bounded retries and backoff matter." }
    ]
  },
  {
    id: "ae-observability",
    title: "Logs, metrics and alerts",
    thread: 'applied',
    minutes: 7,
    concept:
      "Observability is the evidence a running system leaves behind so you can tell what happened. A log is a record of one thing that happened. A metric is a number tracked over time. An alert tells a person that something needs attention now.",
    mentalModel:
      "Log = one event (\"refund r2 failed: payment timeout\"). Metric = a count or rate over time (\"error rate 50% this minute\"). Alert = a rule on a metric that wakes a human (\"error rate above 5% for 3 minutes\"). Logs explain one request; metrics show the trend; alerts make sure someone looks.",
    whyItMatters:
      "In production you cannot add a print statement and rerun. When a customer says \"my refund failed\", the only evidence is what the system recorded at the time. Good logs turn a two-day mystery into a two-minute search, and a good alert finds the problem before the customer does.",
    sections: [
      {
        heading: "Logs: a record of one event",
        body: md(
          "A useful log line is **structured** (fields, not a sentence), and carries a **request id** so every line about one request can be found together. It says what happened, the outcome and how long it took.",
          "",
          "It must **not** contain secrets (passwords, API keys) or more personal data than needed (no full card numbers). Logs are read by many people and kept for a long time.",
          "",
          "Searching structured logs is simple filtering:"
        ),
        code: `logs = [
    {'request_id': 'r1', 'event': 'refund', 'status': 'ok', 'ms': 120},
    {'request_id': 'r2', 'event': 'refund', 'status': 'error', 'error': 'payment timeout', 'ms': 2000},
    {'request_id': 'r3', 'event': 'refund', 'status': 'ok', 'ms': 95},
    {'request_id': 'r4', 'event': 'refund', 'status': 'error', 'error': 'payment timeout', 'ms': 2000},
]

for line in logs:
    if line['status'] == 'error':
        print(line['request_id'], line['error'])

errors = sum(1 for line in logs if line['status'] == 'error')
error_rate = errors / len(logs)
print('error rate:', error_rate)`,
        output: "r2 payment timeout\nr4 payment timeout\nerror rate: 0.5"
      },
      {
        heading: "Metrics: numbers over time",
        body: md(
          "A metric summarises many events as one number: requests per minute, error rate, slowest response time. You do not read every log line to know the system is unhealthy; you watch the metric.",
          "",
          "In the example above, 2 of 4 refunds failed, so the error rate is 0.5. The logs then tell you **why**: both failures were payment timeouts."
        )
      },
      {
        heading: "Alerts: when a person must look",
        body: md(
          "An alert is a rule on a metric. Too sensitive, and people get woken up for one bad request and start ignoring alerts. Too lax, and customers notice first. A common shape: alert when the rate stays above a threshold for a few minutes in a row."
        ),
        code: `def should_alert(error_rates, threshold, minutes):
    """Alert only if the error rate stayed above the threshold for minutes readings in a row."""
    streak = 0
    for rate in error_rates:
        streak = streak + 1 if rate > threshold else 0
        if streak >= minutes:
            return True
    return False

print(should_alert([0.01, 0.30, 0.02, 0.01], 0.05, 3))
print(should_alert([0.01, 0.30, 0.40, 0.35], 0.05, 3))`,
        output: "False\nTrue"
      },
      {
        heading: "How an engineer notices",
        body: md(
          "The alert fires (\"refund error rate above 5% for 3 minutes\"). The dashboard shows when it started. The logs, filtered to errors in that window, show the cause (\"payment timeout\") and the request ids to follow. That chain (alert → metric → logs) is the everyday workflow of production debugging.",
          "",
          "The tradeoff: logging everything is expensive to store and can leak data; logging too little leaves no evidence. Log every decision and failure, with ids, and leave out secrets."
        )
      }
    ],
    mistakes: [
      "Logging a sentence with no request id, so lines about one request cannot be found together.",
      "Putting passwords, API keys or full personal details into logs.",
      "Alerting on a single failure, so alerts fire constantly and people learn to ignore them.",
      "Only logging success, so the failures leave no trace.",
      "Having metrics but no logs (you know something is wrong, not why), or logs but no metrics (you only find out when a customer complains)."
    ],
    checks: [
      {
        prompt:
          "A customer says their refund failed yesterday. What three fields would you want in each log line to investigate it, and what must not be in it?",
        answer:
          "A request id (or order id) to find the request, the event and its outcome (refund, error, the error message), and a timestamp or duration. Not the card number, password or API keys, and no more personal data than needed to identify the order."
      },
      {
        prompt:
          "Classify each: (a) \"refund r9 failed: card declined\", (b) \"errors per minute: 14\", (c) \"page the on-call engineer if errors per minute > 10 for 5 minutes\".",
        answer:
          "(a) is a log: one event. (b) is a metric: a number over time. (c) is an alert: a rule on a metric that tells a person to act."
      },
      {
        prompt:
          "Your alert fires every time a single request fails, about 50 times a day. What will happen, and how would you change the rule?",
        answer:
          "People will start ignoring it, and miss the real incident. Alert on a rate over a window instead (for example, error rate above 5% for 3 minutes in a row), and leave single failures to the logs."
      }
    ]
  },
  {
    id: "sd-auth-permissions",
    title: "Who are you, and what may you do?",
    thread: 'design',
    minutes: 7,
    concept:
      "Authentication answers \"who are you?\" (logging in). Authorization answers \"what are you allowed to do?\" (permissions). Risky actions often need one more step: a human approves before they run.",
    mentalModel:
      "Identity → permission → (approval) → action. Every request is checked in that order, on the server. Give each user or program the least access it needs (least privilege). A suggestion to act is not the authority to act.",
    whyItMatters:
      "Most real security bugs are not clever hacks; they are a missing permission check. And as soon as software takes actions (refunds, deletions, payments), someone has to decide which actions run automatically and which wait for a person. You will need this exact idea when an AI model starts proposing actions in Week 12.",
    sections: [
      {
        heading: "Authentication vs authorization",
        body: md(
          "**Authentication** proves identity: a password, a login session, an API key. After it, the server knows \"this is Ana\".",
          "",
          "**Authorization** decides what Ana may do: view her orders, but not other people's; refund small amounts, but not delete accounts. Logged in does not mean allowed.",
          "",
          "Both checks live on the **server**. The client (an app, a web page) can hide a button, but anyone can send the request directly, so hiding a button is not security."
        )
      },
      {
        heading: "Least privilege and approval",
        body: md(
          "Give each role only the actions it needs. Then mark the risky actions: anything that moves money, deletes data or cannot be undone needs a person to approve it.",
          "",
          "Low risk: `search_order` (reading). Higher risk: `refund_order`, `delete_account`, `send_payment` (changing the world)."
        ),
        code: `ALLOWED = {
    'agent': {'search_order', 'refund_order'},
    'viewer': {'search_order'},
}
NEEDS_APPROVAL = {'refund_order', 'delete_account', 'send_payment'}

def decide(role, action, approved=False):
    if action not in ALLOWED.get(role, set()):
        return 'denied: ' + role + ' may not ' + action
    if action in NEEDS_APPROVAL and not approved:
        return 'waiting for human approval'
    return 'run ' + action

print(decide('viewer', 'search_order'))
print(decide('viewer', 'refund_order'))
print(decide('agent', 'refund_order'))
print(decide('agent', 'refund_order', approved=True))`,
        output: "run search_order\ndenied: viewer may not refund_order\nwaiting for human approval\nrun refund_order"
      },
      {
        heading: "Recommendation vs authority",
        body: md(
          "A support agent (or later, an AI model) may **recommend** \"refund this order\". The system checks whether that role **may** refund, and whether this refund needs approval. The recommendation never carries the permission with it.",
          "",
          "How an engineer notices a problem here: an audit log shows who did what, under which role, and who approved it. A refund with no approver in the log is a bug.",
          "",
          "The tradeoff: more approvals mean fewer mistakes but slower work and annoyed people. Approve what is risky or irreversible, and let safe reads run."
        )
      }
    ],
    mistakes: [
      "Checking permissions only in the client (hiding a button) instead of on the server.",
      "Treating \"logged in\" as \"allowed to do anything\".",
      "Giving every role every permission because it is simpler to set up.",
      "Letting a recommendation (from a person or a model) act without its own permission check.",
      "No audit record of who approved a risky action."
    ],
    checks: [
      {
        prompt:
          "Sort these into \"can run automatically\" and \"needs human approval\", and say why: search_order, refund_order, send_password_reset_email, delete_account, list_recent_tickets.",
        answer:
          "Automatic: search_order and list_recent_tickets (read only), send_password_reset_email (low harm, goes to the account owner, and is usually allowed without review). Approval: refund_order (moves money) and delete_account (irreversible). The line is whether the action changes something important or cannot be undone."
      },
      {
        prompt:
          "An app hides the \"Refund\" button for viewers. A viewer sends the refund request directly to the API and it works. What is missing?",
        answer:
          "An authorization check on the server. The API must check that the caller's role may refund, whatever the client shows. Hiding a button is presentation, not security."
      },
      {
        prompt:
          "Which question is authentication and which is authorization: (a) \"Is this API key valid?\" (b) \"May this key delete accounts?\"",
        answer:
          "(a) is authentication: proving who (or what) is calling. (b) is authorization: deciding what that caller is allowed to do."
      }
    ]
  },
  {
    id: "sd-production-awareness",
    title: "Production awareness: caches, queues and 10,000 users",
    thread: 'design',
    minutes: 8,
    concept:
      "A program that works for one user can struggle with ten thousand. Four simple ideas cover most of it at junior level: latency (how long things take), caches (keep a recent answer), queues (do slow work later, in order) and rate limits (cap how fast anyone can call you).",
    mentalModel:
      "Ask \"what happens when 10,000 users do this?\" Then: is this answer reused (cache it)? Is this work slow but not urgent (queue it)? Can one caller overwhelm us (rate limit them)? Each fix trades something: freshness, immediacy or convenience.",
    whyItMatters:
      "Interviewers ask junior engineers simple scale questions, and real systems break in these simple ways: the same slow lookup repeated a million times, a slow email send making checkout wait, one buggy client flooding an API. Spotting them early is a sign of engineering judgement.",
    sections: [
      {
        heading: "Latency intuition",
        body: md(
          "Some steps are fast (a dict lookup), some slow (asking another service, writing to a database, calling a model). A request that makes three slow calls one after another waits for all three.",
          "",
          "So ask of every slow step: is it needed now, is the answer already known, and can it happen later?"
        )
      },
      {
        heading: "Caches: keep a recent answer",
        body: md(
          "A **cache** stores the answer to a slow question so the next asker gets it instantly. The cost is **staleness**: if the price changes, the cache may still hold the old one. Real caches expire entries after a while."
        ),
        code: `cache = {}
stats = {'hit': 0, 'miss': 0}

def slow_price_lookup(sku):
    # Imagine 300 ms to ask another service.
    return {'pen': 150, 'book': 1200}[sku]

def price(sku):
    if sku in cache:
        stats['hit'] += 1
        return cache[sku]
    stats['miss'] += 1
    value = slow_price_lookup(sku)
    cache[sku] = value
    return value

for sku in ['pen', 'book', 'pen', 'pen', 'book']:
    price(sku)
print(stats)`,
        output: "{'hit': 3, 'miss': 2}"
      },
      {
        heading: "Queues: do slow work later",
        body: md(
          "Placing an order must be fast. Sending the receipt email can wait a few seconds. A **queue** holds jobs; a background **worker** takes them in order and does them. The user gets \"order placed\" immediately.",
          "",
          "The tradeoff: the work happens later, so the code must handle a job that fails after the user has left (retry it, record it)."
        ),
        code: `jobs = []

def place_order(order_id):
    jobs.append(('send_receipt', order_id))
    return 'order ' + order_id + ' placed'

def worker():
    while jobs:
        kind, order_id = jobs.pop(0)
        print('worker:', kind, order_id)

print(place_order('A1'))
print(place_order('A2'))
print('jobs waiting:', len(jobs))
worker()`,
        output: "order A1 placed\norder A2 placed\njobs waiting: 2\nworker: send_receipt A1\nworker: send_receipt A2"
      },
      {
        heading: "Rate limits and availability",
        body: md(
          "A **rate limit** caps how many requests one caller can make (for example 100 per minute). It protects the service from a buggy or abusive client, and it is why your own code must handle \"too many requests\" from services you call.",
          "",
          "**Availability** means the system keeps answering. At junior level that means: no single slow dependency without a timeout, no work that must all succeed at once when it could be queued, and clear errors when something is down.",
          "",
          "How an engineer notices: latency and error-rate metrics climb as traffic grows, the queue length keeps rising (workers cannot keep up), or \"429 too many requests\" appears in the logs."
        )
      }
    ],
    mistakes: [
      "Caching data that must always be current (an account balance) without thinking about staleness.",
      "Doing slow, non-urgent work (emails, reports) inside the request the user is waiting on.",
      "Assuming background jobs always succeed, with no retry or record when one fails.",
      "Calling another service in a loop with no rate limit or timeout, then being blocked by it.",
      "Reaching for heavy infrastructure before asking the simple question: is this step needed, and needed now?"
    ],
    checks: [
      {
        prompt:
          "A product page looks up the same exchange rate from a slow service on every visit, and traffic is about to grow 100 times. What would you change, and what does it cost?",
        answer:
          "Cache the rate for a short time (say one minute), so most visits skip the slow call. The cost is staleness: for up to a minute, a visitor may see a slightly old rate. That is fine for display, but you would re-check the live rate at payment."
      },
      {
        prompt:
          "Checkout takes 4 seconds because it sends a confirmation email before answering. What design fixes this, and what new failure must you handle?",
        answer:
          "Put \"send confirmation email\" on a queue and answer the user straight away; a background worker sends it. New failure: the email can fail after the user has gone, so the worker must retry and record failures."
      },
      {
        prompt:
          "The queue of waiting jobs has grown from 10 to 5,000 in an hour. What does that tell you?",
        answer:
          "Jobs are arriving faster than workers finish them: workers are too slow, too few, or failing and retrying. Look at worker errors and duration, and add workers or fix the slow job."
      }
    ]
  },
  {
    id: "sd-design-cases",
    title: "Junior system design: three small cases",
    thread: 'design',
    minutes: 10,
    concept:
      "Junior system design is the eight questions from \"Designing a small program\" (requirements, input/output, components, state, data flow, failures, validation, tradeoffs), asked about a small application instead of one function.",
    mentalModel:
      "Draw the boxes (client, API, services, database, outside providers), draw how a request moves through them, then ask where state lives, where validation happens, and what each failure does. You do not need to know every technology, but you must be able to explain every box you draw.",
    whyItMatters:
      "This is what \"system design\" means in a junior interview, and in your first team: explaining how a feature works end to end, where its data lives, and what happens when a part fails. Short, clear answers to these questions beat long lists of technology names.",
    sections: [
      {
        heading: "Case 1 (5 minutes): a URL shortener",
        body: md(
          "\"Turn a long web address into a short code, and send people from the code back to the address.\"",
          "",
          "- **Input / output**: shorten takes a URL and returns a code; expand takes a code and returns the URL, or \"not found\".",
          "- **Components**: an API with two operations, and storage that maps code → URL.",
          "- **State**: the code-to-URL map, and a counter for the next code. It must survive restarts, so in a real system it lives in a database.",
          "- **Data flow**: shorten validates the URL, makes a code, stores the pair, returns the code. Expand looks the code up.",
          "- **Failures**: an invalid URL (reject it), an unknown code (return not found, never crash).",
          "",
          "The core fits in a few lines:"
        ),
        code: `urls = {}
counter = [0]
ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

def to_code(n):
    code = ''
    while True:
        code = ALPHABET[n % 36] + code
        n //= 36
        if n == 0:
            return code

def shorten(long_url):
    if not long_url.startswith(('http://', 'https://')):
        raise ValueError('not a web address')
    counter[0] += 1
    code = to_code(counter[0] + 1000)
    urls[code] = long_url
    return code

def expand(code):
    return urls.get(code)

c = shorten('https://example.com/a/very/long/page')
print(c)
print(expand(c))
print(expand('zzz'))`,
        output: "rt\nhttps://example.com/a/very/long/page\nNone"
      },
      {
        heading: "Case 2 (8 minutes): a notification sent twice",
        body: md(
          "\"Our notification API sometimes sends the same message twice.\"",
          "",
          "**Likely causes**: a caller retried after a timeout, but the first send had actually worked; or two workers picked up the same queued job.",
          "",
          "**Where to prevent it**: give each message an id, and have the sender skip ids it has already sent (the idempotency idea from Week 6). The check belongs where the side effect happens, in the sender, because any caller might retry."
        ),
        code: `sent = set()

def notify(message_id, user, text):
    if message_id in sent:
        return 'skipped duplicate ' + message_id
    sent.add(message_id)
    return 'sent to ' + user + ': ' + text

print(notify('m-1', 'ana', 'Your order shipped'))
print(notify('m-1', 'ana', 'Your order shipped'))
print(notify('m-2', 'ana', 'Your order arrived'))`,
        output: "sent to ana: Your order shipped\nskipped duplicate m-1\nsent to ana: Your order arrived"
      },
      {
        heading: "Case 3 (10 minutes): an order flow",
        body: md(
          "Mobile app → API → Order service → Database → Payment provider.",
          "",
          "- **Validation** happens at the API (shape and types: is the quantity a positive number?) and in the order service (business rules: is the item in stock?). The app may pre-check for a nicer experience, but the server decides.",
          "- **State** lives in the database: the order and its status (pending, paid, failed). The app and the API keep nothing between requests.",
          "- **If payment fails**: the order is marked failed (not left \"pending\" forever), nothing ships, and the client gets a clear \"payment declined, try another card\". If payment times out, the order service retries with an idempotency key, so the customer is never charged twice.",
          "- **The client receives** the order id and its status, never internal errors or other customers' data.",
          "",
          "The tradeoff to mention: charging before saving the order risks a charge with no order; saving first (as pending) and then charging means some orders end as \"failed\", which is easy to clean up. Save first."
        )
      }
    ],
    mistakes: [
      "Drawing boxes you cannot explain. Every component in a design should have a reason you can say in one sentence.",
      "Forgetting where state lives, or keeping it in memory on one server so a restart loses it.",
      "Only designing the happy path. The failures are where the design decisions are.",
      "Validating only in the client app.",
      "Listing technologies (\"use Kafka, Redis, Kubernetes\") instead of answering the questions the case asks."
    ],
    checks: [
      {
        prompt:
          "Design a \"like\" button for posts. Give the input/output, where the state lives, and one failure you must handle.",
        answer:
          "Input: user id and post id; output: the new like count (and whether this user likes it). State: a stored set of (user, post) likes in the database, so it survives restarts, plus a count. Failure: the same user liking twice (a double tap or a retry); keep likes as a set keyed by user and post so a repeat changes nothing."
      },
      {
        prompt:
          "In the order flow, the payment provider charges the card but its answer never arrives (timeout). Walk through what your system should do.",
        answer:
          "The order stays pending; the order service retries the charge with the same idempotency key (the order id). The provider recognises the key and returns the original success instead of charging again, so the order is marked paid. If retries run out, mark it failed or needing review, and log it with the order id."
      },
      {
        prompt:
          "A teammate proposes keeping the URL shortener map in a Python dict inside the server. When is that fine, and when does it break?",
        answer:
          "Fine for a demo or a single short-lived process. It breaks when the server restarts (every code is lost) or when there is more than one server (each has its own dict). Real state belongs in shared, persistent storage such as a database."
      }
    ]
  }
]
