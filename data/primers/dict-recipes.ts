import type { Recipe } from '@/data/primers/types'

/**
 * Dictionaries, task first. One running scenario (a gradebook: name → score)
 * so the only thing that changes between recipes is the move itself.
 * None of these solve a rep: no inverting, no searching values, no counting.
 */

const make: Recipe = {
  when: 'make one',
  code: `def empty_gradebook():
    # empty: no names yet
    scores = {}
    return scores

def starter_gradebook():
    # key: value, key: value
    scores = {'ana': 90, 'ben': 72}
    return scores

print(empty_gradebook())
print(starter_gradebook())`,
  output: `{}
{'ana': 90, 'ben': 72}`,
  note: 'Inside a function you nearly always start with `{}` and fill it as you go. Each entry is a **key** (what you look things up by) and a **value** (what you get back).',
}

const add: Recipe = {
  when: 'add or change an entry',
  code: `def record(scores, name, score):
    # new name → added
    # existing name → value replaced
    scores[name] = score
    return scores

scores = {'ana': 90}
record(scores, 'ben', 72)  # added
record(scores, 'ana', 95)  # replaced
print(scores)`,
  output: `{'ana': 95, 'ben': 72}`,
  note: 'Adding and changing are the **same line**: `d[key] = value`. Python checks whether the key is already there and either adds it or overwrites it. A key can never appear twice.',
}

const read: Recipe = {
  when: 'read a value you know is there',
  code: `def score_of(scores, name):
    # look up by KEY, get the VALUE
    return scores[name]

scores = {'ana': 90, 'ben': 72}
print(score_of(scores, 'ben'))`,
  output: '72',
  note: 'Square brackets with a key gives you its value. If the key is missing this **crashes** (`KeyError`), so only use it when you are sure the key exists.',
}

const exists: Recipe = {
  when: 'check if something is in it',
  code: `def is_enrolled(scores, name):
    # True/False: is it one of the KEYS?
    return name in scores

scores = {'ana': 90, 'ben': 72}
print(is_enrolled(scores, 'ana'))
print(is_enrolled(scores, 'zed'))
# 90 is a value, not a key:
print(is_enrolled(scores, 90))`,
  output: `True
False
False`,
  note: '`x in d` only ever looks at the **keys**. It gives `True`/`False`, so it fits straight into an `if` or a `return`.',
}

const guarded: Recipe = {
  when: 'read something that might be missing',
  code: `def report(scores, names):
    for name in names:
        # 1. check first…
        if name in scores:
            # 2. …now reading is safe
            print(name, scores[name])
        else:
            # 3. you decide what
            #    "missing" means
            print(name, 'absent')

scores = {'ana': 90, 'ben': 72}
report(scores, ['ben', 'zed'])`,
  output: `ben 72
zed absent`,
  note: 'This is the combination you will use most: `in` to ask, `d[key]` to read, `else` for the missing case. The check is what stops the `KeyError`.',
}

const get: Recipe = {
  when: 'read with a fallback in one step',
  code: `def bonus_for(bonuses, name):
    # missing → 0, no crash
    return bonuses.get(name, 0)

bonuses = {'ana': 5}
print(bonus_for(bonuses, 'ana'))
print(bonus_for(bonuses, 'ben'))`,
  output: `5
0`,
  note: '`d.get(key, fallback)` is the check-then-read from above squeezed into one call. It only **reads**: it never adds `ben` to the dict.',
}

const loop: Recipe = {
  when: 'go through every entry',
  code: `def show(scores):
    # key AND value, every time
    for name, score in scores.items():
        print(name, score)

def total(scores):
    t = 0
    # just the values
    for score in scores.values():
        t += score
    return t

scores = {'ana': 90, 'ben': 72}
show(scores)
print(total(scores))
# a plain loop gives just the keys
for name in scores:
    print(name)`,
  output: `ana 90
ben 72
162
ana
ben`,
  note: 'Pick the loop by what you need: `for k in d` gives keys, `d.values()` gives values, `d.items()` gives both as a pair you unpack into two names.',
}

const build: Recipe = {
  when: 'build one up from a list',
  code: `def name_lengths(names):
    # 1. start empty
    lengths = {}
    # 2. visit each item
    for name in names:
        # 3. pick key + value, store it
        lengths[name] = len(name)
    # 4. hand it back
    return lengths

names = ['ana', 'bertha', 'kim']
print(name_lengths(names))`,
  output: `{'ana': 3, 'bertha': 6, 'kim': 3}`,
  note: 'Start empty, loop, store, return. For each item ask two questions: **what do I look it up by** (the key), and **what do I want back** (the value).',
}

/** The full set, for the Dictionaries primer. */
export const DICT_RECIPES: Recipe[] = [make, add, read, exists, guarded, get, loop, build]

/** The subset behind .get() and looping. */
export const DICT_GET_ITEMS_RECIPES: Recipe[] = [guarded, get, loop]
