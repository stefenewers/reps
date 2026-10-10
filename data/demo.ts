/**
 * The public demo (/demo): a short ladder anyone can try, and the method
 * behind it. Nothing here is personal and nothing a visitor does is stored.
 */

/** One short ladder, hashing up to Two Sum: each rep is a real one from the curriculum. */
export const DEMO_REPS: { id: string; rung: string; why: string }[] = [
  { id: 'o2-dict-squares-map', rung: 'Build', why: 'The smallest useful move: start empty, loop, store, return.' },
  { id: 'o2-dbg-freq-overwrite', rung: 'Debug', why: 'Working code teaches less than broken code. Find why the counts never go up.' },
  { id: 'o2-imap-first-code', rung: 'Combine', why: 'Two moves together: positions with enumerate, stored in a dict, guarded so the first one wins.' },
  { id: 'cap-two-sum', rung: 'Capstone', why: 'The LeetCode problem, last. By now it is the same moves you just used, assembled.' },
]

export const DEMO_METHOD: { title: string; body: string }[] = [
  { title: 'Ladder', body: 'Each pattern is learned from the ground up in small reps: trace it, write it, break it, fix it. Writing code is the main activity, not reading about it.' },
  { title: 'Mastery check', body: 'Cold reps from a blank editor, passed without opening the solution, before the next pattern unlocks.' },
  { title: 'LeetCode problems', body: 'Only then the real problems for that pattern. By this point they are applications, not first contact.' },
  { title: 'Spaced re-solves', body: 'Every problem comes back cold 3, 10 and 30 days after you first solve it. Needing help brings it back the next day.' },
]

export const DEMO_PACING = [
  'The plan is one ordered queue. Next up is always the first thing you have not done, whatever the date.',
  'The calendar is a gauge over that queue: on pace, ahead or behind, and when you would finish at the current pace.',
  'Missing a day moves the gauge. Nothing is rebuilt and nothing is dropped.',
]

export const DEMO_RESOURCES: { label: string; href: string; note: string }[] = [
  { label: 'NeetCode walkthroughs', href: 'https://www.youtube.com/@NeetCode', note: 'A video explanation for nearly every problem in the plan. Watch the idea, pause before the code, write it yourself.' },
  { label: 'Blind 75', href: 'https://neetcode.io/practice?tab=blind75', note: 'The core problem list the plan is built around.' },
  { label: 'LeetCode', href: 'https://leetcode.com/problemset/', note: 'Where the problems and their re-solves are done, from a blank editor.' },
  { label: 'Spacing research (Cepeda et al., 2008)', href: 'https://pubmed.ncbi.nlm.nih.gov/19076480/', note: 'Why re-solves are spread over days and weeks instead of repeated the same day.' },
  { label: 'Python in the browser (Pyodide)', href: 'https://pyodide.org/', note: 'How the editor on this page runs real Python with no server.' },
]
