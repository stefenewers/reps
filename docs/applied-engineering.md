# Applied Engineering and junior system design

Two short teaching threads woven through the 14-week Reps 2.0 course:
- **Applied Engineering / FDE**: how to turn a real-world problem into reliable software, then how to use an AI model safely inside it.
- **Junior system design**: how to see the whole system around a program.

Research basis: `planning/applied-research-notes.md`. Gap analysis and the classification of lab questions: `planning/applied-engineering-design-audit.md`. Data: `data/course/applied.ts`.

## Purpose

Labs already ask design questions about state, data flow, failures, validation, permissions, evals and cost. This lane makes sure each idea is **taught before a lab relies on it**, in the smallest form that produces understanding. The DSA / interview path stays the spine. The lane gives that engineer real-world leverage.

## What it is not

- It is not a second course or a second Road. There is no FDE dashboard and no daily applied homework.
- It adds no qualifying reps and does not change the 10 / 12 / 15 daily targets or any checkpoint, gate or prerequisite.
- It adds no required lab. The one new build, Grounded Support Answer, is optional.
- It does not certify anyone as "FDE ready". Real FDE roles ask for 3–7+ years of experience. This lane builds the habits and vocabulary.

## Progression

| Week | Lesson | Thread | Leads into |
|---|---|---|---|
| 1 (Day 2) | `sd-program-design`: the eight questions (requirements → I/O → components → state → data flow → failures → validation → tradeoffs) | Design | Savings Goal, Inventory, every later lab |
| 2 | `ae-contracts-validation`: contracts, the validation boundary, raise vs return | Applied | Pricing Engine, Shipping Eligibility |
| 2 | `ae-requirements-change`: what changed, what broke, what must stay compatible | Applied | Every change request; FDE Workflow |
| 3 | `sd-apis`: client, server, request, response, JSON, status | Design | Product Catalog |
| 4 | `sd-persistence`: memory vs storage, records and ids | Design | Undo/Redo |
| 5 | `ae-external-dependencies`: what you do not control can be slow, down or wrong | Applied | Product Catalog |
| 6 | `ae-reliability`: timeouts, bounded retries, idempotency, graceful failure | Applied | Support Router |
| 7 | `ae-observability`: logs, metrics, alerts | Applied | Support Router, FDE Workflow |
| 8 | `sd-auth-permissions`: authentication vs authorization, least privilege, human approval | Design | Support Router |
| 9 | `sd-production-awareness`: latency, cache, queues, rate limits, availability | Design | Dependency Planner, Priority Queue |
| 10 | `sd-design-cases`: micro-cases (URL shortener, duplicate notifications, order flow) | Design | Calendar Conflicts |
| 11 | `ae-discovery`: start with the workflow and outcome, measurable success, the FDE loop | Applied | FDE Workflow |
| 11 | `ae-model-boundary`: the model as an unreliable dependency; structured output and validation | Applied | Support Router, FDE Workflow |
| 12 | `ae-tools-workflows`: the model proposes, code executes under policy; workflows before agents; cost and latency | Applied | Support Router |
| 12 | `ae-evals`: repeatable tests for AI behaviour; graders, regression sets, thresholds | Applied | Support Router, FDE Workflow |
| 12 | `ae-retrieval`: grounded answers from retrieved context, or "I don't know" | Applied | Grounded Support Answer (optional) |

The order is deliberate. Software as a system comes first, then application boundaries, reliability and production, and only then the model as one component. Week 13 (unlabeled transfer) and Week 14 (interview execution) have no teaching.

## How a lesson works

Each lesson is about 5–10 minutes and covers:
- what problem the idea solves;
- a simple mental model;
- a concrete example with runnable Python, which the content verifier executes;
- what commonly goes wrong;
- how an engineer would notice;
- the tradeoff;
- 2–3 **think-then-reveal checks**.

In a check, the learner writes an answer, reveals what a good answer contains, and marks "I had it" or "I missed something". Checks are self-assessed, stored as study state (`checks:<lessonId>`), and never counted.

Model behaviour is always **simulated deterministically** (an injected fake model or client), so the learner practises the engineering without API keys, billing or a flaky network. Lessons show the provider-agnostic request and response shape: messages in, typed output out, JSON-schema tools, a tool-call loop, stop reasons and typed errors. They never name model ids, which change every few months.

## Where it appears

- **Learn (the library):** browse everything, train what is scheduled. `/learn` groups everything Reps teaches into three tracks, all derived from course data (`lib/course/library.ts`): **Core SWE**, **Applied Engineering** and **System Design**. Builds, demos and worked examples each have their own section.
  - Every item shows its week relative to now (This week, Week N · ahead, or earlier), its minutes, its state (done, checks answered, built) and the builds that use it.
  - Reading ahead is fine. A lesson that is not taught yet says "Browsing ahead" and when Today will assign it. Nothing read early is counted.
- **Today:** applied lessons join the "Learn first" step on their unit's days, after the unit's own lesson, demo and example, tagged *Applied* or *Design*. An optional two-minute **recall** of an earlier applied lesson appears once it was learned two or more weeks ago and its checks have not been revisited for three weeks.
- **Road to Ready:** the lessons are tagged on their unit's card.
- **Labs:** each lab shows "Taught first" links to the lessons and concept guides its design questions assume (`LAB_PREREQUISITES`).
- **Progress:** "Engineering beyond the problems" shows capability evidence. The Applied capabilities are contracts, API integration, reliability, AI output handling, tool use, retrieval, evaluation, permissions and customer iteration. The design capabilities are program, application, failure reasoning, production awareness and AI system design. Each capability is in one of these states:
  - **Not introduced**: its lesson is not read yet.
  - **Learning**: its lesson is read.
  - **Practiced**: its checks are answered.
  - **Applied**: a lab that uses it is done.

  There is no percentage.

## Labs

The existing labs keep their purpose and gain explicit prerequisites.
- **Support Router (W12)** is the culmination of model output handling, structured data, tools, validation, retries, permissions, audit logging, evals, and cost and latency.
- **FDE Customer Workflow (W13)** is the culmination of discovery, requirements, extraction, validation, workflow, evals, customer change and communication.
- **Grounded Support Answer (W12, optional)** is a small retrieval build. Retrieve first, call the model second, cite the source, and say "I don't know" when nothing relevant was found.

## Relationship to SWE interview prep

The February objective is unchanged: strong SWE fundamentals and interview readiness. The design thread directly supports the junior "system design" conversation: requirements, API, data model, failure handling and tradeoffs. The applied thread makes the learner credible on model boundaries, tools, retrieval and evals without displacing DSA practice.

## Guardrails

- **Scope:** if a topic would not make a strong SWE I / junior Applied Engineer more effective, it is left out. Consensus, sharding, multi-region, Kafka internals, Kubernetes, vector-database internals and model training are mentioned conceptually at most and are never required.
- **Audit:** `npm run audit:applied` (`lib/course/applied-audit.ts`, also run by `lib/course/applied.test.ts`) checks that:
  - every scheduled concept has a lesson with checks;
  - every lab maps its design questions to teaching that appears on Today before it is due;
  - the Week 12 and Week 13 culminations rest on their full prerequisite sets;
  - nothing is scheduled in Weeks 13–14;
  - no applied lesson enters a unit's rep path;
  - the daily targets are unchanged and planned rest owes nothing.
