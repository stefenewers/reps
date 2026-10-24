# Applied Engineering / FDE and junior system design: research and gap report

Written 2026-10-23, before implementation, and updated with what was built. The research and its 25 sources are in `planning/applied-research-notes.md`; the lane itself is documented in `docs/applied-engineering.md`.

**The rule this report enforces:** Reps teaches an idea before it seriously evaluates the learner on it.

## 1. Current Reps coverage (before this work)

### Lessons and concept guides

| Week | Object | Teaches | Assumes | Tests | Taught before evaluated? |
|---|---|---|---|---|---|
| 1 | `l-state`, `l-while`, `l-loop-control`, `l-running-state`, `l-mutation-references` | Program state, loops, mutation, references | Basic Python syntax | Week 1 reps and checkpoints | Yes |
| 1 | `l-decomposition` | Splitting a task into small functions with one job | Functions | Inventory Processor build | Yes, for components; the other design questions were not taught |
| 2 | `l-contract`, `l-manual`, `l-testing`, `l-improve`, `l-solve-map` | The contract of one function, solving by hand, edge-case tests, improving a solution | Week 1 | Week 2 reps, Pricing and Shipping labs | Partly. "Raise an error", validation boundaries and error-vs-empty results were assumed but not taught |
| 3–12 | Concept guides (two pointers … dynamic programming, tries) | The DSA pattern of each unit | Earlier units | DSA reps and checkpoints; the DSA design questions of each lab | Yes, for the algorithmic questions |
| — | (none) | APIs, persistence, reliability, observability, permissions, production awareness | — | Labs from Week 4 on; Support Router; FDE Workflow | **No** |
| — | (none) | Model as a dependency, structured output, tools, workflows vs agents, evals, retrieval, customer discovery | — | Support Router (Week 12), FDE Workflow (Week 13) | **No** |

### Worked examples

There are 17 (`we-countdown` … `we-states`). All of them are DSA or Week 1–2 solving, and none covers application or AI design.

### Labs (design questions)

There are 21 labs, two of them in the Applied AI / FDE lane. Every lab asks the same eight design questions: inputs, outputs, state, components, data flow, failure modes, validation and tradeoffs. That framework itself was never taught. It was only asked. Section 4 classifies each lab's questions.

## 2. FDE capability map

The status before this work is followed by the status after it.

| Capability | Before | After | Where now |
|---|---|---|---|
| Customer discovery, workflow mapping, measurable success | MISSING | INTRODUCED | `ae-discovery` (W11) → FDE Workflow |
| Ambiguous → clarified requirements | TESTED BUT NOT TAUGHT | TAUGHT WELL | `ae-discovery`, `ae-requirements-change` |
| Changing requirements | TESTED BUT NOT TAUGHT (lab change requests) | TAUGHT WELL | `ae-requirements-change` (W2) + every change request |
| Contracts and validation | INTRODUCED (`l-contract`) | TAUGHT WELL | `ae-contracts-validation` (W2) |
| APIs, JSON, client/server | MISSING | TAUGHT WELL | `sd-apis` (W3) |
| External dependencies (latency, failure, bad responses) | MISSING | TAUGHT WELL | `ae-external-dependencies` (W5) |
| Timeouts, retries, idempotency | TESTED BUT NOT TAUGHT (Support Router Q3, Q6) | TAUGHT WELL | `ae-reliability` (W6) |
| Logging, metrics, alerts | TESTED BUT NOT TAUGHT (Support Router Q5, FDE Q7) | TAUGHT WELL | `ae-observability` (W7) |
| Permissions, human approval | TESTED BUT NOT TAUGHT (Support Router Q4) | TAUGHT WELL | `sd-auth-permissions` (W8), `ae-tools-workflows` (W12) |
| Model as an unreliable dependency | TESTED BUT NOT TAUGHT | TAUGHT WELL | `ae-model-boundary` (W11) |
| Structured output and deterministic validation | TESTED BUT NOT TAUGHT (Support Router Q2) | TAUGHT WELL | `ae-model-boundary` |
| Tool / function calling | TESTED BUT NOT TAUGHT | TAUGHT WELL | `ae-tools-workflows` (W12) |
| Workflows vs agents | MISSING | INTRODUCED | `ae-tools-workflows` |
| Retrieval / RAG | MISSING | INTRODUCED + practised | `ae-retrieval` (W12) + optional Grounded Support Answer |
| Evals | TESTED BUT NOT TAUGHT (Support Router Q7, FDE Q4–Q6) | TAUGHT WELL | `ae-evals` (W12) |
| Cost and latency | TESTED BUT NOT TAUGHT (Support Router Q6, FDE Q6) | INTRODUCED | `ae-tools-workflows`, `sd-production-awareness` |
| Rollout, adoption, handoff | MISSING | INTRODUCED | `ae-discovery` (the FDE loop) |
| Context engineering, MCP, multi-agent systems | MISSING | OUT OF SCOPE | Mentioned at most; never required |

## 3. System-design capability map

| Capability | Before | After | Where now |
|---|---|---|---|
| Program design: requirements, I/O, state, components, data flow, failures, validation, tradeoffs | TESTED BUT NOT TAUGHT (every lab) | TAUGHT WELL | `sd-program-design` (W1, Day 2, before both Week 1 labs) |
| Validation boundaries and error contracts | INTRODUCED | TAUGHT WELL | `ae-contracts-validation` |
| Client, server, API, status codes | MISSING | TAUGHT WELL | `sd-apis` |
| State in memory vs persisted state, records and ids | MISSING | TAUGHT WELL | `sd-persistence` (W4, before Undo/Redo) |
| Failure reasoning | TESTED BUT NOT TAUGHT | TAUGHT WELL | `ae-external-dependencies`, `ae-reliability` |
| Production awareness: latency, cache, queues, rate limits, availability | MISSING | INTRODUCED | `sd-production-awareness` (W9) |
| Authentication vs authorization | MISSING | TAUGHT WELL | `sd-auth-permissions` |
| Junior design micro-cases (URL shortener, duplicate notifications, order flow) | MISSING | INTRODUCED | `sd-design-cases` (W10) |
| AI system design | TESTED BUT NOT TAUGHT | INTRODUCED | `ae-model-boundary`, `ae-tools-workflows`, `ae-retrieval` |
| Consensus, sharding, multi-region, Kafka, Kubernetes | — | OUT OF SCOPE | Never required (spec §48 guardrail) |

## 4. Lab design questions, classified

**Key:**
- **AT**: already taught by the unit's lesson or concept guide.
- **TE**: needed teaching earlier (now taught; the lesson is listed).
- **GT**: a good transfer question, kept challenging on purpose.
- **ADV**: too advanced.
- **DUP**: duplicative.

No question was classified ADV or DUP. None were removed.

| Lab (week) | Classification | Fix |
|---|---|---|
| Savings Goal (1) | Q1–Q7 TE (the design framework), Q8 GT | `sd-program-design` on Oct 27, the day the lab is due, before the reps |
| Inventory Processor (1) | Q1–Q3, Q5–Q7 TE; Q4 AT (`l-decomposition`); Q8 GT | `sd-program-design` |
| Pricing Engine (2) | Q1–Q5 AT; Q6–Q7 TE (validation, raising errors); Q8 GT | `ae-contracts-validation` |
| Shipping Eligibility (2) | Q1–Q6 AT; Q7 TE (raise vs return empty); Q8 GT | `ae-contracts-validation` |
| Sorted Match, Trend Analyzer, Activity Window (3–4) | Q1–Q7 AT (concept guide + `sd-program-design`); Q8 GT | Linked |
| Undo/Redo (4) | Q1–Q2, Q4–Q7 AT; Q3 TE (state ownership and what to keep); Q8 GT | `sd-persistence` |
| Product Catalog (5) | Q1–Q7 AT; Q8 GT (when performance matters) | `ae-external-dependencies` for the service/data boundary |
| Playlist, Route Walker, Nested Analyzer, Org Hierarchy, Category Tree, Evacuation Map, Social Network (5–8) | All AT (concept guides); tradeoff questions GT | Linked |
| Dependency Planner (9) | Q1–Q6 AT; Q7 GT | `sd-production-awareness` (workflows, dependencies) |
| Priority Support Queue (9, optional) | Q1–Q4, Q6 AT; Q5 TE (state ownership, stale entries) | `sd-production-awareness` |
| Calendar Conflicts (10), Package Configurator, Minimum Cost (11) | All AT; cost questions GT | Linked |
| **Support Router (12)** | Q1, Q2, Q3, Q4, Q5, Q6, Q7 TE; Q8 GT | `ae-model-boundary`, `ae-tools-workflows`, `ae-evals`, `ae-reliability`, `ae-observability`, `sd-auth-permissions`, all taught by Jan 12 (lab due Jan 14) |
| **FDE Customer Workflow (13)** | Q1, Q2, Q4, Q5, Q6, Q7 TE; Q3, Q8 GT | `ae-discovery`, `ae-model-boundary`, `ae-evals`, `ae-requirements-change`, `ae-observability` |

Every lab now shows "Taught first" links (`LAB_PREREQUISITES` in `data/course/applied.ts`). `npm run audit:applied` fails if any of those lessons first appears on Today after the lab's due date.

## 5. The research-backed target for February

A strong junior SWE with unusually strong Applied AI / FDE awareness. Not an FDE: the real roles ask for 3–7+ years of experience (sources 2 and 3 in the notes). By Feb 1 the learner should be able to:

- **Design small programs.** Answer the eight questions for any small program, and split it into components with one owner per piece of state.
- **Design small applications.** Name the client, API, service, data store and external dependencies. Trace where validation and state live, and what the client gets back on failure.
- **Reason about production failures.** Put a timeout on every remote call, retry only what is safe, use an idempotency key for writes, log with a request id and never secrets, and tell authentication from authorization.
- **Treat the model as one component.** Validate structured output deterministically. Remember that the model proposes tools and the code executes them under policy. Choose the simplest architecture (workflow before agent). Ground answers in retrieved context, or say "I don't know".
- **Prove AI behaviour with evals.** Use representative and edge cases, a regression set, a threshold, and the right grader.
- **Start from the customer.** Discover the workflow and the outcome, define measurable success, and adapt to requirement changes without breaking what still matters.

The thread adds 16 short lessons (about 2 hours across 12 weeks) and one optional mini-build. It adds no qualifying reps, no target changes and no new required labs.
