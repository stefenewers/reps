import type { Lab } from '@/data/course/types'

/** Sprint and Prep builds (CodeSignal-style progressive levels). Build/change exercises: data/exercises/course/labs-sprint.ts. */
export const labs: Lab[] = [
  {
    id: 'lab-bank-system',
    title: 'Simple Bank System',
    week: 10,
    unitId: 's-design-class',
    brief:
      'A small bank needs its core ledger as one Python class. It starts with accounts and transfers, then a spending leaderboard, then payments that run later on their own. Each level adds to the same class without breaking the last.',
    requirements: [
      'Class `Bank`. Every method takes an integer `timestamp` first, and timestamps only go up. Account ids are strings; amounts are positive integers.',
      'Level 1: `create_account(timestamp, account_id)` returns `True`, or `False` if the id exists. `deposit(timestamp, account_id, amount)` returns the new balance, or `None` for an unknown account.',
      'Level 1: `transfer(timestamp, source_id, target_id, amount)` returns the source balance after. It returns `None` and changes nothing if either account is missing, the ids are equal, or the source has less than `amount`.',
      "Level 2: `top_spenders(timestamp, n)` returns up to `n` strings `'id(total)'`. Total is money out: successful transfers out plus successful payments. Sort high to low, ties by id A to Z; accounts with 0 are included.",
      "Level 3: `schedule_payment(timestamp, account_id, amount, delay)` returns `'payment1'`, `'payment2'`, … (one counter for the whole bank), or `None` for an unknown account. The payment is due at `timestamp + delay`, with `delay` at least 1.",
      "Level 3: at the start of every operation, run each pending payment due at or before that timestamp, earliest due first, ties in scheduling order. A payment withdraws and counts as money out, or is skipped if the balance is too low.",
      "Level 3: `get_payment_status(timestamp, account_id, payment_id)` returns `'IN_PROGRESS'`, `'SUCCESS'` or `'SKIPPED'`; `None` if the account or payment does not exist or the payment belongs to another account.",
      'Level 4 (change request): `merge_accounts(timestamp, account_id_1, account_id_2)` moves account 2 into account 1 and returns `True`, or `False` for equal ids or a missing account. Everything from Levels 1–3 keeps working.',
    ],
    designQuestions: [
      'State: which facts must the bank remember between calls? Name one dict (or counter) for each, with what its keys and values are.',
      'Inputs: every method gets a timestamp. Which methods actually need it at Level 1, and why does it matter from Level 3 on?',
      'Outputs: list each method with what it returns on success and on failure (True/False, a number, None, a string, a list).',
      'Failure modes: write out every way `transfer` can fail. Which check must come first so a missing account never raises KeyError?',
      'Data flow: trace `top_spenders` for three accounts where two have the same money out. What sort key gives high-to-low, then A to Z?',
      'Components: where does "run the due payments" live, and why must it run before the operation, not after it?',
      'Data flow: a payment of 30 is scheduled at 3 with delay 5. Write out the balance and status after operations at 7, 8 and 9.',
      'Change readiness: if two accounts were merged later, which pieces of your state would need to move? Is anything keyed in a way that makes that hard?',
    ],
    buildExerciseId: 'lab-bank-system-build',
    changeRequest: {
      title: 'Level 4: merge accounts',
      description:
        "Add merge_accounts(timestamp, account_id_1, account_id_2). Account 1 takes account 2's balance, money out and payments (pending ones withdraw from account 1 when due); account 2 stops existing. Return False for equal ids or a missing account.",
      exerciseId: 'lab-bank-system-change',
    },
    review: [
      'Every public method runs due payments first, on its first line, so no method sees a stale balance.',
      'Each failure case returns before any state changes: a failed transfer leaves both balances and money out untouched.',
      'top_spenders uses one sort with key (-total, id), not two sorts or a hand-rolled loop.',
      'The payment counter is shared across the whole bank and only goes up when a payment is actually created.',
      'After the merge, the Level 1–3 tests still pass unchanged, and the old id behaves like any missing account.',
    ],
  },
  {
    id: 'lab-inmemory-db',
    title: 'In-Memory Database',
    week: 10,
    unitId: 's-design-class',
    optional: true,
    brief:
      'A service wants a tiny database that lives in memory: records with named fields, prefix scans, and fields that expire. Later it needs backups that can be restored. You build it as one class, one level at a time.',
    requirements: [
      'Class `InMemoryDB`. Every method takes an integer `timestamp` first, and timestamps only go up. Keys, fields and values are strings.',
      'Level 1: `set(timestamp, key, field, value)` stores or overwrites and returns `None`. `get(timestamp, key, field)` returns the value or `None`. `delete(timestamp, key, field)` returns `True` if the field existed, else `False`.',
      "Level 2: `scan(timestamp, key)` returns `['field(value)', …]` for every field of the key, sorted by field. `scan_by_prefix(timestamp, key, prefix)` keeps only fields starting with `prefix`. A missing key gives `[]`.",
      'Level 3: `set_with_ttl(timestamp, key, field, value, ttl)` stores a field that exists on [timestamp, timestamp + ttl). Every read (get, delete, scans) treats an expired field as missing. A plain `set` removes the ttl.',
      'Level 4 (change request): `backup(timestamp)` saves the live data with each remaining ttl and returns the number of keys with at least one live field.',
      'Level 4: `restore(timestamp, timestamp_to_restore)` replaces the data with the latest backup taken at or before `timestamp_to_restore`; a restored ttl counts from `timestamp`. No such backup: nothing changes.',
    ],
    designQuestions: [
      'State: what shape holds a key with many fields? Write the type, e.g. dict of what to what.',
      'State: at Level 3, what extra fact does each field need? Where will you store it so Level 1 code changes as little as possible?',
      'Outputs: what does each method return, including on a missing key or a missing field?',
      'Components: which single helper could every read go through so expiry is checked in one place?',
      'Data flow: a field is set with ttl 5 at timestamp 10. At which timestamps does `get` see it? Write the boundary case out.',
      'Data flow: trace `scan_by_prefix` on fields `age`, `address`, `name` with prefix `a`. Where do sorting and filtering happen?',
      'Failure modes: what should `delete` return for a field that has expired but is still in your dict?',
      'Change readiness: for a backup, why is it unsafe to store a reference to your live dict, and what would you store instead?',
    ],
    buildExerciseId: 'lab-inmemory-db-build',
    changeRequest: {
      title: 'Level 4: backup and restore',
      description:
        'Add backup(timestamp), which saves live fields with their remaining ttl and returns how many keys have fields, and restore(timestamp, timestamp_to_restore), which loads the latest backup at or before that time with ttls counted from the restore.',
      exerciseId: 'lab-inmemory-db-change',
    },
    review: [
      'Expiry is checked in one helper; get, delete and both scans all go through it.',
      'The boundary is right: a field set at t with ttl n is visible at t + n - 1 and gone at t + n.',
      'scan is written in terms of scan_by_prefix (or both share one helper), not copied.',
      'A backup is a fresh copy holding remaining ttl, so later writes never change it and a restore recalculates expiry.',
      'After backup and restore are added, the Level 1–3 tests still pass unchanged.',
    ],
  },
]
