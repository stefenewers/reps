import type { LabScaffold } from '@/data/course/types'
import { BANK_BUILD, BANK_TESTS, DB_BUILD, DB_TESTS } from '@/data/exercises/course/labs-sprint'

/** Lab scaffolds (data/course/types.ts LabScaffold), keyed by lab id. Merged into LABS by data/course/lessons.ts. */

const POINTS_TRACKER = `class PointsTracker:
    """A loyalty program: members earn and spend points. Every operation takes a timestamp first."""

    def __init__(self):
        self.points = {}   # member id -> points they have now
        self.spent = {}    # member id -> points spent so far

    def add_member(self, timestamp, member_id):
        if member_id in self.points:
            return False
        self.points[member_id] = 0
        self.spent[member_id] = 0
        return True

    def earn(self, timestamp, member_id, amount):
        if member_id not in self.points:
            return None
        self.points[member_id] += amount
        return self.points[member_id]

    def spend(self, timestamp, member_id, amount):
        if member_id not in self.points or self.points[member_id] < amount:
            return None
        self.points[member_id] -= amount
        self.spent[member_id] += amount
        return self.points[member_id]

    def top_spenders(self, timestamp, n):
        ranked = sorted(self.spent.items(), key=lambda item: (-item[1], item[0]))
        return [f'{member}({total})' for member, total in ranked[:n]]


tracker = PointsTracker()
print(tracker.add_member(1, 'ana'))     # True
print(tracker.add_member(2, 'ana'))     # False
tracker.add_member(3, 'ben')
print(tracker.earn(4, 'ana', 50))       # 50
print(tracker.spend(5, 'ana', 20))      # 30
print(tracker.spend(6, 'ben', 5))       # None: ben has 0
print(tracker.top_spenders(7, 2))       # ['ana(20)', 'ben(0)']
`

const KEY_VALUE_STORE = `class KeyValueStore:
    """A flat store: one value per key. Every operation takes a timestamp first."""

    def __init__(self):
        self.data = {}   # key -> value

    def set(self, timestamp, key, value):
        self.data[key] = value

    def get(self, timestamp, key):
        return self.data.get(key)

    def delete(self, timestamp, key):
        if key not in self.data:
            return False
        del self.data[key]
        return True

    def scan_by_prefix(self, timestamp, prefix):
        return [f'{k}({self.data[k]})' for k in sorted(self.data) if k.startswith(prefix)]


store = KeyValueStore()
store.set(1, 'apple', '3')
store.set(2, 'avocado', '1')
store.set(3, 'banana', '6')
print(store.get(4, 'apple'))              # 3
print(store.get(5, 'cherry'))             # None
print(store.delete(6, 'banana'))          # True
print(store.delete(7, 'banana'))          # False
print(store.scan_by_prefix(8, 'a'))       # ['apple(3)', 'avocado(1)']
`

export const scaffolds: Record<string, LabScaffold> = {
  'lab-bank-system': {
    workedExample: {
      problem:
        'A smaller sibling: a loyalty program class `PointsTracker`. `add_member(timestamp, member_id)` returns True or False. `earn` and `spend` return the new points, or None on failure. `top_spenders(timestamp, n)` ranks members by points spent.',
      walkthrough: [
        {
          step: 'Decide the state before writing any method.',
          why: 'Every method reads or changes the same facts. Points now and points spent are two different numbers per member, so they get two dicts keyed by member id.',
          code: 'def __init__(self):\n    self.points = {}   # member id -> points they have now\n    self.spent = {}    # member id -> points spent so far',
        },
        {
          step: 'Write the "create" method: check, then add.',
          why: 'An id that already exists is a failure, so check membership first. A new member starts in both dicts, so later methods can trust both keys exist.',
          code: 'if member_id in self.points:\n    return False\nself.points[member_id] = 0\nself.spent[member_id] = 0\nreturn True',
        },
        {
          step: 'Every changing method: guard first, change state, return the new value.',
          why: 'Checking all failure cases before touching any dict means a failed call changes nothing. That is the rule the bank needs for transfer.',
          code: 'if member_id not in self.points or self.points[member_id] < amount:\n    return None\nself.points[member_id] -= amount\nself.spent[member_id] += amount\nreturn self.points[member_id]',
        },
        {
          step: 'Rank with one sort and a tuple key.',
          why: 'Negating the total sorts high to low; the id second breaks ties A to Z. Slicing [:n] works even when n is bigger than the list.',
          code: "ranked = sorted(self.spent.items(), key=lambda item: (-item[1], item[0]))\nreturn [f'{member}({total})' for member, total in ranked[:n]]",
        },
        {
          step: 'Note what the timestamp is for.',
          why: 'Nothing here depends on time yet, but the parameter is in every signature. In the bank, Level 3 uses it to decide which scheduled payments are due before each call.',
        },
      ],
      solution: POINTS_TRACKER,
    },
    steps: [
      {
        title: 'Level 1a: state and create_account',
        instruction:
          'In __init__, create the dicts the bank needs: balances by account id and money out by account id. Then write create_account: return False if the id is already in balances; otherwise set both dicts to 0 for it and return True. Leave the other methods as pass for now.',
        checkpoint: { description: 'An id can be opened once; a second open of the same id returns False.', tests: [BANK_TESTS.l1[0]] },
        hints: [
          'State is whatever must survive between method calls. It lives on self.',
          'Two dicts, both keyed by account id: self.balances and self.outgoing.',
          'Membership test: if account_id in self.balances: return False.',
          'Outline: __init__ sets self.balances = {} and self.outgoing = {}. create_account checks, sets both to 0, returns True.',
        ],
      },
      {
        title: 'Level 1b: deposit and transfer',
        instruction:
          'Write deposit: None for an unknown account, otherwise add and return the new balance. Write transfer: return None if either account is missing, the ids are equal, or the source has less than amount. Otherwise move the money, add amount to the source money out, and return the source balance.',
        checkpoint: { description: 'All Level 1 behaviour: deposits, transfers, and every failed transfer changing nothing.', tests: BANK_TESTS.l1 },
        hints: [
          'Guard first, then change state. A failed call must return before touching any dict.',
          'Check that both ids exist before reading self.balances[source_id], or a missing id raises KeyError.',
          'Three updates on success: subtract from source, add to target, add to self.outgoing[source_id].',
          'Outline: if source or target missing: return None. If same id or balance < amount: return None. Update three numbers. Return the source balance.',
        ],
      },
      {
        title: 'Level 2: top_spenders',
        instruction:
          "Write top_spenders(timestamp, n). Sort the (account, total) pairs from your money-out dict with one key so the biggest total comes first and ties go A to Z. Return the first n as strings like 'ana(50)'.",
        checkpoint: { description: 'Ranking by money out, ties A to Z, n bigger than the bank, deposits not counted.', tests: BANK_TESTS.l2 },
        hints: [
          'This is the same ranking as the worked example: one sort, one tuple key.',
          'self.outgoing.items() gives (account, total) pairs to sort.',
          'key=lambda item: (-item[1], item[0]) puts big totals first, then ids A to Z.',
          "Outline: ranked = sorted(...); return [f'{a}({t})' for a, t in ranked[:n]].",
        ],
      },
      {
        title: 'Level 3: scheduled payments',
        instruction:
          "Add self.payments (payment id -> account, amount, due, status) and a counter. schedule_payment makes 'payment<k>', due at timestamp + delay, status 'IN_PROGRESS'. Write _run_due_payments(timestamp) and call it on the first line of every public method. Then write get_payment_status.",
        checkpoint: {
          description: 'Payment ids, running when due before the operation, skipping when short, earliest due first, and status lookups.',
          tests: BANK_TESTS.l3,
        },
        hints: [
          'A payment is a small record that changes state later. The bank must catch up on due payments before it does anything else.',
          "Store each payment as a dict: {'account': ..., 'amount': ..., 'due': timestamp + delay, 'status': 'IN_PROGRESS'}, keyed by its id.",
          "In _run_due_payments, collect the IN_PROGRESS payments with due <= timestamp and sort them by due. Python's sort is stable, so equal due times keep their scheduling order.",
          "Outline: for each due payment: if the balance covers it, withdraw, add to money out, status 'SUCCESS'; else status 'SKIPPED'. get_payment_status checks account exists, payment exists, owner matches.",
        ],
      },
      {
        title: 'Level 4: merge_accounts (change request)',
        instruction:
          "Open the change request. Add merge_accounts(timestamp, account_id_1, account_id_2): run due payments, return False for equal ids or a missing account. Otherwise add account 2's balance and money out into account 1, remove account 2 from both dicts, and give account 2's payments to account 1.",
        checkpoint: {
          description: 'Merging moves balance, money out and payments, removes account 2, and leaves earlier levels working.',
          exerciseId: 'lab-bank-system-change',
          tests: [...BANK_TESTS.l4, BANK_TESTS.l1[3]],
        },
        hints: [
          'A merge is a move of everything account 2 owns. Then account 2 disappears.',
          'dict.pop(key) removes a key and returns its value, so you can add and remove in one line.',
          "Payments know their owner by id: loop over self.payments.values() and change p['account'] where it equals account_id_2.",
          'Outline: run due payments; guard; balances[1] += balances.pop(2); outgoing[1] += outgoing.pop(2); reassign payments; return True.',
        ],
      },
    ],
    referenceSolution: BANK_BUILD,
    explainBack: [
      'Why must due payments run at the start of an operation rather than at the end? Use a transfer at the exact due time as your example.',
      'Walk through what happens to a pending payment of account 2 when it is merged into account 1, and why no old method had to change.',
      'Your top_spenders sort key puts the biggest totals first and breaks ties A to Z. Explain how each part of the key does that.',
    ],
  },

  'lab-inmemory-db': {
    workedExample: {
      problem:
        'A smaller sibling: a flat `KeyValueStore` with one value per key. `set`, `get` (None if missing), `delete` (True or False) and `scan_by_prefix(timestamp, prefix)`, which returns sorted strings like `apple(3)`.',
      walkthrough: [
        {
          step: 'One dict holds everything.',
          why: 'A flat store maps a key straight to a value. The database you build adds one level: a key maps to a dict of fields.',
          code: 'def __init__(self):\n    self.data = {}   # key -> value',
        },
        {
          step: 'Read with .get so a missing key gives None.',
          why: 'dict.get returns None for a missing key instead of raising KeyError, which is exactly the contract of get.',
          code: 'def get(self, timestamp, key):\n    return self.data.get(key)',
        },
        {
          step: 'Delete reports whether something was there.',
          why: 'Check membership first. Deleting a missing key would raise, and the caller wants False instead.',
          code: 'if key not in self.data:\n    return False\ndel self.data[key]\nreturn True',
        },
        {
          step: 'Scan: sort the names, filter by prefix, format.',
          why: 'sorted(dict) sorts the keys. startswith keeps the matching ones, and an f-string builds the name(value) text.',
          code: "return [f'{k}({self.data[k]})' for k in sorted(self.data) if k.startswith(prefix)]",
        },
        {
          step: 'Plan for time.',
          why: 'The timestamp is unused here. When fields can expire, every read must ask "is this alive at timestamp?", so put that question in one helper rather than in every method.',
        },
      ],
      solution: KEY_VALUE_STORE,
    },
    steps: [
      {
        title: 'Level 1: set, get, delete',
        instruction:
          'Create self.data as a dict of dicts: key -> {field: value}. set stores with self.data.setdefault(key, {})[field] = value. get returns the value or None for a missing key or field. delete returns True after removing an existing field, else False.',
        checkpoint: { description: 'Values can be stored, read, overwritten and deleted once.', tests: DB_TESTS.l1 },
        hints: [
          'Same idea as the worked example, with one more level: a key holds many fields.',
          'setdefault(key, {}) returns the inner dict, creating it if the key is new.',
          'Read safely in two steps: self.data.get(key, {}).get(field).',
          'Outline: set uses setdefault; get chains two .get calls; delete checks the field is in the inner dict before del.',
        ],
      },
      {
        title: 'Level 2: scan and scan_by_prefix',
        instruction:
          "Write scan_by_prefix: take the key's fields (an empty dict for a missing key), sort the field names, keep those that start with prefix, and format each as 'field(value)'. Then write scan as scan_by_prefix with prefix ''.",
        checkpoint: { description: 'Sorted scans, prefix filters, missing keys and deleted fields.', tests: DB_TESTS.l2 },
        hints: [
          'This is the worked example scan, one level down: you sort the fields of one key.',
          "Every string starts with '', so scan can call scan_by_prefix(timestamp, key, '').",
          'sorted(fields) gives the field names A to Z; f.startswith(prefix) filters them.',
          "Outline: fields = self.data.get(key, {}); return [f'{f}({fields[f]})' for f in sorted(fields) if f.startswith(prefix)].",
        ],
      },
      {
        title: 'Level 3: set_with_ttl and expiry',
        instruction:
          'Store each field as (value, expires_at); plain set uses None. set_with_ttl stores timestamp + ttl. Write a helper _alive(timestamp, key) returning {field: value} for fields with no expiry or timestamp < expires_at. Make get, delete and scan_by_prefix read through it.',
        checkpoint: { description: 'Fields expire at timestamp + ttl, every read respects it, and a plain set clears the ttl.', tests: DB_TESTS.l3 },
        hints: [
          'Expiry is one question asked in many places. Ask it in one helper.',
          'The field is alive when expires_at is None or timestamp < expires_at. At exactly timestamp + ttl it is gone.',
          'The helper: {f: v for f, (v, exp) in self.data.get(key, {}).items() if exp is None or timestamp < exp}.',
          'Outline: get returns self._alive(...).get(field). delete checks field in self._alive(...) before del. scan_by_prefix sorts the keys of self._alive(...).',
        ],
      },
      {
        title: 'Level 4: backup and restore (change request)',
        instruction:
          'Open the change request. Add self.backups = []. backup(timestamp) builds a fresh {key: {field: (value, ttl_left)}} of live fields, appends (timestamp, snapshot), and returns its number of keys. restore finds the last backup at or before timestamp_to_restore and rebuilds self.data with expiry timestamp + ttl_left.',
        checkpoint: {
          description: 'Backups count live keys, restore picks the right backup, and restored ttls count from the restore time.',
          exerciseId: 'lab-inmemory-db-change',
          tests: [...DB_TESTS.l4, DB_TESTS.l2[0]],
        },
        hints: [
          'A backup is a copy made now and used later. Store what will still be true later: the time left, not the clock time.',
          'ttl_left = expires_at - timestamp, or None for a field without a ttl. Skip fields that are already expired.',
          'Backups are appended in time order, so the last one with backup_time <= timestamp_to_restore is the one to use.',
          'Outline: backup loops keys and fields into a new dict, appends, returns len. restore picks a snapshot (or returns if none) and rebuilds self.data from it.',
        ],
      },
    ],
    referenceSolution: DB_BUILD,
    explainBack: [
      'Why does a backup store the remaining ttl instead of the expiry time? Use a field restored long after its backup as the example.',
      'Explain how one helper for live fields made Level 3 a small change to Levels 1 and 2.',
      'What would go wrong if backup stored self.data itself instead of building a new dict?',
    ],
  },
}
