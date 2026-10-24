import type { Section } from '@/lib/types'
import { code, t } from '@/data/exercises/build'

/**
 * The Applied Engineering mini-build (docs/applied-engineering.md): Grounded Support Answer,
 * an optional Week 12 lab. Retrieval first, the model second, and "I don't know" when nothing
 * relevant is found. The model is a deterministic function passed in. The Lab object lives in
 * data/course/content/labs-applied.ts.
 */

const lab = { stage: 'combine' as const, repType: 'combine' as const, lab: true, difficulty: 3 as const }
const p = (lines: string[]) => lines.join('\n')

const GROUNDED_STARTER = `DOCS = {
    'shipping.md': 'Orders ship within 2 business days. Express shipping arrives the next day.',
    'returns.md': 'Return any item within 30 days for a full refund. Opened software cannot be returned.',
    'warranty.md': 'Electronics have a 1 year warranty against defects. The warranty does not cover water damage.',
}

STOP_WORDS = {'a', 'an', 'the', 'is', 'are', 'my', 'i', 'can', 'do', 'does', 'how', 'what', 'for', 'to', 'of', 'it', 'in', 'on', 'be'}

NO_ANSWER = {'answer': "I don't know. A person will follow up.", 'source': None}


def fake_model(question, context):
    """A stand-in for a model told: answer only from the context."""
    return 'Based on our policy: ' + context


def words(text):
    """Lowercase words in text, without punctuation or stop words, as a set."""
    pass


def retrieve(question, docs, k=1):
    """Return up to k (score, name) pairs, best first, only for scores above zero."""
    pass


def answer(question, docs, model=fake_model):
    """Retrieve first. No match: NO_ANSWER without calling the model. Otherwise answer with the source."""
    pass`

const GROUNDED_BUILD = `DOCS = {
    'shipping.md': 'Orders ship within 2 business days. Express shipping arrives the next day.',
    'returns.md': 'Return any item within 30 days for a full refund. Opened software cannot be returned.',
    'warranty.md': 'Electronics have a 1 year warranty against defects. The warranty does not cover water damage.',
}

STOP_WORDS = {'a', 'an', 'the', 'is', 'are', 'my', 'i', 'can', 'do', 'does', 'how', 'what', 'for', 'to', 'of', 'it', 'in', 'on', 'be'}

NO_ANSWER = {'answer': "I don't know. A person will follow up.", 'source': None}


def fake_model(question, context):
    """A stand-in for a model told: answer only from the context."""
    return 'Based on our policy: ' + context


def words(text):
    """Lowercase words in text, without punctuation or stop words, as a set."""
    cleaned = ''.join(ch.lower() if ch.isalnum() else ' ' for ch in text)
    return {w for w in cleaned.split() if w not in STOP_WORDS}


def retrieve(question, docs, k=1):
    """Return up to k (score, name) pairs, best first, only for scores above zero."""
    q = words(question)
    scored = [(len(q & words(text)), name) for name, text in docs.items()]
    scored.sort(key=lambda pair: (-pair[0], pair[1]))
    return [pair for pair in scored if pair[0] > 0][:k]


def answer(question, docs, model=fake_model):
    """Retrieve first. No match: NO_ANSWER without calling the model. Otherwise answer with the source."""
    found = retrieve(question, docs)
    if not found:
        return dict(NO_ANSWER)
    name = found[0][1]
    return {'answer': model(question, docs[name]), 'source': name}`

const GROUNDED_CHANGE_STARTER = `DOCS = {
    'shipping.md': {'text': 'Orders ship within 2 business days. Express shipping arrives the next day.', 'updated': '2025-03-01'},
    'returns.md': {'text': 'Return any item within 30 days for a full refund. Opened software cannot be returned.', 'updated': '2024-06-01'},
    'returns-2026.md': {'text': 'Return any item within 60 days for a full refund. Opened software cannot be returned.', 'updated': '2026-09-15'},
    'warranty.md': {'text': 'Electronics have a 1 year warranty against defects. The warranty does not cover water damage.', 'updated': '2025-01-10'},
}

STOP_WORDS = {'a', 'an', 'the', 'is', 'are', 'my', 'i', 'can', 'do', 'does', 'how', 'what', 'for', 'to', 'of', 'it', 'in', 'on', 'be'}

NO_ANSWER = {'answer': "I don't know. A person will follow up.", 'source': None}


def fake_model(question, context):
    """A stand-in for a model told: answer only from the context."""
    return 'Based on our policy: ' + context


def words(text):
    """Lowercase words in text, without punctuation or stop words, as a set."""
    cleaned = ''.join(ch.lower() if ch.isalnum() else ' ' for ch in text)
    return {w for w in cleaned.split() if w not in STOP_WORDS}


def retrieve(question, docs, k=1):
    """Return up to k (score, name) pairs, best first, only for scores above zero."""
    q = words(question)
    scored = [(len(q & words(text)), name) for name, text in docs.items()]
    scored.sort(key=lambda pair: (-pair[0], pair[1]))
    return [pair for pair in scored if pair[0] > 0][:k]


def answer(question, docs, model=fake_model):
    """Retrieve first. No match: NO_ANSWER without calling the model. Otherwise answer with the source."""
    found = retrieve(question, docs)
    if not found:
        return dict(NO_ANSWER)
    name = found[0][1]
    return {'answer': model(question, docs[name]), 'source': name}`

const GROUNDED_CHANGE = `DOCS = {
    'shipping.md': {'text': 'Orders ship within 2 business days. Express shipping arrives the next day.', 'updated': '2025-03-01'},
    'returns.md': {'text': 'Return any item within 30 days for a full refund. Opened software cannot be returned.', 'updated': '2024-06-01'},
    'returns-2026.md': {'text': 'Return any item within 60 days for a full refund. Opened software cannot be returned.', 'updated': '2026-09-15'},
    'warranty.md': {'text': 'Electronics have a 1 year warranty against defects. The warranty does not cover water damage.', 'updated': '2025-01-10'},
}

STOP_WORDS = {'a', 'an', 'the', 'is', 'are', 'my', 'i', 'can', 'do', 'does', 'how', 'what', 'for', 'to', 'of', 'it', 'in', 'on', 'be'}

NO_ANSWER = {'answer': "I don't know. A person will follow up.", 'source': None}


def fake_model(question, context):
    """A stand-in for a model told: answer only from the context."""
    return 'Based on our policy: ' + context


def words(text):
    """Lowercase words in text, without punctuation or stop words, as a set."""
    cleaned = ''.join(ch.lower() if ch.isalnum() else ' ' for ch in text)
    return {w for w in cleaned.split() if w not in STOP_WORDS}


def newest_first(updated):
    """A sort key that puts later YYYY-MM-DD dates first."""
    return tuple(-int(part) for part in updated.split('-'))


def retrieve(question, docs, k=1):
    """Return up to k (score, name) pairs: best score first, then the newest, then by name. Scores above zero only."""
    q = words(question)
    scored = [(len(q & words(doc['text'])), newest_first(doc['updated']), name) for name, doc in docs.items()]
    scored.sort(key=lambda item: (-item[0], item[1], item[2]))
    return [(score, name) for score, _, name in scored if score > 0][:k]


def answer(question, docs, model=fake_model):
    """Retrieve first. No match: NO_ANSWER without calling the model. Otherwise answer from the newest best match."""
    found = retrieve(question, docs)
    if not found:
        return dict(NO_ANSWER)
    name = found[0][1]
    return {'answer': model(question, docs[name]['text']), 'source': name}`

export const sections: Section[] = [
  {
    id: 'labs-applied',
    title: 'Labs: Applied Engineering',
    summary: 'A small grounded-answer build: retrieval first, the model second, and an honest "I don\'t know".',
    exercises: [
      code({
        id: 'lab-grounded-answer-build',
        title: 'Grounded Support Answer: build',
        ...lab,
        skills: ['set_membership', 'sort_key', 'dict_get', 'edge_cases'],
        minutes: 30,
        signature: 'lab:grounded-answer',
        prompt: p([
          'A support assistant must answer only from the company\'s own policy documents. The starter gives you `DOCS` (document name to text), `STOP_WORDS`, `NO_ANSWER` and `fake_model(question, context)`, a deterministic stand-in for a model API. No network.',
          '',
          '1. `words(text)` returns the set of lowercase words in `text`. Treat every character that is not a letter or digit as a space, and leave out `STOP_WORDS`.',
          '2. `retrieve(question, docs, k=1)` scores each document by how many words it shares with the question (the size of the overlap of the two word sets).',
          '3. It returns up to `k` pairs `(score, name)`, highest score first. Ties go to the name that comes first alphabetically. Documents that score 0 are left out.',
          '4. `answer(question, docs, model=fake_model)` retrieves first. If nothing scored above 0, it returns a copy of `NO_ANSWER` and does not call the model at all.',
          '5. Otherwise it calls `model(question, text_of_best_document)` and returns `{"answer": what_the_model_said, "source": best_document_name}`.',
          '',
          "Examples: `words('Can I return it?')` → `{'return'}`. `retrieve('Can I pay with crypto?', DOCS)` → `[]`.",
        ]),
        hints: [
          'Build the word set once per text with a set comprehension. `a & b` is the set of words in both.',
          'Sort by a key that is `(-score, name)`: higher scores first, then names alphabetically.',
          'The "I don\'t know" branch comes before the model call: an unsupported question should cost nothing and invent nothing.',
        ],
        starterCode: GROUNDED_STARTER,
        solution: GROUNDED_BUILD,
        tests: [
          t.eq(`words("Can I return it?")`, `{"return"}`),
          t.eq(`retrieve("How long do I have to return an item?", DOCS)`, `[(2, "returns.md")]`),
          t.eq(`retrieve("Does the warranty cover water damage?", DOCS, k=3)`, `[(4, "warranty.md")]`),
          t.eq(`retrieve("Can I pay with crypto?", DOCS)`, `[]`),
          t.eq(`retrieve("ship return", DOCS, k=3)`, `[(1, "returns.md"), (1, "shipping.md")]`),
          t.eq(`answer("Is express shipping fast?", DOCS)["source"]`, `"shipping.md"`),
          t.eq(`answer("Can I pay with crypto?", DOCS)`, `{"answer": "I don't know. A person will follow up.", "source": None}`),
          t.check(
            'an unsupported question never reaches the model, and a supported one gets the right context',
            `calls = []
def spy(question, context):
    calls.append(context)
    return "ok"
answer("Can I pay with crypto?", DOCS, model=spy)
assert calls == [], "the model must not be called when nothing relevant was found"
out = answer("How long do I have to return an item?", DOCS, model=spy)
assert calls == [DOCS["returns.md"]], calls
assert out == {"answer": "ok", "source": "returns.md"}, out`,
          ),
          t.hidden(`retrieve("anything at all", {})`, `[]`),
          t.hidden(`answer("warranty water", DOCS, model=lambda q, c: q)["answer"]`, `"warranty water"`),
        ],
      }),
      code({
        id: 'lab-grounded-answer-change',
        title: 'Grounded Support Answer: change request',
        ...lab,
        skills: ['sort_key', 'dict_get', 'edge_cases'],
        minutes: 20,
        signature: 'lab:grounded-answer-change',
        prompt: p([
          'Change request: the customer changed their returns policy and added the new version without deleting the old one. The two documents now conflict.',
          'The starter is the working build, with the new `DOCS`: each value is now a dict `{"text": ..., "updated": "YYYY-MM-DD"}`, and `returns-2026.md` says 60 days where `returns.md` says 30.',
          '',
          '1. Update `retrieve` and `answer` to read each document\'s text from `doc["text"]`.',
          '2. When two documents have the same score, the one with the later `updated` date now comes first. If the dates are equal too, the name decides, alphabetically.',
          '3. `answer` passes the best document\'s text to the model, as before, and still returns `NO_ANSWER` without calling the model when nothing matches.',
          'Everything else must behave as before.',
          '',
          "Examples: `retrieve('Can I pay with crypto?', DOCS)` → `[]`. `answer('How long do I have to return an item?', DOCS)['source']` → `'returns-2026.md'`.",
        ]),
        hints: [
          'Dates written as YYYY-MM-DD sort correctly as plain strings. To put later dates first inside one sort, turn the date into numbers and negate them, or sort twice: first by date (newest first), then by score.',
          'A conflict between two sources is a data problem, not a model problem: fix it in retrieval, where the choice is made.',
        ],
        starterCode: GROUNDED_CHANGE_STARTER,
        solution: GROUNDED_CHANGE,
        tests: [
          t.eq(`retrieve("How long do I have to return an item?", DOCS, k=2)`, `[(2, "returns-2026.md"), (2, "returns.md")]`),
          t.eq(`answer("How long do I have to return an item?", DOCS)["source"]`, `"returns-2026.md"`),
          t.eq(`retrieve("Does the warranty cover water damage?", DOCS, k=3)`, `[(4, "warranty.md")]`),
          t.eq(`retrieve("Can I pay with crypto?", DOCS)`, `[]`),
          t.check(
            'the model gets the newest policy text, and equal dates fall back to the name',
            `seen = []
answer("Can I return an item after 45 days?", DOCS, model=lambda q, c: seen.append(c) or "ok")
assert seen == [DOCS["returns-2026.md"]["text"]], seen
same = {"b.md": {"text": "refund policy", "updated": "2026-01-01"}, "a.md": {"text": "refund policy", "updated": "2026-01-01"}}
assert retrieve("refund", same, k=2) == [(1, "a.md"), (1, "b.md")], retrieve("refund", same, k=2)`,
          ),
          t.hidden(`answer("Can I pay with crypto?", DOCS)["source"]`, `None`),
          t.hidden(`retrieve("ship return", DOCS, k=3)`, `[(1, "returns-2026.md"), (1, "shipping.md"), (1, "returns.md")]`),
        ],
      }),
    ],
  },
]
