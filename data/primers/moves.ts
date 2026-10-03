import type { Recipe } from '@/data/primers/types'
import type { SkillId } from '@/lib/types'
import { add, build, exists, get, guarded, loop, make, read } from '@/data/primers/dict-recipes'

/**
 * Moves: the building blocks a rep is made of, each shown inside a small
 * working function. Basics shows only the moves a rep's skills call for.
 *
 * Patterns (frequency map, index map, complement…) are deliberately not
 * moves: for those reps the pattern *is* the answer.
 */
export interface Move extends Recipe {
  id: string
  /** All of these must be among the rep's skills for the move to apply. */
  covers: SkillId[]
}

const loopList: Recipe = {
  when: 'do something with every item in a list',
  code: `def show_all(words):
    # w is each item in turn
    for w in words:
        print(w, len(w))

show_all(['hi', 'hello'])`,
  output: `hi 2
hello 5`,
  note: '`for x in some_list:` runs the indented block once per item, with `x` set to that item.',
}

const positions: Recipe = {
  when: 'know each item’s position too',
  code: `def show_positions(words):
    # i = position, w = the item
    for i, w in enumerate(words):
        print(i, w)

show_positions(['up', 'down', 'left'])`,
  output: `0 up
1 down
2 left`,
  note: '`enumerate` hands you **two** things each time round: the position first, then the item. Positions start at 0.',
}

const runningTotal: Recipe = {
  when: 'add things up as you go',
  code: `def total_length(words):
    # 1. start at zero, before the loop
    total = 0
    for w in words:
        # 2. add to it inside the loop
        total += len(w)
    # 3. return it after the loop
    return total

print(total_length(['hi', 'hey']))`,
  output: '5',
  note: 'Start before the loop, update inside it, return after it. Returning inside the loop stops after the first item.',
}

const collect: Recipe = {
  when: 'collect some items into a new list',
  code: `def long_words(words):
    # 1. start with an empty list
    out = []
    for w in words:
        # 2. keep only the ones you want
        if len(w) > 3:
            out.append(w)
    # 3. hand the list back
    return out

print(long_words(['hi', 'hello', 'there']))`,
  output: `['hello', 'there']`,
  note: '`out.append(x)` adds `x` to the end of the list. It changes `out` in place and returns nothing.',
}

/** In priority order: earlier moves win when a rep's skills fit several. */
export const MOVES: Move[] = [
  { ...guarded, id: 'dict-guarded', covers: ['dict_membership', 'dict_lookup'] },
  { ...build, id: 'dict-build', covers: ['dict_create', 'dict_assign'] },
  { ...get, id: 'dict-get', covers: ['dict_get'] },
  { ...loop, id: 'dict-loop', covers: ['dict_items'] },
  { ...add, id: 'dict-add', covers: ['dict_assign'] },
  { ...read, id: 'dict-read', covers: ['dict_lookup'] },
  { ...exists, id: 'dict-exists', covers: ['dict_membership'] },
  { ...make, id: 'dict-make', covers: ['dict_create'] },
  { ...positions, id: 'list-enumerate', covers: ['enumerate'] },
  { ...runningTotal, id: 'list-total', covers: ['accumulator'] },
  { ...collect, id: 'list-collect', covers: ['list_append'] },
  { ...loopList, id: 'list-loop', covers: ['for_loop'] },
]

export const MAX_MOVES = 3

/** The few moves a rep is built from, in priority order, at most three. */
export function movesFor(skills: SkillId[]): Move[] {
  const have = new Set(skills)
  const covered = new Set<SkillId>()
  const out: Move[] = []
  for (const m of MOVES) {
    if (out.length === MAX_MOVES) break
    if (m.covers.every((s) => have.has(s)) && m.covers.some((s) => !covered.has(s))) {
      out.push(m)
      for (const s of m.covers) covered.add(s)
    }
  }
  return out
}
