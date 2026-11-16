/**
 * Interview format prep content that is not a rep: behavioral and project
 * story prompts, SQL practice sessions done outside the app, and the weekly
 * Mon–Sat rotation of interview formats.
 */

export interface StoryPrompt {
  id: string
  kind: 'star' | 'deep-dive'
  prompt: string
  tips: string[]
}

export const STORY_PROMPTS: StoryPrompt[] = [
  // Behavioral, STAR: Situation, Task, Action, Result.
  {
    id: 'star-hard-bug',
    kind: 'star',
    prompt: 'Tell me about the hardest bug you have tracked down.',
    tips: ['Name the symptom first, then how you narrowed it down (reproduce, bisect, print, test).', 'End with the root cause and what you changed so it cannot happen again.'],
  },
  {
    id: 'star-career-change',
    kind: 'star',
    prompt: 'Why did you move into software, and how did you teach yourself?',
    tips: ['Keep the backstory to two sentences; spend the time on how you learned and what you built.', 'Show a system: a schedule, projects, feedback loops, not just courses watched.', 'Connect a skill from your previous work to engineering (debugging processes, customers, deadlines).'],
  },
  {
    id: 'star-learn-fast',
    kind: 'star',
    prompt: 'Tell me about a time you had to learn something new quickly to get something done.',
    tips: ['Say how you decided what to learn first and what to skip.', 'Give a concrete result and roughly how long it took.'],
  },
  {
    id: 'star-failure',
    kind: 'star',
    prompt: 'Tell me about a time you failed or something you built did not work.',
    tips: ['Pick a real failure with a cost, not a disguised strength.', 'Own your part in one sentence, then spend most of the answer on what you changed afterwards.'],
  },
  {
    id: 'star-conflict',
    kind: 'star',
    prompt: 'Describe a disagreement with a teammate, manager or customer. How did you handle it?',
    tips: ['Describe the other side fairly; the interviewer is listening for empathy.', 'Show how you moved it to data or a shared goal, and how it ended, even if you did not win.'],
  },
  {
    id: 'star-ambiguity',
    kind: 'star',
    prompt: 'Tell me about a time the requirements were unclear. What did you do?',
    tips: ['Show the questions you asked and the assumptions you wrote down.', 'Mention shipping a small version early to check you understood the goal.'],
  },
  {
    id: 'star-ownership',
    kind: 'star',
    prompt: 'Tell me about something you took ownership of that was not strictly your job.',
    tips: ['Explain why it mattered and why nobody else was doing it.', 'Quantify the result if you can: time saved, errors avoided, people helped.'],
  },
  {
    id: 'star-feedback',
    kind: 'star',
    prompt: 'Tell me about a time you received hard feedback. What did you do with it?',
    tips: ['Quote the feedback briefly and honestly.', 'Show the specific change in behaviour and how you checked it worked.'],
  },
  {
    id: 'star-deadline',
    kind: 'star',
    prompt: 'Tell me about a time you had to deliver under a tight deadline.',
    tips: ['Explain what you cut or simplified and how you decided.', 'Mention how you communicated the tradeoff before the deadline, not after.'],
  },
  {
    id: 'star-stuck',
    kind: 'star',
    prompt: 'What do you do when you are stuck on a problem for a long time?',
    tips: ['Describe your actual routine: time-box, simplify the input, rubber-duck, then ask with a clear summary of what you tried.', 'Back it with one short real example.'],
  },
  {
    id: 'star-help-others',
    kind: 'star',
    prompt: 'Tell me about a time you helped someone else learn or get unblocked.',
    tips: ['Show how you figured out what they actually needed rather than handing over an answer.', 'Close with what they could do afterwards on their own.'],
  },
  {
    id: 'star-prioritize',
    kind: 'star',
    prompt: 'Tell me about a time you had too many things to do. How did you prioritize?',
    tips: ['Name the criteria you used (impact, urgency, who was blocked).', 'Say what you deliberately dropped or postponed and who you told.'],
  },
  {
    id: 'star-mistake-production',
    kind: 'star',
    prompt: 'Tell me about a mistake you made that affected other people.',
    tips: ['Lead with how you noticed and how fast you told people.', 'Separate the immediate fix from the lasting process change.'],
  },
  {
    id: 'star-proud',
    kind: 'star',
    prompt: 'What is the piece of work you are most proud of, and why?',
    tips: ['Pick something you can go two levels deep on technically; expect follow-ups.', 'Make the "why" about a decision you made, not just that it was hard.'],
  },

  // Project deep-dives: the learner's own builds.
  {
    id: 'deep-bank-system',
    kind: 'deep-dive',
    prompt: 'Walk through the bank system you built: the data model, the main operations, the tradeoffs you made, and what you would change.',
    tips: ['Draw the data model first (accounts, transactions, how balance is derived).', 'Pick one tradeoff, such as storing a balance vs recomputing it from transactions, and defend it.', 'Have one concrete improvement ready: validation, concurrency, or tests.'],
  },
  {
    id: 'deep-reps-app',
    kind: 'deep-dive',
    prompt: 'Walk me through this practice app you use: how exercises are stored, how code is run and checked, and where the progress data lives.',
    tips: ['Describe the flow from typing code to seeing test results in under a minute.', 'Mention one design choice and its cost, e.g. running Python in the browser vs on a server.'],
  },
  {
    id: 'deep-api-integration',
    kind: 'deep-dive',
    prompt: 'Describe a project where you called an external API. How did you handle errors, rate limits and bad data?',
    tips: ['Walk through one request end to end: request, status check, parse, validate, store.', 'Name a failure you actually hit and how the code handles it now.'],
  },
  {
    id: 'deep-data-model',
    kind: 'deep-dive',
    prompt: 'Pick one of your projects and explain its data model. Why those tables or structures, and what would break at 100x the data?',
    tips: ['Name the main entities and how they relate before any code.', 'Point to the first thing that would get slow and how you would fix it (index, pagination, caching).'],
  },
  {
    id: 'deep-hardest-part',
    kind: 'deep-dive',
    prompt: 'In your best project, what was the hardest technical part, and how did you solve it?',
    tips: ['Explain the problem so a non-expert understands why it was hard.', 'Mention the approach you tried first that did not work.'],
  },
  {
    id: 'deep-testing',
    kind: 'deep-dive',
    prompt: 'How did you test one of your projects? What did your tests catch, and what slipped through?',
    tips: ['Be concrete: which functions had tests, which edge cases, how you ran them.', 'An honest gap plus how you would close it beats claiming full coverage.'],
  },
  {
    id: 'deep-refactor',
    kind: 'deep-dive',
    prompt: 'Tell me about a time you rewrote or refactored part of your own code. What was wrong with the first version?',
    tips: ['Show the before and after shape in a sentence each.', 'Explain how you made sure behaviour did not change (tests, comparing outputs).'],
  },
  {
    id: 'deep-scale-up',
    kind: 'deep-dive',
    prompt: 'If one of your projects suddenly had 10,000 users, what would you change first?',
    tips: ['Start from the bottleneck you expect, not a list of buzzwords.', 'Mention monitoring: how you would know what is actually slow.'],
  },
  {
    id: 'deep-tradeoff',
    kind: 'deep-dive',
    prompt: 'Describe a technical decision in one of your projects where you chose between two reasonable options.',
    tips: ['State both options and what each would have cost.', 'Say what would make you revisit the decision.'],
  },
  {
    id: 'deep-next-feature',
    kind: 'deep-dive',
    prompt: 'Pick a project you built. If you had two more weeks, what would you add or fix, and in what order?',
    tips: ['Order by value to the user, and say why.', 'Include one unglamorous item (tests, error handling, docs); it signals maturity.'],
  },
]

/**
 * SQL practice sessions, done outside the app (sqlite3 in a terminal or an
 * online SQL playground). Shared tiny schema:
 *   users(id, name, city, signup_date)
 *   products(id, name, category, price)
 *   orders(id, user_id, product_id, qty, order_date, status)  -- status: 'paid' | 'refunded' | 'pending'
 */
export const SQL_CHECKLIST: { id: string; title: string; items: string[] }[] = [
  {
    id: 'sql-select-basics',
    title: 'SELECT, WHERE, ORDER BY',
    items: [
      'Set up: create users(id, name, city, signup_date), products(id, name, category, price) and orders(id, user_id, product_id, qty, order_date, status), and insert 5 users, 6 products and about 12 orders.',
      'List the name and price of every product that costs more than 20, most expensive first.',
      'List users who live in "Austin" or "Denver" and signed up in 2026, ordered by signup_date.',
      'Show the 3 most recent orders with status "paid" (ORDER BY order_date DESC, LIMIT 3).',
      'Find products whose name contains "mug" (LIKE), and users whose city is NULL.',
    ],
  },
  {
    id: 'sql-joins',
    title: 'Joins: INNER and LEFT',
    items: [
      'List every order with the user name and product name next to it (two INNER JOINs).',
      'List every user and their order ids, including users with no orders (LEFT JOIN; their order id shows as NULL).',
      'Find users who have never placed an order (LEFT JOIN ... WHERE orders.id IS NULL).',
      'Find products that have never been ordered.',
      'Explain out loud why the "never ordered" query breaks if the filter on orders goes in WHERE instead of the ON clause.',
    ],
  },
  {
    id: 'sql-group-having',
    title: 'GROUP BY and HAVING',
    items: [
      'Count orders per status.',
      'Total revenue (price * qty) per product category, for paid orders only, highest first.',
      'Number of orders per user, including users with zero orders (LEFT JOIN plus COUNT(orders.id), not COUNT(*)).',
      'Users who have spent more than 100 on paid orders (HAVING SUM(...) > 100).',
      'Categories with at least 3 distinct products ordered (COUNT(DISTINCT product_id)).',
    ],
  },
  {
    id: 'sql-subqueries',
    title: 'Subqueries',
    items: [
      'Products priced above the average product price (subquery in WHERE).',
      'Users whose ids appear in orders with status "refunded" (WHERE id IN (SELECT ...)).',
      'For each user, their most recent order date, then rewrite it using a subquery in FROM.',
      'The single most expensive product in each category (correlated subquery, or join to a grouped subquery).',
      'Rewrite one of the above with a CTE (WITH ... AS) and compare readability.',
    ],
  },
  {
    id: 'sql-window',
    title: 'One window function',
    items: [
      'Number each user\'s orders by date: ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date).',
      'Use that numbering to select each user\'s first order only (wrap it in a subquery or CTE, filter rn = 1).',
      'Running total of paid revenue by order_date: SUM(price * qty) OVER (ORDER BY order_date).',
      'Explain the difference between GROUP BY (collapses rows) and a window function (keeps every row).',
    ],
  },
  {
    id: 'sql-timed-mixed',
    title: 'Mixed timed set (30 minutes)',
    items: [
      'Set a 30 minute timer; write each query before running it, then fix it.',
      'Top 3 users by paid spend, with their names and totals.',
      'Month-by-month count of new signups (group by the year-month of signup_date).',
      'For each category, the share of revenue that came from refunded orders.',
      'Users whose second order came within 7 days of their first (ROW_NUMBER, then a self-join or compare dates).',
      'Afterwards, note which query took longest and redo it cold the next SQL day.',
    ],
  },
]

/** Mon–Sat interview format practice. dow: 1 = Monday … 6 = Saturday. */
export const FORMAT_ROTATION: { dow: 1 | 2 | 3 | 4 | 5 | 6; kind: 'codesignal' | 'api' | 'debug' | 'sql'; title: string; minutes: number; note: string }[] = [
  {
    dow: 1,
    kind: 'codesignal',
    title: 'CodeSignal-style 4-level build',
    minutes: 90,
    note: 'One timed build in four levels, each extending the last (e.g. an in-memory store: set/get, then filtering, then TTLs, then backup/restore). Finish level 1 cleanly before moving on; tests per level.',
  },
  {
    dow: 2,
    kind: 'api',
    title: 'API integration',
    minutes: 30,
    note: 'One rep from "API integration, offline": request, parse, validate, handle a non-200, write a summary, chain a second call. Say out loud what each error path does.',
  },
  {
    dow: 3,
    kind: 'debug',
    title: 'Debug an unfamiliar module',
    minutes: 25,
    note: 'One rep from "Debug an unfamiliar module". Read the failing tests and docstrings before editing; state the invariant each bug breaks.',
  },
  {
    dow: 4,
    kind: 'sql',
    title: 'SQL session (outside the app)',
    minutes: 30,
    note: 'Work the next SQL checklist session in sqlite3 or an online playground. Write each query before running it.',
  },
  {
    dow: 5,
    kind: 'codesignal',
    title: 'CodeSignal-style 4-level build',
    minutes: 90,
    note: 'A different 4-level build from Monday (e.g. a bank: accounts, transfers, top spenders, scheduled payments). Keep a running list of where time went.',
  },
  {
    dow: 6,
    kind: 'debug',
    title: 'Debug, timed',
    minutes: 25,
    note: 'Redo a debug rep you found hard this week, or the next unseen one, with a 20 minute timer and no hints.',
  },
]
