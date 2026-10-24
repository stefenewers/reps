# Applied AI / FDE + Junior Design: Research Notes

Researched 2026-10-23. Target: a strong SWE I (new grad, Python) with unusually good Applied AI / FDE awareness. This is not senior distributed-systems material. [n] marks point to the sources at the end.

## 0. Caveat on the FDE postings

Real FDE roles are not junior. OpenAI's Dublin FDE posting asked for 7+ years of experience [3], and Anthropic's Applied AI FDE posting asked for 3+ years in a customer-facing technical role [2]. So the goal is to give a junior the FDE vocabulary and habits (discovery, success criteria, evals, safe tool design), not to make them FDE-ready.

## 1. FDE / Applied AI skills that come up again and again

The postings [1–4] say the same things over and over: embed with customers, scope and plan "proof-of-concept prototypes and full production deployments", build iteratively ("experiment-driven"), ship on the customer's own infrastructure, record repeatable patterns, and feed findings back to product and research. Anthropic's posting adds MCP servers, sub-agents, agent skills, "evaluation frameworks", and "navigating ambiguity" [2]. Secondary reposts of OpenAI's postings say the role is measured on "production adoption, measurable workflow impact, and eval-driven feedback" [4].

| Skill | Junior tier | Evidence |
|---|---|---|
| Ambiguous requirements → clarifying questions | **Core** | [2][3][16] |
| Define success criteria / metrics before building | **Core** | [8][9] |
| Customer discovery, workflow mapping | Core (awareness; practise on toy cases) | [2][3] |
| Prototyping, starting simple | **Core** | [5][3] |
| APIs / integrations, data access (SQL, REST) | **Core** | [3] (Postgres/MySQL) |
| Structured output + deterministic validation | **Core** | [10][13] |
| Tool use: define tools, run them in your code, return results | **Core** | [11][12][6] |
| Evals: small dataset, graders, run on every change | **Core** | [8][9][15] |
| Errors, retries with backoff, timeouts, idempotency | **Core** | [14][19] |
| Logging / request IDs | **Core** | [8] ("log everything"), [14] |
| Permissions, human approval for risky actions | **Core** (concept) | [5][17][18] |
| Security basics: keys in env, prompt injection, least privilege | **Core** (concept) | [17][18] |
| Retrieval / RAG basics (chunk, embed, filter, cite) | Nice-to-have (conceptual) | [20][7] |
| Workflow vs agent orchestration patterns | Core (name and choose); building multi-agent is nice-to-have | [5] |
| Cost and latency levers | Nice-to-have (know the levers) | [21][17] |
| Context engineering (compaction, sub-agents, memory) | Nice-to-have | [7] |
| Monitoring in production, rollout/adoption, handoff, changing requirements | Nice-to-have (awareness) | [1][2][4] |
| MCP servers, agent skills | Nice-to-have | [2] |

## 2. Junior system design: what to include and what to leave out

The Dropbox ladder expects IC1 engineers to "execute on defined tasks", to write code "written to be read as well as executed", to test well, to keep bugs in "edge cases or design, not mainline paths", and to join on-call and metrics review [22]. IC2 adds "good separation of concerns" and breaking "a simple problem... into a solution made of multiple interacting components" [23]. Hello Interview says lower levels need breadth: be able to explain any component you introduce and lead the requirements, API, schema and high-level design steps. Deep hands-on depth is not expected [16].

**A strong SWE I should be able to:**
- Clarify requirements, separating functional from non-functional ones.
- Design a small REST API: resources, verbs, status codes, pagination, validation.
- Model data: tables, keys, relationships, indexes on the things you query, and when to use SQL vs a document store.
- Handle persistence and transactions at the "this must be atomic" level.
- Handle failures: timeouts on every remote call, retries with capped backoff and jitter, and idempotency keys for retried writes [19].
- Test at three levels (unit, integration, contract) with fakes for the model and external APIs.
- Use structured logs with request IDs, and know basic metrics: latency, error rate, throughput.
- Tell authentication ("who are you") apart from authorization ("what may you do"), and apply least privilege.
- Know caching conceptually: what to cache, TTLs, invalidation risk.
- Know queues and background jobs conceptually: for slow LLM calls or batch work, with retries and dead letters.
- Understand basic scaling: a stateless app tier behind a load balancer, and the database as the bottleneck.

**Leave out (senior material):** consensus and replication protocols, sharding strategy, CAP deep dives, multi-region failover, capacity math at scale, exactly-once streaming, and choosing specific data stores by internals.

## 3. Mental models the sources emphasize

1. **Simplest thing first; workflows before agents.** "find the simplest solution possible, and only increasing complexity when needed." Workflows are "LLMs and tools... orchestrated through predefined code paths". Agents "dynamically direct their own processes and tool usage". Use agents for "open-ended problems where it's difficult or impossible to predict the required number of steps" [5]. OpenAI's latency guide adds: "Don't default to an LLM" [21].
2. **The model is one component.** The building block is "an LLM enhanced with augmentations such as retrieval, tools, and memory" [5]. Everything around it is ordinary software.
3. **Tools are deterministic code; the model only proposes calls.** The model returns a `tool_use` / `function_call`, and "your application runs" it [11][12]. Tools are "a contract between deterministic systems and non-deterministic agents" [6]. Design tools poka-yoke style ("harder to make mistakes") [5]. Return actionable errors, use few tools of high value, and don't ask the model for values your code already knows [6][12].
4. **Start from the outcome and success criteria.** Criteria should be Specific, Measurable, Achievable, Relevant. Example: "Less than 0.1% of outputs... flagged for toxicity" [9]. "What's the success criteria for the eval?" [8]
5. **Evals are repeatable tests.** Avoid "vibe-based evals" [8]. Use code graders (fast, reproducible, brittle), model graders (flexible, need calibration), and human graders (gold standard, slow, used to calibrate the others) [15][8]. "20-50 simple tasks drawn from real failures is a great start." Grade outcomes, not paths, and read the transcripts [15]. Prefer volume of automated grading over a few hand-graded cases [9]. Run evals on every change [8].
6. **Validate deterministically.** A schema guarantee does not guarantee correctness. Check refusals and truncation (`max_tokens` / `incomplete`) before you parse [10][13].
7. **Humans approve risky actions.** Put checkpoints and stopping conditions (max iterations) in place [5]. Escalate on high-risk, irreversible actions or repeated failures [18]. "Wherever possible... have a human review outputs" [17].
8. **Context is a finite budget.** Aim for the "optimal set of tokens" and use just-in-time retrieval [7].
9. **Retries are selfish.** "APIs with side effects aren't safe to retry unless they provide idempotency" [19].

## 4. Provider-agnostic SDK concepts (checked against docs, Oct 2026)

| Concept | OpenAI (Responses API) | Anthropic (Messages API) |
|---|---|---|
| Request | `model`, `instructions`, `input` (string or messages) [24] | `model`, `max_tokens` (required), `system`, `messages` [11] |
| Roles | `developer` > `user`, `assistant` [24] | `system` param; `user` / `assistant` |
| Read output | `output` array of items; `output_text` helper; don't index `output[0]` [24] | `content` array of blocks; check `stop_reason` [11] |
| Structured output | `text.format: {type:"json_schema", schema, strict:true}`; `responses.parse` with Pydantic [10] | `output_config.format: {type:"json_schema", schema}`; `messages.parse` with Pydantic [13] |
| Tool definition | `{type:"function", name, description, parameters, strict}` [12] | `{name, description, input_schema, strict?}` [11] |
| Tool call / result | `function_call` (`call_id`, JSON-string `arguments`) → `function_call_output` with the same `call_id` [12] | `tool_use` (`id`, `input`), `stop_reason:"tool_use"` → `tool_result` with `tool_use_id` [11] |
| Errors | typed SDK exceptions; 429 / 5xx retry with backoff | 400/401/403/404/409/413/429/500/504/529; typed exceptions; SDK retries 2× by default; `request_id` [14] |

**Shared shape to teach:** messages in, an array of typed output blocks out, a JSON-schema tool contract, a loop that runs tool calls in your own code and sends the results back, and stop/finish reasons. Also handle refusal and truncation, use typed errors plus bounded retries, and use streaming for long calls.

**Recent changes to note:**
- OpenAI docs moved to `developers.openai.com/api/docs`, and Responses is recommended over Chat Completions [24].
- The Assistants API shutdown was announced for 2026-08-26 (from reposted notice [25]).
- OpenAI Responses normalizes schemas to strict by default. Tools can be grouped in a `namespace` and found with tool search. Keep fewer than about 20 functions [12].
- Anthropic docs moved to `platform.claude.com/docs`. Anthropic added structured outputs (`output_config.format`) and strict tool use [13].
- Assistant prefill is rejected on newer Claude models [14].
- Forced tool choice (`any` / `tool`) is not supported on the newest Claude models; use `auto` + `strict` instead [14].
- Anthropic schema limits: no min/max or length constraints, and `additionalProperties:false` is required [13].
- Teaching implication: **keep model IDs and provider-specific params out of the curriculum.** They change every few months.

## Sources

1. https://openai.com/careers/forward-deployed-engineer-(fde)-healthcare-seattle-seattle/ (official OpenAI FDE posting: end-to-end deployments in healthcare)
2. https://jobs.generalcatalyst.com/companies/anthropic/jobs/70192292-forward-deployed-engineer-applied-ai (repost of Anthropic's FDE, Applied AI listing: MCP servers, sub-agents, evals, ambiguity; now closed)
3. https://builtindublin.ie/job/forward-deployed-software-engineer-dublin/7762889 (repost of OpenAI's FDE listing: discovery, scoping PoC to production, 7+ years; removed Aug 2026)
4. https://startup.jobs/forward-deployed-engineer-zurich-openai-8785246 (OpenAI FDE repost; search snippet only, page blocked: "eval-driven feedback", production adoption)
5. https://www.anthropic.com/engineering/building-effective-agents (workflows vs agents, simplest first, ACI, poka-yoke, checkpoints)
6. https://www.anthropic.com/engineering/writing-tools-for-agents (tools as a deterministic/non-deterministic contract; actionable errors; tool evals)
7. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (context as a finite budget, just-in-time retrieval, compaction)
8. https://developers.openai.com/api/docs/guides/evaluation-best-practices (eval-driven development, grader types, "vibe-based evals" anti-pattern)
9. https://platform.claude.com/docs/en/docs/test-and-evaluate/define-success (SMART success criteria, multidimensional targets, grading methods)
10. https://developers.openai.com/api/docs/guides/structured-outputs (`text.format` json_schema, refusals, incomplete)
11. https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview (client vs server tools, tool_use / tool_result loop, strict)
12. https://developers.openai.com/api/docs/guides/function-calling (5-step tool flow, call_id, tool_choice, best practices, recent changes)
13. https://platform.claude.com/docs/en/build-with-claude/structured-outputs (output_config.format, limits, refusal / max_tokens caveats)
14. https://platform.claude.com/docs/en/api/errors (error codes, SDK retries, request IDs, prefill and forced-tool changes)
15. https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents (tasks/trials/graders, pass@k vs pass^k, 20–50 tasks)
16. https://hellointerview.com/blog/the-system-design-interview-what-is-expected-at-each-level (breadth over depth at lower levels)
17. https://developers.openai.com/api/docs/guides/safety-best-practices (human review, red-teaming, constrain I/O, safety_identifier); also https://developers.openai.com/api/docs/guides/production-best-practices (keys, staging/prod projects, cost = tokens × price)
18. https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf (single agent first, layered guardrails, human-intervention triggers; checked only via secondary summaries)
19. https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter (Amazon Builders' Library: timeouts, retries, jitter, idempotency)
20. https://developers.openai.com/api/docs/guides/retrieval (vector stores, chunking 800/400, attribute filters, hybrid ranking)
21. https://developers.openai.com/api/docs/guides/latency-optimization (seven latency principles, including "Don't default to an LLM")
22. https://dropbox.github.io/dbx-career-framework/ic1_software_engineer.html (IC1 expectations: defined tasks, testing, on-call)
23. https://dropbox.github.io/dbx-career-framework/ic2_software_engineer.html (IC2: separation of concerns, multi-component design, metrics)
24. https://developers.openai.com/api/docs/guides/text (Responses request shape, roles, output array, Responses over Chat Completions)
25. https://community.openai.com/t/are-they-deprecating-the-assistants-api/1280058 (Assistants API sunset 2026-08-26, migrate to Responses)
