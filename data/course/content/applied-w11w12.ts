import type { Lesson } from '@/data/course/types'

/**
 * Applied Engineering / FDE, Weeks 11–12: customer discovery, then the model as one component of a
 * system (boundary and structured output, tools and workflows, evals, retrieval). Short lessons,
 * runnable examples with simulated model functions, think-then-reveal checks. Never counted.
 * Scheduled in data/course/applied.ts; the lane is described in docs/applied-engineering.md.
 */

const md = (...lines: string[]) => lines.join('\n')

export const appliedLessons: Lesson[] = [
  {
    id: "ae-discovery",
    title: "Customer discovery: start with the outcome",
    thread: 'applied',
    minutes: 8,
    concept:
      "Before building anything for a customer, find out what they do today, where it hurts, and what \"better\" would mean in numbers. The request (\"we want an AI agent\") is a starting point, not a requirement.",
    mentalModel:
      "OUTCOME \u2192 SUCCESS CRITERIA \u2192 PROTOTYPE THE CRITICAL PATH \u2192 VALIDATE ON REAL CASES \u2192 PRODUCTIONIZE (permissions, errors, monitoring, ownership) \u2192 LEARN FROM USE \u2192 HAND OFF. AI is one possible tool inside that loop, never the starting point.",
    whyItMatters:
      "Forward deployed and applied engineers are judged on whether the customer's workflow actually got better, not on how clever the system is. A system that solves the wrong problem, or has no agreed definition of success, cannot be shown to work. Guidance from both major model providers says the same: define success criteria first, and start with the simplest thing that could work.",
    sections: [
      {
        heading: "From a vague ask to a requirement",
        body: md(
          "The customer says: \"We want an AI agent for customer support.\" That sentence names a technology, not a problem. Ask questions until you can name the problem:",
          "",
          "1. **What does support do today?** Walk through a real ticket, start to finish.",
          "2. **Where is the slow or expensive step?** Usually one step eats most of the time.",
          "3. **Who uses it?** Customers, support staff, or both? They need different things.",
          "4. **What information do they need?** Order data, policies, account history?",
          "5. **What actions could it take?** Look up an order, issue a refund, close a ticket?",
          "6. **Which actions are risky?** Anything that moves money or deletes data.",
          "7. **What does success mean, in numbers?** Faster replies? Fewer tickets for humans?",
          "8. **What failure is unacceptable?** A wrong refund? A rude answer? Leaking another customer's data?",
          "9. **Which systems must it connect to?** The order database, the ticket tool, the payment provider.",
          "",
          "After the questions, the requirement might become: *\"40% of our tickets are 'where is my order?'. Answer those automatically from the order system, hand everything else to a person, and never give a wrong delivery date.\"* That can be built, tested and measured."
        ),
      },
      {
        heading: "Make success measurable",
        body: md(
          "A success criterion is something you can count. \"Customers are happier\" is a hope. \"At least 60% of order-status questions are resolved without a human, and none get a wrong answer\" is a test.",
          "",
          "Agree on it **before** building, and check it against logged outcomes:"
        ),
        code: `# The vague ask: "an AI agent for customer support".
# The clarified requirement: answer "where is my order?" messages automatically.
# The success metric, agreed before building: resolved without a human, and never wrong.
logged = [
    {'topic': 'order_status', 'resolved_by_bot': True,  'customer_said_wrong': False},
    {'topic': 'order_status', 'resolved_by_bot': True,  'customer_said_wrong': False},
    {'topic': 'order_status', 'resolved_by_bot': False, 'customer_said_wrong': False},
    {'topic': 'order_status', 'resolved_by_bot': True,  'customer_said_wrong': True},
    {'topic': 'refund',       'resolved_by_bot': False, 'customer_said_wrong': False},
]

in_scope = [t for t in logged if t['topic'] == 'order_status']
resolved = [t for t in in_scope if t['resolved_by_bot'] and not t['customer_said_wrong']]
wrong = [t for t in in_scope if t['customer_said_wrong']]

print('in scope:', len(in_scope))
print('resolved rate:', round(len(resolved) / len(in_scope), 2))
print('wrong answers:', len(wrong))
print('meets goal (>= 0.6 resolved, 0 wrong):', len(resolved) / len(in_scope) >= 0.6 and len(wrong) == 0)`,
        output: `in scope: 4
resolved rate: 0.5
wrong answers: 1
meets goal (>= 0.6 resolved, 0 wrong): False`,
      },
      {
        heading: "Each question decides part of the design",
        body: md(
          "Discovery is not a formality. Every answer turns into a design decision you would otherwise have guessed:"
        ),
        code: `# Each discovery question, and what its answer decides.
questions = {
    'What does support do today?': 'the workflow to copy',
    'Where is the slow or expensive step?': 'what to automate first',
    'Which actions are risky?': 'what needs a human',
    'What does success mean, in numbers?': 'the eval and the go/no-go',
    'What failure is unacceptable?': 'the hard rules in code',
    'Which systems must it connect to?': 'the tools and the access needed',
}
for q, decides in questions.items():
    print(q, '->', decides)`,
        output: `What does support do today? -> the workflow to copy
Where is the slow or expensive step? -> what to automate first
Which actions are risky? -> what needs a human
What does success mean, in numbers? -> the eval and the go/no-go
What failure is unacceptable? -> the hard rules in code
Which systems must it connect to? -> the tools and the access needed`,
      },
      {
        heading: "Then the loop",
        body: md(
          "- **Prototype the critical path**: the smallest version that handles the most common real case end to end.",
          "- **Validate on representative cases**: real past tickets, including the awkward ones, not just your favourite example.",
          "- **Productionize deliberately**: permissions, error handling, monitoring, and a named owner.",
          "- **Learn from use**: what real users do will change the next version.",
          "- **Hand off clearly**: someone who did not build it should be able to run, debug and extend it."
        ),
      },
    ],
    mistakes: [
      "Starting with \"which model should we use?\" before knowing which workflow is being improved.",
      "Accepting \"make support better\" as the requirement, so nobody can say whether the project worked.",
      "Automating every ticket type at once instead of the one most common, lowest-risk case.",
      "Never asking which actions are risky, then discovering in production that the system can issue refunds on its own.",
      "Measuring success on a few hand-picked examples instead of real logged cases."
    ],
    checks: [
      {
        prompt:
          "A clinic says: \"We want AI to help with appointment scheduling.\" Write two discovery questions you would ask first, and one measurable success criterion you might propose.",
        answer:
          "Questions such as: \"How are appointments booked today, and which step takes staff the most time?\" and \"Which actions are risky: can it cancel or move a booking without a person?\" A measurable criterion: \"At least half of reschedule requests are completed without staff, with zero double-bookings over a month of real requests.\""
      },
      {
        prompt:
          "Which of these is a requirement you could build and test, and why? (a) \"Use AI to improve the support experience.\" (b) \"Answer order-status questions from the order system automatically; send everything else to a person; never state a delivery date the order system does not have.\"",
        answer:
          "(b). It names the workflow (order-status questions), the data source, the boundary (everything else goes to a person) and an unacceptable failure (an invented date), so you can build it and test it. (a) names a technology and a feeling."
      },
      {
        prompt:
          "Your prototype resolves 70% of order-status tickets in testing, above the 60% goal. In week one of real use, customers complain it cannot handle \"my order says delivered but I don't have it\". What step of the loop is this, and what do you do?",
        answer:
          "Learning from use. Real usage found a case the test set missed. Add those real tickets to the evaluation set, decide whether that case should be automated or handed to a person (it is risky: probably a person), and change the system. Then re-run the evaluation."
      },
    ],
    resources: [
      { title: "Define your success criteria (Anthropic)", url: "https://platform.claude.com/docs/en/docs/test-and-evaluate/define-success", note: "Specific, measurable success criteria before building" },
      { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "Start with the simplest solution that works" },
    ]
  },
  {
    id: "ae-model-boundary",
    title: "The model is an unreliable dependency",
    thread: 'applied',
    minutes: 9,
    concept:
      "A language model is a component your program calls, like a payment API. It returns text that is usually useful and sometimes malformed, wrong, unsafe or asking for something it should not. Your deterministic code decides what actually happens. Structured output (JSON with a fixed shape) makes the model's answer something code can check.",
    mentalModel:
      "input \u2192 MODEL \u2192 output \u2192 DETERMINISTIC SOFTWARE (parse \u2192 validate \u2192 decide) \u2192 action. The model proposes; your code disposes. Whatever the model says, nothing happens until your code has checked it.",
    whyItMatters:
      "Applied AI systems fail at the boundary: code that trusts free text, refunds an amount nobody checked, or crashes on a reply it did not expect. The engineering that makes AI products safe is ordinary engineering: parsing, validation, clear errors. Providers now offer schema-constrained output, but their own docs warn that a valid shape is not the same as a correct answer.",
    sections: [
      {
        heading: "What can come back",
        body: md(
          "Ask a model to read \"Please refund order A42.\" Possible replies:",
          "",
          "- **Expected**: `{\"action\": \"refund\", \"order_id\": \"A42\", \"amount\": 20}`",
          "- **Malformed**: \"Sure! I can help with that refund.\" (not data at all)",
          "- **Wrong**: the right shape, but the wrong order or amount",
          "- **Unsafe**: an amount larger than the customer paid",
          "- **Unsupported**: an action your system does not offer, like \"delete_account\"",
          "",
          "Free text is hard for software: you cannot reliably pull an amount out of a friendly sentence. So you ask for **structured output**: JSON with named fields, required fields and types. That is a schema."
        ),
      },
      {
        heading: "Worked example: parse, then validate against real data",
        body: md(
          "This simulated dependency behaves like a model API so we can test your engineering deterministically. `fake_model` returns text; everything after it is your code. Note that a correct shape is not enough: the B7 reply is valid JSON asking for a refund larger than what was paid."
        ),
        code: `import json

ORDERS = {'A42': {'paid': 20}, 'B7': {'paid': 55}}

def fake_model(message):
    # A stand-in for a model API: deterministic, and sometimes wrong.
    if 'A42' in message:
        return '{"action": "refund", "order_id": "A42", "amount": 20}'
    if 'B7' in message:
        return '{"action": "refund", "order_id": "B7", "amount": 500}'
    if 'Z9' in message:
        return '{"action": "refund", "order_id": "Z9", "amount": 5}'
    return 'Sure! I can help with that refund.'

def parse(text):
    try:
        data = json.loads(text)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None

def check(data):
    if data is None:
        return 'malformed: not a JSON object'
    if data.get('action') != 'refund':
        return 'unsupported action'
    order = ORDERS.get(data.get('order_id'))
    if order is None:
        return 'unknown order'
    amount = data.get('amount')
    if type(amount) is not int or amount <= 0:
        return 'bad amount'
    if amount > order['paid']:
        return 'refund larger than what was paid'
    return 'ok'

for msg in ['Please refund order A42.', 'Refund B7 please', 'Refund Z9', 'refund my thing']:
    print(msg, '->', check(parse(fake_model(msg))))`,
        output: `Please refund order A42. -> ok
Refund B7 please -> refund larger than what was paid
Refund Z9 -> unknown order
refund my thing -> malformed: not a JSON object`,
      },
      {
        heading: "A schema, checked by code",
        body: md(
          "A schema says which fields are required and what type each one is. You can ask the provider to constrain output to a schema, and you still check it yourself, because your code is the boundary that matters. Two choices when a check fails: **reject** (refuse, ask again, or hand to a person) or **repair** (fix something harmless, like trimming spaces). Never \"repair\" a money amount by guessing."
        ),
        code: `import json

SCHEMA = {'action': str, 'order_id': str, 'amount': int}

def validate(data):
    problems = []
    for field, kind in SCHEMA.items():
        if field not in data:
            problems.append('missing: ' + field)
        elif type(data[field]) is not kind:
            problems.append('wrong type: ' + field)
    for field in sorted(data):
        if field not in SCHEMA:
            problems.append('unexpected: ' + field)
    return problems

print(validate(json.loads('{"action": "refund", "order_id": "A42", "amount": 20}')))
print(validate(json.loads('{"action": "refund", "amount": "20", "reason": "late"}')))`,
        output: `[]
['missing: order_id', 'wrong type: amount', 'unexpected: reason']`,
      },
      {
        heading: "What a real model API looks like (any provider)",
        body: md(
          "The shapes differ by provider and change over time, but the ideas are stable:",
          "",
          "- **Request**: instructions, plus a list of messages (who said what), plus settings like the maximum length of the reply.",
          "- **Response**: a list of typed output blocks (text, or a tool call), plus a **stop reason**: finished, cut off at the length limit, refused, or wants a tool.",
          "- **Structured output**: you pass a JSON schema; the reply should match it. Check the stop reason first: a refusal or a cut-off reply is not data.",
          "- **Errors**: typed errors (bad request, rate limited, server overloaded). Retry only the temporary ones, a bounded number of times.",
          "",
          "In this course the model is always a function you pass in, like `fake_model`. Real code swaps in the provider call; the boundary code stays the same."
        ),
      },
    ],
    mistakes: [
      "Treating the model's reply as the decision (\"it said refund, so refund\"), instead of as a proposal your code checks.",
      "Using the parsed JSON without checking required fields and types, then crashing on a missing key.",
      "Checking only the shape: a valid refund for more than was paid is still wrong.",
      "Wrapping parsing in a bare `except:` that also hides real bugs in your own code. Catch the specific error.",
      "Calling the real API directly inside your logic, so nothing can be tested without network access and a bill."
    ],
    checks: [
      {
        prompt:
          "The model returns `{\"action\": \"refund\", \"order_id\": \"A42\", \"amount\": \"20\"}` (the amount is a string). Your code adds it to a total and the program crashes later in a different function. Where should this have been caught, and how?",
        answer:
          "At the boundary, right after parsing: validation checks the type of every field against the schema (`type(amount) is int`), and rejects the reply with a clear reason before anything uses it. Errors caught at the boundary are easy to explain; errors caught three functions later are not."
      },
      {
        prompt:
          "Classify each reply as malformed, wrong, unsafe or unsupported: (1) \"I have processed your refund!\" (2) `{\"action\": \"refund\", \"order_id\": \"A42\", \"amount\": 5000}` for a 20-dollar order (3) `{\"action\": \"close_account\", \"order_id\": \"A42\"}` (4) `{\"action\": \"refund\", \"order_id\": \"B7\", \"amount\": 20}` when the customer asked about A42.",
        answer:
          "(1) malformed: not data. (2) unsafe: well-formed but would pay out more than was paid. (3) unsupported: an action the system does not offer. (4) wrong: valid and safe-looking, but the wrong order. Only (4) can slip past validation, which is why you also need evals."
      },
      {
        prompt:
          "Why pass `model` into your function as an argument instead of calling the provider's API inside it?",
        answer:
          "So tests can pass a deterministic fake (no network, no key, no cost, same answer every time) and check your parsing and validation, and so you can swap providers or models without changing the logic around them."
      },
    ],
    resources: [
      { title: "Structured outputs (OpenAI)", url: "https://developers.openai.com/api/docs/guides/structured-outputs", note: "Schema-constrained output; refusals and incomplete replies" },
      { title: "Structured outputs (Anthropic)", url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs", note: "The same idea in another provider" },
    ]
  },
  {
    id: "ae-tools-workflows",
    title: "Tools, approval, and workflows before agents",
    thread: 'applied',
    minutes: 10,
    concept:
      "With tool calling, your software lists the actions available (each with an argument contract) and the model proposes which one to call and with what arguments. Your code validates the proposal, checks permission, asks a human when the action is risky, and only then runs the real function. Selecting a tool is probabilistic. Executing the tool is deterministic software.",
    mentalModel:
      "User \u2192 Model \u2192 proposes Tool call \u2192 VALIDATE \u2192 POLICY (permission, approval) \u2192 Real function \u2192 Result back to the model, matched by the call's id. The model never holds real authority; your code does.",
    whyItMatters:
      "Tools are how a model does things in the world: look up an order, issue a refund. That is where the real risk is. Engineering guidance describes tools as a contract between deterministic systems and a non-deterministic model, and recommends the simplest architecture that reliably solves the task: often a fixed workflow, not an autonomous agent.",
    sections: [
      {
        heading: "Tools are code you define and run",
        body: md(
          "A tool definition is a name, a description, and a schema for its arguments. The model's reply says, in effect, \"please call `refund_order` with these arguments\", with an id. Your code runs it and sends back the result with the same id. Low-risk tools (`search_order`) can run automatically; tools that move money (`refund_order`) or delete data need a person."
        ),
        code: `ORDERS = {'A42': 'shipped', 'B7': 'delivered'}

def search_order(order_id):
    return ORDERS[order_id]

def refund_order(order_id, amount):
    return 'refunded ' + str(amount) + ' on ' + order_id

# The software defines the tools: their arguments, and who may run them.
TOOLS = {
    'search_order': {'fn': search_order, 'args': {'order_id': str}, 'needs_approval': False},
    'refund_order': {'fn': refund_order, 'args': {'order_id': str, 'amount': int}, 'needs_approval': True},
}

def run_tool_call(call, approve):
    tool = TOOLS.get(call['name'])
    if tool is None:
        return call['id'], 'rejected: unknown tool ' + call['name']
    if set(call['args']) != set(tool['args']):
        return call['id'], 'rejected: wrong arguments'
    for name, kind in tool['args'].items():
        if type(call['args'][name]) is not kind:
            return call['id'], 'rejected: bad type for ' + name
    if tool['needs_approval'] and not approve(call):
        return call['id'], 'denied: needs a human'
    return call['id'], tool['fn'](**call['args'])

# What a model might propose (the id ties the result back to the request).
proposals = [
    {'id': 'call_1', 'name': 'search_order', 'args': {'order_id': 'A42'}},
    {'id': 'call_2', 'name': 'refund_order', 'args': {'order_id': 'A42', 'amount': 20}},
    {'id': 'call_3', 'name': 'delete_account', 'args': {'user': 'ana'}},
]
no_human = lambda call: False
for p in proposals:
    print(run_tool_call(p, no_human))
print(run_tool_call(proposals[1], lambda call: True))`,
        output: `('call_1', 'shipped')
('call_2', 'denied: needs a human')
('call_3', 'rejected: unknown tool delete_account')
('call_2', 'refunded 20 on A42')`,
      },
      {
        heading: "Workflows before agents",
        body: md(
          "- **Workflow**: you, the developer, fix the sequence. Example: `classify \u2192 retrieve \u2192 generate \u2192 validate`. Every run follows the same path, so it is easy to test.",
          "- **Agent**: the model decides the next step in a loop: `goal \u2192 decide tool \u2192 observe result \u2192 decide again \u2192 stop`. It can handle open-ended tasks, but every extra decision is another way to fail: wrong tool, loops that never stop, costs that grow.",
          "",
          "So: use the simplest architecture that reliably solves the task. Many \"agents\" in real products are workflows with one model call in the middle. When you do build a loop, give it a maximum number of steps and stop conditions, and keep risky tools behind approval."
        ),
      },
      {
        heading: "Cost and latency, roughly",
        body: md(
          "Every model call costs time and money. Suppose one call takes 2 seconds and costs a cent. Three calls in a row take about 6 seconds. Calls that do not depend on each other can run at the same time: you wait once, but you still pay for every call.",
          "",
          "Questions to ask: is this call necessary at all (could plain code do it)? Can calls run in parallel? Could retrieval send a smaller prompt? Would a cheaper model be good enough for this step? What happens at 10,000 users?"
        ),
        code: `SECONDS_PER_CALL = 2
DOLLARS_PER_CALL = 0.01

def sequential(calls):
    return calls * SECONDS_PER_CALL, round(calls * DOLLARS_PER_CALL, 2)

def parallel(calls):
    # Calls that do not depend on each other can run at the same time:
    # you wait for one call's time, but you still pay for every call.
    return SECONDS_PER_CALL, round(calls * DOLLARS_PER_CALL, 2)

print('3 calls in a row:', sequential(3))
print('3 calls at once:', parallel(3))
seconds, dollars = sequential(3)
print('10,000 users a day:', round(dollars * 10000, 2), 'dollars a day')`,
        output: `3 calls in a row: (6, 0.03)
3 calls at once: (2, 0.03)
10,000 users a day: 300.0 dollars a day`,
      },
    ],
    mistakes: [
      "Letting the model's choice of tool count as permission to run it.",
      "Running a tool with arguments that were never checked against the tool's contract.",
      "Building an autonomous agent loop for a task that is always the same three steps.",
      "An agent loop with no maximum number of steps, so a confused model can call tools forever.",
      "Ignoring cost: a design that makes five sequential model calls per message is slow and expensive at scale."
    ],
    checks: [
      {
        prompt:
          "A support assistant has three tools: `search_order`, `refund_order`, `delete_account`. Which can run automatically, which need human approval, and which should perhaps not be offered to the model at all? Explain.",
        answer:
          "`search_order` is read-only and low risk: automatic. `refund_order` moves money: needs approval (at least above a limit). `delete_account` is irreversible and rarely needed in support: safest is not to expose it as a tool, or require strict human approval and identity checks. Offering fewer, safer tools shrinks what can go wrong."
      },
      {
        prompt:
          "A team wants an \"agent\" that, for each email: classifies it, looks up the customer, drafts a reply, and checks the reply for a refund promise. Agent loop or fixed workflow? Why?",
        answer:
          "A fixed workflow. The steps are always the same and in the same order, so code can run them in sequence. It is easier to test and cheaper. An agent loop adds failure paths (skipped checks, extra calls) without any benefit here."
      },
      {
        prompt:
          "Each message makes 3 sequential model calls at 2 seconds and $0.01 each. Customers complain it is slow. Name two changes that could help and what each one costs you.",
        answer:
          "Run independent calls in parallel (cuts waiting time, same cost, more complex code); remove a call that plain code could do (cuts time and cost); use a smaller, faster model for an easy step like classification (cheaper, may be less accurate: check with an eval)."
      },
    ],
    resources: [
      { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "Workflows vs agents; the simplest solution first" },
      { title: "Writing tools for agents (Anthropic)", url: "https://www.anthropic.com/engineering/writing-tools-for-agents", note: "Tools as a contract; fewer, better tools" },
      { title: "Function calling (OpenAI)", url: "https://developers.openai.com/api/docs/guides/function-calling", note: "Tool definitions, call ids, the tool loop" },
      { title: "Latency optimization (OpenAI)", url: "https://developers.openai.com/api/docs/guides/latency-optimization", note: "Fewer calls, parallel calls, \"don't default to an LLM\"" },
    ]
  },
  {
    id: "ae-evals",
    title: "Evals: proving the AI part works",
    thread: 'applied',
    minutes: 9,
    concept:
      "An eval is a repeatable way to answer \"did the AI system do what we needed?\". You collect test cases with known good answers, run the system on all of them, grade each result, and compare the score with a threshold you agreed on before looking.",
    mentalModel:
      "test case \u2192 SYSTEM \u2192 result \u2192 GRADER \u2192 pass / fail \u2192 score vs threshold. It is a test suite for the probabilistic part of your system, run every time something changes.",
    whyItMatters:
      "Unit tests check your deterministic code. They cannot tell you whether a prompt change made the classifier worse. Without evals, teams judge AI quality by trying a few examples and getting a feeling, which provider guides call \"vibe-based evals\". A small labelled set (20 to 50 real cases, especially past failures) is enough to start.",
    sections: [
      {
        heading: "Graders: who decides pass or fail",
        body: md(
          "- **Deterministic graders** (code): exact match on a label, valid against a schema, unit tests pass, the right tool called with the right arguments, the right outcome (the order was refunded once). Fast, cheap, repeatable.",
          "- **Human grading**: for quality that is hard to define in code (\"is this reply polite and correct?\"). Slow, but the gold standard.",
          "- **Model grading**: another model scores the output against a rubric. Useful for scale, but it is itself imperfect, so check it against human grades.",
          "",
          "For a classifier: expected `billing`, actual `billing`: PASS. For a tool call: expected tool `refund`, actual `refund`, expected order A42, actual A42: PASS."
        ),
      },
      {
        heading: "A tiny eval with a threshold",
        body: md(
          "Representative cases plus an edge case. The threshold (here 0.9) is decided before running, so the result cannot be talked into a pass."
        ),
        code: `LABELLED = [
    ('I was charged twice', 'billing'),
    ('My card was declined', 'billing'),
    ('The app crashes on login', 'technical'),
    ('Where is my parcel?', 'shipping'),
    ('Refund for a late delivery', 'billing'),
    ('Package arrived damaged', 'shipping'),
    ('Login keeps asking for my card again', 'technical'),
]

def classifier_v1(message):
    text = message.lower()
    if 'charged' in text or 'card' in text or 'refund' in text:
        return 'billing'
    if 'parcel' in text or 'package' in text or 'delivery' in text:
        return 'shipping'
    return 'technical'

def run_eval(system, cases, threshold):
    passed = 0
    for message, expected in cases:
        actual = system(message)
        ok = actual == expected
        passed += ok
        print('PASS' if ok else 'FAIL', '|', message, '| expected', expected, '| got', actual)
    score = round(passed / len(cases), 2)
    print('score', score, 'ship' if score >= threshold else 'do not ship')
    return score

run_eval(classifier_v1, LABELLED, 0.9)`,
        output: `PASS | I was charged twice | expected billing | got billing
PASS | My card was declined | expected billing | got billing
PASS | The app crashes on login | expected technical | got technical
PASS | Where is my parcel? | expected shipping | got shipping
PASS | Refund for a late delivery | expected billing | got billing
PASS | Package arrived damaged | expected shipping | got shipping
FAIL | Login keeps asking for my card again | expected technical | got billing
score 0.86 do not ship`,
      },
      {
        heading: "Catching a regression",
        body: md(
          "Someone \"improves\" the classifier. The eval shows it got worse, and exactly which case broke. Keep every case that ever failed in a **regression set** and run it on every change."
        ),
        code: `LABELLED = [
    ('I was charged twice', 'billing'),
    ('My card was declined', 'billing'),
    ('The app crashes on login', 'technical'),
    ('Where is my parcel?', 'shipping'),
    ('Refund for a late delivery', 'billing'),
    ('Package arrived damaged', 'shipping'),
]

def classifier_v1(message):
    text = message.lower()
    if 'charged' in text or 'card' in text or 'refund' in text:
        return 'billing'
    if 'parcel' in text or 'package' in text or 'delivery' in text:
        return 'shipping'
    return 'technical'

def classifier_v2(message):
    # "Improved" to catch more shipping questions: delivery words are now checked first.
    text = message.lower()
    if 'parcel' in text or 'package' in text or 'delivery' in text:
        return 'shipping'
    if 'charged' in text or 'card' in text or 'refund' in text:
        return 'billing'
    return 'technical'

def score(system):
    return sum(system(m) == want for m, want in LABELLED) / len(LABELLED)

before, after = score(classifier_v1), score(classifier_v2)
print('v1:', round(before, 2), 'v2:', round(after, 2))
broken = [m for m, want in LABELLED if classifier_v1(m) == want and classifier_v2(m) != want]
print('regressions:', broken)`,
        output: `v1: 1.0 v2: 0.83
regressions: ['Refund for a late delivery']`,
      },
    ],
    mistakes: [
      "Testing three hand-picked examples and calling it evaluated.",
      "Choosing the threshold after seeing the score.",
      "Only collecting easy cases, so the eval says 100% while real users hit the hard ones.",
      "Trusting a model grader without ever comparing it with human judgement.",
      "Not re-running the eval after a prompt, model or tool change."
    ],
    checks: [
      {
        prompt:
          "You change the prompt of a ticket classifier. Your unit tests all pass. Why is that not enough evidence, and what would tell you the change made it worse?",
        answer:
          "Unit tests check the deterministic code around the model, not the model's choices. Run the labelled eval set (including the regression cases) before and after the change and compare scores and the specific cases that changed from pass to fail."
      },
      {
        prompt:
          "Choose a grader for each: (1) the router must call `refund` with order A42; (2) the reply must be friendly and not promise a refund; (3) the output must be valid JSON with fields name, email, category.",
        answer:
          "(1) deterministic: check tool name and arguments. (2) human grading, or a model grader with a clear rubric checked against human grades. (3) deterministic: parse and validate against the schema."
      },
      {
        prompt:
          "Your support eval has 40 cases and scores 0.95. In production, 1 in 5 messages is in Spanish and none of your cases are. What is wrong with the eval?",
        answer:
          "It is not representative: it never tests a common real input, so the score says nothing about Spanish messages. Add real Spanish cases (and other common real inputs) to the set, then re-measure."
      },
    ],
    resources: [
      { title: "Evaluation best practices (OpenAI)", url: "https://developers.openai.com/api/docs/guides/evaluation-best-practices", note: "Eval-driven development; avoid vibe-based evals" },
      { title: "Demystifying evals for AI agents (Anthropic)", url: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents", note: "Graders; start with 20 to 50 tasks from real failures" },
    ]
  },
  {
    id: "ae-retrieval",
    title: "Retrieval: giving the model the right facts",
    thread: 'applied',
    minutes: 8,
    concept:
      "A model does not know your company's private or current information: your return policy, today's order status. Retrieval means your application finds the relevant information first and gives it to the model with the question, so the answer is grounded in your data. When nothing relevant is found, the honest answer is \"I don't know\".",
    mentalModel:
      "question \u2192 FIND RELEVANT INFORMATION (your data) \u2192 CONTEXT \u2192 MODEL \u2192 grounded answer, with its source. Retrieval is an application/data problem surrounding the model.",
    whyItMatters:
      "Most useful AI features answer questions about the customer's own data. If the retrieval step picks the wrong document, the best model in the world gives a confident wrong answer. Getting retrieval right is ordinary engineering: search, ranking, filtering and testing.",
    sections: [
      {
        heading: "The words",
        body: md(
          "- **Source**: where the facts live (policy documents, a help centre, a database).",
          "- **Query**: what you search with, usually built from the question.",
          "- **Chunks / documents**: the pieces you search over. Long documents are split into smaller chunks.",
          "- **Context**: the retrieved text you send to the model with the question.",
          "- **Grounded answer**: one supported by the context, ideally naming its source.",
          "- **Unsupported answer**: one the context does not back up. The model made it up."
        ),
      },
      {
        heading: "Keyword retrieval, by hand",
        body: md(
          "The simplest retriever scores each document by how many meaningful words it shares with the question, ignoring common words like \"the\". Ties go to the earlier name, so results are deterministic. Zero overlap means nothing relevant was found."
        ),
        code: `DOCS = {
    'shipping.md': 'Orders ship within 2 business days. Express shipping arrives next day.',
    'returns.md': 'You can return an item within 30 days for a full refund.',
    'warranty.md': 'Electronics have a 1 year warranty against defects.',
}
STOP = {'a', 'an', 'the', 'is', 'my', 'i', 'can', 'do', 'how', 'what', 'for', 'within', 'of'}

def words(text):
    cleaned = ''.join(c.lower() if c.isalnum() else ' ' for c in text)
    return {w for w in cleaned.split() if w not in STOP}

def retrieve(question, docs):
    q = words(question)
    scored = sorted(((len(q & words(text)), name) for name, text in docs.items()), key=lambda x: (-x[0], x[1]))
    best_score, best_name = scored[0]
    return best_name if best_score > 0 else None

for q in ['How long do I have to return an item?', 'Does express shipping arrive fast?', 'Can I pay with crypto?']:
    print(q, '->', retrieve(q, DOCS))`,
        output: `How long do I have to return an item? -> returns.md
Does express shipping arrive fast? -> shipping.md
Can I pay with crypto? -> None`,
      },
      {
        heading: "Retrieve first, then answer, or say you do not know",
        body: md(
          "The model only sees what retrieval gives it. If retrieval finds nothing, do not call the model and let it guess."
        ),
        code: `def answer(question, source, docs, model):
    if source is None:
        # Nothing relevant was found: do not let the model guess.
        return "I don't know. Let me connect you with a person."
    context = docs[source]
    return model(question, context) + ' (source: ' + source + ')'

def fake_model(question, context):
    # Stands in for a model told: "answer only from the context".
    return 'From our policy: ' + context

DOCS = {'returns.md': 'You can return an item within 30 days for a full refund.'}
print(answer('How long do I have to return an item?', 'returns.md', DOCS, fake_model))
print(answer('Can I pay with crypto?', None, DOCS, fake_model))`,
        output: `From our policy: You can return an item within 30 days for a full refund. (source: returns.md)
I don't know. Let me connect you with a person.`,
      },
      {
        heading: "Beyond keywords (concepts only)",
        body: md(
          "- **Semantic retrieval**: each chunk is turned into a list of numbers (an *embedding*) that captures meaning, so \"send it back\" can match \"returns\" without sharing a word. You do not need the maths to use it.",
          "- **Metadata filters**: narrow the search before ranking, for example only documents for this product, or only the newest version of a policy.",
          "- **Testing retrieval**: an eval for retrieval checks that each question finds the right document, separately from whether the final answer is good."
        ),
      },
    ],
    mistakes: [
      "Sending the question to the model with no context and trusting the answer about private data.",
      "Calling the model even when retrieval found nothing, which invites a made-up answer.",
      "Retrieving an outdated version of a policy because nothing filters by date or version.",
      "Only evaluating the final answers, so you cannot tell whether a bad answer came from retrieval or from the model.",
      "Stuffing every document into the prompt \"just in case\": slower, costlier, and the relevant line gets lost."
    ],
    checks: [
      {
        prompt:
          "A customer asks \"Can I return headphones after 45 days?\" Retrieval returns `warranty.md` instead of `returns.md`, and the model answers about warranties. Which part failed, and how would an eval catch it?",
        answer:
          "Retrieval failed: the model answered from the wrong context. A retrieval eval with labelled pairs (question \u2192 expected document) catches it directly, separately from grading the answer text."
      },
      {
        prompt:
          "There is no document about payment methods. A customer asks \"Can I pay with crypto?\" What should the system do, and where in the code is that decided?",
        answer:
          "Say it does not know and hand off to a person, without calling the model. It is decided in the application right after retrieval: no document scored above zero, so there is no grounded answer to give."
      },
      {
        prompt:
          "The returns policy changed from 30 to 60 days. Both versions are in the document store. What change to retrieval prevents old answers?",
        answer:
          "Add metadata (a version or updated date) and filter or rank so only the newest matching policy is retrieved, or remove the old version from the source. Then add an eval case that asks about the return window and expects 60 days."
      },
    ],
    resources: [
      { title: "Retrieval (OpenAI)", url: "https://developers.openai.com/api/docs/guides/retrieval", note: "Chunking, filters, ranking" },
      { title: "Effective context engineering (Anthropic)", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", note: "Context is a finite budget; retrieve just in time" },
    ]
  },
]
