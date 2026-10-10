/**
 * The twelve behavioral prompts to have a rehearsed story for. The stories are
 * yours to write; this is only the checklist. Aim for about two minutes each:
 * situation, what you did, the result, what you would do differently.
 */
export interface StoryPrompt {
  id: string
  prompt: string
  /** What interviewers are listening for. */
  theme: string
}

export const STORY_PROMPTS: StoryPrompt[] = [
  { id: 'proud-project', prompt: 'The project you are proudest of, and your part in it', theme: 'Ownership, technical depth' },
  { id: 'hard-bug', prompt: 'A hard bug or technical problem and how you tracked it down', theme: 'Debugging, persistence' },
  { id: 'failure', prompt: 'A time you failed or made a mistake', theme: 'Honesty, learning' },
  { id: 'disagreement', prompt: 'A disagreement with a teammate and how it was resolved', theme: 'Collaboration' },
  { id: 'tight-deadline', prompt: 'Delivering under a tight deadline or with too little time', theme: 'Prioritizing, trade-offs' },
  { id: 'learned-fast', prompt: 'Something you had to learn quickly', theme: 'Learning speed' },
  { id: 'ambiguity', prompt: 'A task that was unclear and how you made it concrete', theme: 'Handling ambiguity' },
  { id: 'feedback', prompt: 'Critical feedback you received and what you changed', theme: 'Coachability' },
  { id: 'initiative', prompt: 'Something you did that nobody asked you to do', theme: 'Initiative' },
  { id: 'helped-someone', prompt: 'A time you helped someone else succeed', theme: 'Teamwork' },
  { id: 'trade-off', prompt: 'A decision where you chose simple over ideal (or the reverse)', theme: 'Judgment' },
  { id: 'why-here', prompt: 'Why this company, and why this role', theme: 'Motivation' },
]
