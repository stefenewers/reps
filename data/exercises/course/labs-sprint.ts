import type { Section, TestCase } from '@/lib/types'
import { code, t } from '@/data/exercises/build'

/**
 * Sprint and Prep builds: CodeSignal-style progressive builds (one class, four levels).
 * Each lab is a build (`<lab id>-build`, levels 1–3) plus a change request (`<lab id>-change`,
 * level 4) whose starter code is the reference build. Lab content lives in
 * data/course/content/labs-sprint.ts; scaffolds in data/course/content/scaffolds/sprint.ts.
 * The per-level test lists are exported so the scaffold checkpoints reuse them.
 */

const lab = { stage: 'combine' as const, repType: 'combine' as const, lab: true, difficulty: 3 as const }
const lines = (...xs: string[]) => xs.join('\n')
/** A `check` test: a block of Python statements (asserts) run after the learner's code. */
const chk = (name: string, body: string[], hidden = false): TestCase => t.check(name, body.join('\n'), hidden)

// ── Simple Bank System ──────────────────────────────────────────────────────

const BANK_STARTER = `class Bank:
    """A simple bank. Every operation takes a timestamp first; timestamps only go up."""

    def __init__(self):
        # Decide your state here: balances, money out per account, scheduled payments.
        pass

    def _run_due_payments(self, timestamp):
        """Level 3. Run every pending payment that is due by timestamp, earliest due time first.
        Call this at the start of every operation."""
        pass

    # ── Level 1 ──

    def create_account(self, timestamp, account_id):
        """Open an empty account. Return True, or False if the id is already taken."""
        pass

    def deposit(self, timestamp, account_id, amount):
        """Add amount to the account. Return the new balance, or None if there is no such account."""
        pass

    def transfer(self, timestamp, source_id, target_id, amount):
        """Move amount from source to target. Return the source balance after, or None if
        either account is missing, they are the same account, or the source has too little."""
        pass

    # ── Level 2 ──

    def top_spenders(self, timestamp, n):
        """Return up to n strings "id(total)", most money out first, ties by id A to Z."""
        pass

    # ── Level 3 ──

    def schedule_payment(self, timestamp, account_id, amount, delay):
        """Schedule a payment of amount, due at timestamp + delay. Return its id
        ("payment1", "payment2", ...) or None if there is no such account."""
        pass

    def get_payment_status(self, timestamp, account_id, payment_id):
        """Return "IN_PROGRESS", "SUCCESS" or "SKIPPED", or None if the account does not
        exist, the payment does not exist, or the payment belongs to another account."""
        pass
`

export const BANK_BUILD = `class Bank:
    """A simple bank. Every operation takes a timestamp first; timestamps only go up."""

    def __init__(self):
        self.balances = {}   # account id -> current balance
        self.outgoing = {}   # account id -> total money that has left the account
        self.payments = {}   # payment id -> {'account', 'amount', 'due', 'status'}
        self.payment_count = 0

    def _run_due_payments(self, timestamp):
        """Level 3. Run every pending payment that is due by timestamp, earliest due time first.
        Call this at the start of every operation."""
        due = [pid for pid, p in self.payments.items() if p['status'] == 'IN_PROGRESS' and p['due'] <= timestamp]
        due.sort(key=lambda pid: self.payments[pid]['due'])  # stable: ties stay in scheduling order
        for pid in due:
            p = self.payments[pid]
            account = p['account']
            if self.balances[account] >= p['amount']:
                self.balances[account] -= p['amount']
                self.outgoing[account] += p['amount']
                p['status'] = 'SUCCESS'
            else:
                p['status'] = 'SKIPPED'

    # ── Level 1 ──

    def create_account(self, timestamp, account_id):
        """Open an empty account. Return True, or False if the id is already taken."""
        self._run_due_payments(timestamp)
        if account_id in self.balances:
            return False
        self.balances[account_id] = 0
        self.outgoing[account_id] = 0
        return True

    def deposit(self, timestamp, account_id, amount):
        """Add amount to the account. Return the new balance, or None if there is no such account."""
        self._run_due_payments(timestamp)
        if account_id not in self.balances:
            return None
        self.balances[account_id] += amount
        return self.balances[account_id]

    def transfer(self, timestamp, source_id, target_id, amount):
        """Move amount from source to target. Return the source balance after, or None if
        either account is missing, they are the same account, or the source has too little."""
        self._run_due_payments(timestamp)
        if source_id not in self.balances or target_id not in self.balances:
            return None
        if source_id == target_id or self.balances[source_id] < amount:
            return None
        self.balances[source_id] -= amount
        self.balances[target_id] += amount
        self.outgoing[source_id] += amount
        return self.balances[source_id]

    # ── Level 2 ──

    def top_spenders(self, timestamp, n):
        """Return up to n strings "id(total)", most money out first, ties by id A to Z."""
        self._run_due_payments(timestamp)
        ranked = sorted(self.outgoing.items(), key=lambda item: (-item[1], item[0]))
        return [f'{account}({total})' for account, total in ranked[:n]]

    # ── Level 3 ──

    def schedule_payment(self, timestamp, account_id, amount, delay):
        """Schedule a payment of amount, due at timestamp + delay. Return its id
        ("payment1", "payment2", ...) or None if there is no such account."""
        self._run_due_payments(timestamp)
        if account_id not in self.balances:
            return None
        self.payment_count += 1
        payment_id = f'payment{self.payment_count}'
        self.payments[payment_id] = {'account': account_id, 'amount': amount, 'due': timestamp + delay, 'status': 'IN_PROGRESS'}
        return payment_id

    def get_payment_status(self, timestamp, account_id, payment_id):
        """Return "IN_PROGRESS", "SUCCESS" or "SKIPPED", or None if the account does not
        exist, the payment does not exist, or the payment belongs to another account."""
        self._run_due_payments(timestamp)
        if account_id not in self.balances:
            return None
        p = self.payments.get(payment_id)
        if p is None or p['account'] != account_id:
            return None
        return p['status']
`

const BANK_CHANGE = `${BANK_BUILD}
    # ── Level 4 ──

    def merge_accounts(self, timestamp, account_id_1, account_id_2):
        """Merge account 2 into account 1. Return True, or False if the ids are equal
        or either account is missing. Account 2 stops existing."""
        self._run_due_payments(timestamp)
        if account_id_1 == account_id_2:
            return False
        if account_id_1 not in self.balances or account_id_2 not in self.balances:
            return False
        self.balances[account_id_1] += self.balances.pop(account_id_2)
        self.outgoing[account_id_1] += self.outgoing.pop(account_id_2)
        for p in self.payments.values():
            if p['account'] == account_id_2:
                p['account'] = account_id_1
        return True
`

export const BANK_TESTS: Record<'l1' | 'l2' | 'l3' | 'l4', TestCase[]> = {
  l1: [
    chk('L1 create_account opens each id once', [
      'b = Bank()',
      "assert b.create_account(1, 'ana') is True",
      "assert b.create_account(2, 'ana') is False",
      "assert b.create_account(3, 'ben') is True",
    ]),
    chk('L1 deposit returns the new balance, None for an unknown account', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "assert b.deposit(2, 'ana', 100) == 100",
      "assert b.deposit(3, 'ana', 50) == 150",
      "assert b.deposit(4, 'zed', 10) is None",
    ]),
    chk('L1 transfer moves money and returns the source balance', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 100)",
      "assert b.transfer(4, 'ana', 'ben', 30) == 70",
      "assert b.deposit(5, 'ben', 0) == 30",
    ]),
    chk('L1 a failed transfer returns None and changes nothing', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 50)",
      "assert b.transfer(4, 'ana', 'ben', 60) is None",
      "assert b.transfer(5, 'ana', 'ana', 10) is None",
      "assert b.transfer(6, 'ana', 'zed', 10) is None",
      "assert b.transfer(7, 'zed', 'ana', 10) is None",
      "assert b.deposit(8, 'ana', 0) == 50",
      "assert b.deposit(9, 'ben', 0) == 0",
    ]),
    chk('L1 the whole balance can be sent', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 40)",
      "assert b.transfer(4, 'ana', 'ben', 40) == 0",
      "assert b.transfer(5, 'ben', 'ana', 41) is None",
    ], true),
  ],
  l2: [
    chk('L2 top_spenders ranks by money out', [
      'b = Bank()',
      "for i, a in enumerate(['ana', 'ben', 'cy']):",
      '    b.create_account(i, a)',
      '    b.deposit(10 + i, a, 100)',
      "b.transfer(20, 'ana', 'ben', 50)",
      "b.transfer(21, 'cy', 'ana', 20)",
      "b.transfer(22, 'ben', 'cy', 10)",
      "assert b.top_spenders(23, 3) == ['ana(50)', 'cy(20)', 'ben(10)']",
      "assert b.top_spenders(24, 1) == ['ana(50)']",
    ]),
    chk('L2 ties go A to Z, and n can be bigger than the bank', [
      'b = Bank()',
      "for i, a in enumerate(['dee', 'ana', 'cy', 'ben']):",
      '    b.create_account(i, a)',
      '    b.deposit(10 + i, a, 100)',
      "b.transfer(20, 'dee', 'ana', 30)",
      "b.transfer(21, 'cy', 'ana', 30)",
      "assert b.top_spenders(22, 10) == ['cy(30)', 'dee(30)', 'ana(0)', 'ben(0)']",
    ]),
    chk('L2 deposits and failed transfers are not money out', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 10)",
      "b.transfer(4, 'ana', 'ben', 99)",
      "b.transfer(5, 'ana', 'ana', 5)",
      "b.transfer(6, 'ana', 'ben', 4)",
      "assert b.top_spenders(7, 2) == ['ana(4)', 'ben(0)']",
    ], true),
    chk('L2 an empty bank has no spenders', ['b = Bank()', 'assert b.top_spenders(1, 3) == []'], true),
  ],
  l3: [
    chk('L3 payment ids count up across the whole bank', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "assert b.schedule_payment(3, 'ana', 10, 5) == 'payment1'",
      "assert b.schedule_payment(4, 'zed', 10, 5) is None",
      "assert b.schedule_payment(5, 'ben', 10, 5) == 'payment2'",
    ]),
    chk('L3 a payment waits, then runs before the operation at its due time', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.deposit(2, 'ana', 100)",
      "p = b.schedule_payment(3, 'ana', 30, 5)",
      "assert b.deposit(4, 'ana', 0) == 100",
      "assert b.get_payment_status(7, 'ana', p) == 'IN_PROGRESS'",
      "assert b.deposit(8, 'ana', 0) == 70",
      "assert b.get_payment_status(9, 'ana', p) == 'SUCCESS'",
    ]),
    chk('L3 a payment the account cannot cover is skipped', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.deposit(2, 'ana', 10)",
      "p = b.schedule_payment(3, 'ana', 50, 2)",
      "assert b.get_payment_status(5, 'ana', p) == 'SKIPPED'",
      "assert b.deposit(6, 'ana', 100) == 110",
      "assert b.get_payment_status(7, 'ana', p) == 'SKIPPED'",
    ]),
    chk('L3 a successful payment counts as money out', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 100)",
      "b.deposit(4, 'ben', 100)",
      "b.transfer(5, 'ben', 'ana', 20)",
      "b.schedule_payment(6, 'ana', 25, 1)",
      "assert b.top_spenders(7, 2) == ['ana(25)', 'ben(20)']",
    ]),
    chk('L3 get_payment_status checks the account and the payment', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "p = b.schedule_payment(3, 'ana', 10, 5)",
      "assert b.get_payment_status(4, 'ben', p) is None",
      "assert b.get_payment_status(5, 'zed', p) is None",
      "assert b.get_payment_status(6, 'ana', 'payment99') is None",
    ]),
    chk('L3 the earliest due payment runs first', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.deposit(2, 'ana', 50)",
      "late = b.schedule_payment(3, 'ana', 40, 10)",
      "early = b.schedule_payment(4, 'ana', 30, 5)",
      "assert b.deposit(20, 'ana', 0) == 20",
      "assert b.get_payment_status(21, 'ana', early) == 'SUCCESS'",
      "assert b.get_payment_status(22, 'ana', late) == 'SKIPPED'",
    ], true),
    chk('L3 payments due at the same time run in the order they were scheduled', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.deposit(2, 'ana', 50)",
      "first = b.schedule_payment(3, 'ana', 40, 5)",
      "second = b.schedule_payment(4, 'ana', 30, 4)",
      "assert b.top_spenders(9, 1) == ['ana(40)']",
      "assert b.get_payment_status(10, 'ana', first) == 'SUCCESS'",
      "assert b.get_payment_status(11, 'ana', second) == 'SKIPPED'",
    ], true),
    chk('L3 a transfer at the due time sees the balance after the payment', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 100)",
      "b.schedule_payment(4, 'ana', 80, 3)",
      "assert b.transfer(7, 'ana', 'ben', 50) is None",
      "assert b.transfer(8, 'ana', 'ben', 20) == 0",
    ], true),
  ],
  l4: [
    chk('L4 merge_accounts adds the balance and removes account 2', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 100)",
      "b.deposit(4, 'ben', 50)",
      "assert b.merge_accounts(5, 'ana', 'ben') is True",
      "assert b.deposit(6, 'ana', 0) == 150",
      "assert b.deposit(7, 'ben', 10) is None",
      "assert b.transfer(8, 'ana', 'ben', 10) is None",
    ]),
    chk('L4 merge_accounts refuses the same id or a missing account', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.deposit(2, 'ana', 100)",
      "assert b.merge_accounts(3, 'ana', 'ana') is False",
      "assert b.merge_accounts(4, 'ana', 'zed') is False",
      "assert b.merge_accounts(5, 'zed', 'ana') is False",
      "assert b.deposit(6, 'ana', 0) == 100",
    ]),
    chk('L4 money out is combined under account 1', [
      'b = Bank()',
      "for i, a in enumerate(['ana', 'ben', 'cy']):",
      '    b.create_account(i, a)',
      '    b.deposit(10 + i, a, 100)',
      "b.transfer(20, 'ana', 'cy', 30)",
      "b.transfer(21, 'ben', 'cy', 20)",
      "b.transfer(22, 'cy', 'ana', 40)",
      "assert b.merge_accounts(23, 'ana', 'ben') is True",
      "assert b.top_spenders(24, 5) == ['ana(50)', 'cy(40)']",
    ]),
    chk('L4 a pending payment of account 2 moves to account 1', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ana', 100)",
      "p = b.schedule_payment(4, 'ben', 60, 6)",
      "assert b.merge_accounts(5, 'ana', 'ben') is True",
      "assert b.get_payment_status(6, 'ana', p) == 'IN_PROGRESS'",
      "assert b.deposit(10, 'ana', 0) == 40",
      "assert b.get_payment_status(11, 'ana', p) == 'SUCCESS'",
      "assert b.get_payment_status(12, 'ben', p) is None",
    ]),
    chk('L4 a finished payment of account 2 is still visible through account 1', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ben', 10)",
      "p = b.schedule_payment(4, 'ben', 5, 1)",
      "b.deposit(6, 'ben', 0)",
      "assert b.merge_accounts(7, 'ana', 'ben') is True",
      "assert b.get_payment_status(8, 'ana', p) == 'SUCCESS'",
      "assert b.top_spenders(9, 1) == ['ana(5)']",
    ], true),
    chk('L4 a merged-away id can be opened again, fresh', [
      'b = Bank()',
      "b.create_account(1, 'ana')",
      "b.create_account(2, 'ben')",
      "b.deposit(3, 'ben', 70)",
      "p = b.schedule_payment(4, 'ben', 5, 100)",
      "b.merge_accounts(5, 'ana', 'ben')",
      "assert b.create_account(6, 'ben') is True",
      "assert b.deposit(7, 'ben', 0) == 0",
      "assert b.get_payment_status(8, 'ben', p) is None",
      "assert b.top_spenders(9, 2) == ['ana(0)', 'ben(0)']",
    ], true),
  ],
}

// ── In-Memory Database ──────────────────────────────────────────────────────

const DB_STARTER = `class InMemoryDB:
    """Records are keys; each key holds fields with values. Every operation takes a timestamp first."""

    def __init__(self):
        # Decide your state here: key -> fields, and (Level 3) when each field expires.
        pass

    # ── Level 1 ──

    def set(self, timestamp, key, field, value):
        """Store value under key and field, with no expiry. Return None."""
        pass

    def get(self, timestamp, key, field):
        """Return the value of field in key, or None if it does not exist."""
        pass

    def delete(self, timestamp, key, field):
        """Remove field from key. Return True if it existed, otherwise False."""
        pass

    # ── Level 2 ──

    def scan(self, timestamp, key):
        """Return ["field(value)", ...] for every field of key, sorted by field."""
        pass

    def scan_by_prefix(self, timestamp, key, prefix):
        """Like scan, but only the fields that start with prefix."""
        pass

    # ── Level 3 ──

    def set_with_ttl(self, timestamp, key, field, value, ttl):
        """Store value under key and field; it exists from timestamp until just before timestamp + ttl."""
        pass
`

export const DB_BUILD = `class InMemoryDB:
    """Records are keys; each key holds fields with values. Every operation takes a timestamp first."""

    def __init__(self):
        self.data = {}   # key -> {field: (value, expires_at)}; expires_at is None for no expiry

    def _alive(self, timestamp, key):
        """Return {field: value} for the fields of key that exist at timestamp."""
        fields = self.data.get(key, {})
        return {f: v for f, (v, exp) in fields.items() if exp is None or timestamp < exp}

    # ── Level 1 ──

    def set(self, timestamp, key, field, value):
        """Store value under key and field, with no expiry. Return None."""
        self.data.setdefault(key, {})[field] = (value, None)

    def get(self, timestamp, key, field):
        """Return the value of field in key, or None if it does not exist."""
        return self._alive(timestamp, key).get(field)

    def delete(self, timestamp, key, field):
        """Remove field from key. Return True if it existed, otherwise False."""
        if field not in self._alive(timestamp, key):
            return False
        del self.data[key][field]
        return True

    # ── Level 2 ──

    def scan(self, timestamp, key):
        """Return ["field(value)", ...] for every field of key, sorted by field."""
        return self.scan_by_prefix(timestamp, key, '')

    def scan_by_prefix(self, timestamp, key, prefix):
        """Like scan, but only the fields that start with prefix."""
        alive = self._alive(timestamp, key)
        return [f'{f}({alive[f]})' for f in sorted(alive) if f.startswith(prefix)]

    # ── Level 3 ──

    def set_with_ttl(self, timestamp, key, field, value, ttl):
        """Store value under key and field; it exists from timestamp until just before timestamp + ttl."""
        self.data.setdefault(key, {})[field] = (value, timestamp + ttl)
`

const DB_CHANGE = `class InMemoryDB:
    """Records are keys; each key holds fields with values. Every operation takes a timestamp first."""

    def __init__(self):
        self.data = {}      # key -> {field: (value, expires_at)}; expires_at is None for no expiry
        self.backups = []   # (timestamp, {key: {field: (value, ttl_left)}}), oldest first

    def _alive(self, timestamp, key):
        """Return {field: value} for the fields of key that exist at timestamp."""
        fields = self.data.get(key, {})
        return {f: v for f, (v, exp) in fields.items() if exp is None or timestamp < exp}

    # ── Level 1 ──

    def set(self, timestamp, key, field, value):
        """Store value under key and field, with no expiry. Return None."""
        self.data.setdefault(key, {})[field] = (value, None)

    def get(self, timestamp, key, field):
        """Return the value of field in key, or None if it does not exist."""
        return self._alive(timestamp, key).get(field)

    def delete(self, timestamp, key, field):
        """Remove field from key. Return True if it existed, otherwise False."""
        if field not in self._alive(timestamp, key):
            return False
        del self.data[key][field]
        return True

    # ── Level 2 ──

    def scan(self, timestamp, key):
        """Return ["field(value)", ...] for every field of key, sorted by field."""
        return self.scan_by_prefix(timestamp, key, '')

    def scan_by_prefix(self, timestamp, key, prefix):
        """Like scan, but only the fields that start with prefix."""
        alive = self._alive(timestamp, key)
        return [f'{f}({alive[f]})' for f in sorted(alive) if f.startswith(prefix)]

    # ── Level 3 ──

    def set_with_ttl(self, timestamp, key, field, value, ttl):
        """Store value under key and field; it exists from timestamp until just before timestamp + ttl."""
        self.data.setdefault(key, {})[field] = (value, timestamp + ttl)

    # ── Level 4 ──

    def backup(self, timestamp):
        """Save every field that exists now, with its remaining ttl. Return how many keys have fields."""
        snapshot = {}
        for key, fields in self.data.items():
            saved = {}
            for f, (v, exp) in fields.items():
                if exp is None:
                    saved[f] = (v, None)
                elif timestamp < exp:
                    saved[f] = (v, exp - timestamp)
            if saved:
                snapshot[key] = saved
        self.backups.append((timestamp, snapshot))
        return len(snapshot)

    def restore(self, timestamp, timestamp_to_restore):
        """Replace the data with the latest backup taken at or before timestamp_to_restore.
        Remaining ttls count from timestamp. With no such backup, change nothing. Return None."""
        chosen = None
        for backup_time, snapshot in self.backups:
            if backup_time <= timestamp_to_restore:
                chosen = snapshot
        if chosen is None:
            return None
        self.data = {}
        for key, saved in chosen.items():
            self.data[key] = {}
            for f, (v, left) in saved.items():
                self.data[key][f] = (v, None if left is None else timestamp + left)
        return None
`

export const DB_TESTS: Record<'l1' | 'l2' | 'l3' | 'l4', TestCase[]> = {
  l1: [
    chk('L1 set stores a value that get reads back', [
      'db = InMemoryDB()',
      "assert db.set(1, 'user1', 'name', 'ana') is None",
      "assert db.get(2, 'user1', 'name') == 'ana'",
      "assert db.get(3, 'user1', 'age') is None",
      "assert db.get(4, 'user2', 'name') is None",
    ]),
    chk('L1 set on an existing field overwrites it', [
      'db = InMemoryDB()',
      "db.set(1, 'user1', 'name', 'ana')",
      "db.set(2, 'user1', 'name', 'ben')",
      "db.set(3, 'user2', 'name', 'cy')",
      "assert db.get(4, 'user1', 'name') == 'ben'",
      "assert db.get(5, 'user2', 'name') == 'cy'",
    ]),
    chk('L1 delete removes a field once', [
      'db = InMemoryDB()',
      "db.set(1, 'user1', 'name', 'ana')",
      "db.set(2, 'user1', 'city', 'oslo')",
      "assert db.delete(3, 'user1', 'name') is True",
      "assert db.get(4, 'user1', 'name') is None",
      "assert db.delete(5, 'user1', 'name') is False",
      "assert db.get(6, 'user1', 'city') == 'oslo'",
    ]),
    chk('L1 delete on a missing key is False', ['db = InMemoryDB()', "assert db.delete(1, 'nope', 'name') is False"], true),
  ],
  l2: [
    chk('L2 scan lists every field, sorted by field', [
      'db = InMemoryDB()',
      "db.set(1, 'user1', 'name', 'ana')",
      "db.set(2, 'user1', 'age', '31')",
      "db.set(3, 'user1', 'city', 'oslo')",
      "db.set(4, 'user2', 'name', 'ben')",
      "assert db.scan(5, 'user1') == ['age(31)', 'city(oslo)', 'name(ana)']",
      "assert db.scan(6, 'user3') == []",
    ]),
    chk('L2 scan_by_prefix keeps only matching fields', [
      'db = InMemoryDB()',
      "db.set(1, 'user1', 'age', '31')",
      "db.set(2, 'user1', 'address', 'main st')",
      "db.set(3, 'user1', 'name', 'ana')",
      "assert db.scan_by_prefix(4, 'user1', 'a') == ['address(main st)', 'age(31)']",
      "assert db.scan_by_prefix(5, 'user1', 'ag') == ['age(31)']",
      "assert db.scan_by_prefix(6, 'user1', 'z') == []",
      "assert db.scan_by_prefix(7, 'user9', 'a') == []",
    ]),
    chk('L2 scan leaves out deleted fields', [
      'db = InMemoryDB()',
      "db.set(1, 'k', 'b', '2')",
      "db.set(2, 'k', 'a', '1')",
      "db.delete(3, 'k', 'a')",
      "assert db.scan(4, 'k') == ['b(2)']",
      "db.delete(5, 'k', 'b')",
      "assert db.scan(6, 'k') == []",
    ], true),
    chk('L2 an empty prefix matches every field', [
      'db = InMemoryDB()',
      "db.set(1, 'k', 'y', '2')",
      "db.set(2, 'k', 'x', '1')",
      "assert db.scan_by_prefix(3, 'k', '') == ['x(1)', 'y(2)']",
    ], true),
  ],
  l3: [
    chk('L3 a ttl field exists from timestamp until just before timestamp + ttl', [
      'db = InMemoryDB()',
      "assert db.set_with_ttl(10, 'k', 'f', 'v', 5) is None",
      "assert db.get(10, 'k', 'f') == 'v'",
      "assert db.get(14, 'k', 'f') == 'v'",
      "assert db.get(15, 'k', 'f') is None",
    ]),
    chk('L3 scans skip expired fields', [
      'db = InMemoryDB()',
      "db.set(1, 'k', 'a', '1')",
      "db.set_with_ttl(2, 'k', 'ab', '2', 3)",
      "db.set_with_ttl(3, 'k', 'b', '3', 10)",
      "assert db.scan(4, 'k') == ['a(1)', 'ab(2)', 'b(3)']",
      "assert db.scan(5, 'k') == ['a(1)', 'b(3)']",
      "assert db.scan_by_prefix(6, 'k', 'a') == ['a(1)']",
    ]),
    chk('L3 deleting an expired field is False', [
      'db = InMemoryDB()',
      "db.set_with_ttl(1, 'k', 'f', 'v', 2)",
      "assert db.delete(3, 'k', 'f') is False",
      "db.set_with_ttl(4, 'k', 'g', 'v', 2)",
      "assert db.delete(5, 'k', 'g') is True",
      "assert db.get(5, 'k', 'g') is None",
    ]),
    chk('L3 a plain set clears the ttl, a ttl set adds one', [
      'db = InMemoryDB()',
      "db.set_with_ttl(1, 'k', 'f', 'old', 5)",
      "db.set(2, 'k', 'f', 'new')",
      "assert db.get(100, 'k', 'f') == 'new'",
      "db.set_with_ttl(101, 'k', 'f', 'temp', 4)",
      "assert db.get(104, 'k', 'f') == 'temp'",
      "assert db.get(105, 'k', 'f') is None",
    ], true),
    chk('L3 setting again with a ttl starts a new window', [
      'db = InMemoryDB()',
      "db.set_with_ttl(1, 'k', 'f', 'v1', 5)",
      "db.set_with_ttl(4, 'k', 'f', 'v2', 5)",
      "assert db.get(8, 'k', 'f') == 'v2'",
      "assert db.get(9, 'k', 'f') is None",
      "db.set_with_ttl(10, 'k', 'f', 'v3', 1)",
      "assert db.scan(10, 'k') == ['f(v3)']",
    ], true),
  ],
  l4: [
    chk('L4 backup counts the keys that still have fields', [
      'db = InMemoryDB()',
      "db.set(1, 'a', 'f', '1')",
      "db.set(2, 'b', 'f', '2')",
      "db.set(3, 'c', 'f', '3')",
      "db.delete(4, 'c', 'f')",
      "db.set_with_ttl(5, 'd', 'f', '4', 2)",
      'assert db.backup(6) == 3',
      'assert db.backup(7) == 2',
      'assert InMemoryDB().backup(1) == 0',
    ]),
    chk('L4 restore brings back the data as it was at the backup', [
      'db = InMemoryDB()',
      "db.set(1, 'a', 'x', '1')",
      "db.set(2, 'a', 'y', '2')",
      'db.backup(3)',
      "db.delete(4, 'a', 'x')",
      "db.set(5, 'b', 'z', '9')",
      'assert db.restore(6, 3) is None',
      "assert db.scan(7, 'a') == ['x(1)', 'y(2)']",
      "assert db.get(8, 'b', 'z') is None",
    ]),
    chk('L4 restore picks the latest backup at or before the time asked for', [
      'db = InMemoryDB()',
      "db.set(1, 'k', 'f', 'first')",
      'db.backup(5)',
      "db.set(6, 'k', 'f', 'second')",
      'db.backup(10)',
      "db.set(11, 'k', 'f', 'third')",
      'db.restore(12, 9)',
      "assert db.get(13, 'k', 'f') == 'first'",
      'db.restore(14, 10)',
      "assert db.get(15, 'k', 'f') == 'second'",
    ]),
    chk('L4 a restored ttl counts from the restore time', [
      'db = InMemoryDB()',
      "db.set_with_ttl(1, 'k', 'f', 'v', 10)",
      'db.backup(4)',
      "assert db.get(12, 'k', 'f') is None",
      'db.restore(20, 4)',
      "assert db.get(26, 'k', 'f') == 'v'",
      "assert db.get(27, 'k', 'f') is None",
    ]),
    chk('L4 with no backup old enough, restore changes nothing', [
      'db = InMemoryDB()',
      "db.set(1, 'k', 'f', 'v')",
      'db.backup(5)',
      "db.set(6, 'k', 'g', 'w')",
      'db.restore(7, 4)',
      "assert db.scan(8, 'k') == ['f(v)', 'g(w)']",
    ], true),
    chk('L4 a field that expired before the backup is not restored', [
      'db = InMemoryDB()',
      "db.set_with_ttl(1, 'k', 'gone', 'v', 2)",
      "db.set(2, 'k', 'kept', 'w')",
      'assert db.backup(5) == 1',
      'db.restore(6, 5)',
      "assert db.scan(7, 'k') == ['kept(w)']",
    ], true),
    chk('L4 changing data after a restore does not change the backup', [
      'db = InMemoryDB()',
      "db.set(1, 'k', 'f', 'v')",
      'db.backup(2)',
      'db.restore(3, 2)',
      "db.set(4, 'k', 'f', 'changed')",
      'db.restore(5, 2)',
      "assert db.get(6, 'k', 'f') == 'v'",
    ], true),
  ],
}

const BANK_HINTS = [
  'Every operation is a method on one object, so the state lives on self. Ask: what must I remember between calls? Balances, money out per account, and scheduled payments.',
  'Use dicts keyed by account id: one for balances, one for money out. Store each scheduled payment in a dict keyed by its id, holding its account, amount, due time and status.',
  'Write a helper that runs due payments and call it on the first line of every public method. Sort with key=lambda item: (-total, account_id) for top_spenders.',
  'Outline: __init__ makes the dicts and a payment counter. Each method: run due payments, validate (missing account, same account, too little money), update state, return the value.',
]

const DB_HINTS = [
  'Two levels of lookup: a key holds many fields. A dict of dicts fits: data[key][field].',
  'From Level 3 on, store each field as a (value, expires_at) pair. expires_at is None for a field with no ttl.',
  'Write one helper that returns the live fields of a key at a timestamp: keep a field when expires_at is None or timestamp < expires_at. Build get, delete and both scans on it.',
  "Outline: set and set_with_ttl write data.setdefault(key, {})[field] = (value, expires_at). get reads the helper. scan_by_prefix sorts the helper's fields and filters with startswith.",
]

export const sections: Section[] = [
  {
    id: 'lab-sprint-builds',
    title: 'Sprint builds: progressive levels',
    summary: 'CodeSignal-style builds: one class grows through four levels, each change keeping the old behaviour.',
    exercises: [
      // ── Simple Bank System ──
      code({
        id: 'lab-bank-system-build',
        title: 'Simple Bank System',
        ...lab,
        style: 'from-signature',
        skills: ['dict_assign', 'dict_membership', 'sort_key', 'state_tracking'],
        minutes: 60,
        prompt: lines(
          'Build a class `Bank`. Every method takes an integer `timestamp` first. Timestamps only go up from call to call.',
          'Account ids are strings. Amounts are positive integers.',
          '',
          '**Level 1: accounts**',
          '1. `create_account(timestamp, account_id)` opens an account with balance 0. Return `True`, or `False` if the id already exists.',
          '2. `deposit(timestamp, account_id, amount)` adds money. Return the new balance, or `None` if the account does not exist.',
          '3. `transfer(timestamp, source_id, target_id, amount)` moves money. Return the source balance after the transfer.',
          '4. Return `None` from `transfer` if either account is missing, the two ids are the same, or the source has less than `amount`.',
          '',
          '**Level 2: ranking**',
          "5. `top_spenders(timestamp, n)` returns up to `n` strings like `'ana(50)'`: account id and total money out.",
          '6. Money out is successful transfers out plus successful payments. Sort by money out, high to low, then by id A to Z. Accounts with 0 are included.',
          '',
          '**Level 3: scheduled payments**',
          '7. `schedule_payment(timestamp, account_id, amount, delay)` returns a payment id, or `None` if the account does not exist.',
          "8. Ids count up across the whole bank: `'payment1'`, `'payment2'`, and so on. The payment is due at `timestamp + delay`; `delay` is at least 1.",
          "9. At the start of every operation, run each pending payment whose due time is at or before that operation's timestamp. Then do the operation.",
          '10. Run due payments earliest due time first; equal due times go in the order they were scheduled.',
          '11. A payment withdraws its amount and counts as money out. If the balance is too low, it is skipped instead.',
          "12. `get_payment_status(timestamp, account_id, payment_id)` returns `'IN_PROGRESS'`, `'SUCCESS'` or `'SKIPPED'`.",
          '13. It returns `None` if the account does not exist, the payment does not exist, or the payment belongs to another account.',
          '',
          'Example:',
          '```',
          'b = Bank()',
          "b.create_account(1, 'ana')        # True",
          "b.deposit(2, 'ana', 100)          # 100",
          "b.schedule_payment(3, 'ana', 30, 5)   # 'payment1', due at 8",
          "b.deposit(8, 'ana', 0)            # 70: the payment ran first",
          '```',
        ),
        starterCode: BANK_STARTER,
        solution: BANK_BUILD,
        tests: [...BANK_TESTS.l1, ...BANK_TESTS.l2, ...BANK_TESTS.l3],
        hints: BANK_HINTS,
        explanation:
          'The bank is three dicts and a counter on self. Every public method first runs the payments that are due, so the bank is up to date before it does anything. Each method then checks its failure cases, changes state, and returns. top_spenders sorts by (-total, id), so the biggest totals come first and ties go A to Z. Due payments are sorted by due time with a stable sort, so equal due times keep their scheduling order.',
      }),
      code({
        id: 'lab-bank-system-change',
        title: 'Simple Bank System: merge accounts',
        ...lab,
        style: 'modify',
        skills: ['dict_items', 'dict_membership', 'state_tracking', 'edge_cases'],
        minutes: 45,
        prompt: lines(
          'Change request (Level 4): customers want to merge two accounts into one.',
          'Your bank from Levels 1–3 is loaded. Keep everything working and add one method.',
          '',
          '1. `merge_accounts(timestamp, account_id_1, account_id_2)` merges account 2 into account 1 and returns `True`.',
          '2. Return `False` and change nothing if the ids are the same or either account does not exist.',
          "3. Account 1 gets account 2's balance and adds account 2's money out to its own.",
          '4. Every payment of account 2 now belongs to account 1. A pending one withdraws from account 1 when it is due.',
          '5. Account 2 stops existing: operations on it act like any missing account. Its id can be opened again as a new, empty account.',
          '6. Run due payments first, like every other operation.',
          '',
          'Example:',
          '```',
          "b.deposit(1, 'ana', 100)              # ana and ben exist",
          "b.deposit(2, 'ben', 50)",
          "b.merge_accounts(3, 'ana', 'ben')     # True",
          "b.deposit(4, 'ana', 0)                # 150",
          "b.deposit(5, 'ben', 0)                # None",
          '```',
        ),
        starterCode: BANK_BUILD,
        solution: BANK_CHANGE,
        tests: [...BANK_TESTS.l4, BANK_TESTS.l1[3], BANK_TESTS.l2[1], { ...BANK_TESTS.l3[1], hidden: true }, { ...BANK_TESTS.l3[2], hidden: true }],
        hints: [
          'A merge is a move: everything account 2 owns gets a new owner, then account 2 is removed.',
          'Three things belong to an account: its balance, its money-out total, and the payments whose account field is its id.',
          'Add the balances and the totals, popping account 2 out of both dicts. Then loop over self.payments.values() and change the account on every payment of account 2.',
          'Outline: run due payments; return False for equal ids or a missing id; add and pop the balance; add and pop the money out; reassign payments; return True.',
        ],
        explanation:
          'Because payments store their owner by id, moving them is one loop that rewrites the owner. Popping account 2 from both dicts makes every other method treat it as missing, so no old method needs to change. Finished payments move too, so their status stays readable through account 1.',
      }),

      // ── In-Memory Database ──
      code({
        id: 'lab-inmemory-db-build',
        title: 'In-Memory Database',
        ...lab,
        style: 'from-signature',
        skills: ['dict_create', 'dict_get', 'sort_key', 'string_methods'],
        minutes: 50,
        prompt: lines(
          'Build a class `InMemoryDB`. A record is a `key`, and each key holds `field`s with values. Keys, fields and values are strings.',
          'Every method takes an integer `timestamp` first. Timestamps only go up from call to call.',
          '',
          '**Level 1: records**',
          '1. `set(timestamp, key, field, value)` stores the value, overwriting any old one. It returns `None`.',
          '2. `get(timestamp, key, field)` returns the value, or `None` if the key or field does not exist.',
          '3. `delete(timestamp, key, field)` removes the field. Return `True` if it existed, otherwise `False`.',
          '',
          '**Level 2: scans**',
          "4. `scan(timestamp, key)` returns a list of strings like `'age(31)'`, one per field of the key, sorted by field name.",
          '5. `scan_by_prefix(timestamp, key, prefix)` does the same for the fields whose names start with `prefix`.',
          '6. A missing key scans to an empty list.',
          '',
          '**Level 3: time to live**',
          '7. `set_with_ttl(timestamp, key, field, value, ttl)` stores the value like `set`. It returns `None`.',
          '8. The field exists from `timestamp` up to, but not including, `timestamp + ttl`.',
          '9. Every read respects expiry: `get`, `delete` and both scans treat an expired field as missing.',
          '10. A plain `set` on a field removes its ttl. A new `set_with_ttl` starts a new window.',
          '',
          'Example:',
          '```',
          'db = InMemoryDB()',
          "db.set(1, 'user1', 'name', 'ana')",
          "db.set_with_ttl(2, 'user1', 'age', '31', 5)",
          "db.scan(3, 'user1')    # ['age(31)', 'name(ana)']",
          "db.get(7, 'user1', 'age')   # None: it existed at 2..6",
          '```',
        ),
        starterCode: DB_STARTER,
        solution: DB_BUILD,
        tests: [...DB_TESTS.l1, ...DB_TESTS.l2, ...DB_TESTS.l3],
        hints: DB_HINTS,
        explanation:
          'The database is a dict of dicts, and each field holds a (value, expires_at) pair. One helper returns the live fields of a key at a timestamp, so expiry is written once and every read goes through it. Both scans sort the live field names and filter by prefix; scan is scan_by_prefix with an empty prefix.',
      }),
      code({
        id: 'lab-inmemory-db-change',
        title: 'In-Memory Database: backup and restore',
        ...lab,
        style: 'modify',
        skills: ['dict_items', 'state_tracking', 'edge_cases'],
        minutes: 45,
        prompt: lines(
          'Change request (Level 4): the database needs backups. Your build from Levels 1–3 is loaded. Keep it working and add two methods.',
          '',
          '1. `backup(timestamp)` saves every field that exists at `timestamp`, with its remaining ttl. Return the number of keys that have at least one field.',
          '2. The remaining ttl of a field is its expiry time minus the backup time. A field with no ttl stays without one.',
          '3. `restore(timestamp, timestamp_to_restore)` finds the latest backup taken at or before `timestamp_to_restore`. It returns `None`.',
          '4. It replaces all current data with that backup. A restored field expires at the restore `timestamp` plus its remaining ttl.',
          '5. If there is no backup that old, restore changes nothing.',
          '6. Later changes must not change a saved backup, so a backup can be restored more than once.',
          '',
          'Example:',
          '```',
          "db.set_with_ttl(1, 'k', 'f', 'v', 10)   # expires at 11",
          'db.backup(4)                             # 1; f has 7 left',
          'db.restore(20, 4)                        # f now expires at 27',
          "db.get(26, 'k', 'f')                     # 'v'",
          '```',
        ),
        starterCode: DB_BUILD,
        solution: DB_CHANGE,
        tests: [...DB_TESTS.l4, DB_TESTS.l2[0], { ...DB_TESTS.l3[0], hidden: true }, { ...DB_TESTS.l3[1], hidden: true }],
        hints: [
          'A backup is a copy of the live data at one moment, kept in a list with the time it was taken.',
          'Save remaining ttl (expires_at - timestamp), not expires_at: the restore turns it back into an expiry time relative to the restore.',
          'Build a fresh dict for each backup; never store self.data itself. On restore, walk the backups and keep the last one whose time is <= timestamp_to_restore.',
          'Outline: backup builds {key: {field: (value, ttl_left)}} from live fields, appends (timestamp, snapshot), returns its length. restore picks a snapshot and rebuilds self.data with timestamp + ttl_left.',
        ],
        explanation:
          'A backup stores time left, not an expiry time, because the clock keeps moving while the backup sits on the shelf. Restore converts it back with the restore timestamp. Each backup is a freshly built dict, and restore builds a fresh self.data, so later writes never reach a saved backup.',
      }),
    ],
  },
]
