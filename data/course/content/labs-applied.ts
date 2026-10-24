import type { Lab } from '@/data/course/types'

/**
 * Applied Engineering mini-build (docs/applied-engineering.md): optional, Week 12. It combines what
 * ae-retrieval, ae-model-boundary and ae-evals teach. Exercises live in data/exercises/course/labs-applied.ts.
 */
export const labs: Lab[] = [
  {
    id: 'lab-grounded-answer',
    title: 'Grounded Support Answer',
    week: 12,
    unitId: 'w12-matrix-tries',
    aiFde: true,
    optional: true,
    brief:
      'A support assistant must answer customers only from the company\'s own policy documents. Build the retrieval step that finds the right document, pass it to a simulated model, and say "I don\'t know" when nothing relevant exists, without ever calling the model to guess.',
    requirements: [
      '`words(text)` turns text into a set of lowercase words without punctuation or stop words.',
      '`retrieve(question, docs, k=1)` returns up to `k` `(score, name)` pairs by word overlap, best first, ties by name, zero scores left out.',
      '`answer(question, docs, model)` retrieves first. With no match it returns the fixed "I don\'t know" answer and never calls the model.',
      'With a match it calls `model(question, context)` with the best document\'s text and returns the answer with its `source`.',
      'The model is passed in. Tests use deterministic fakes: no network, no key, no randomness.',
    ],
    designQuestions: [
      'Draw the data flow from question to answer. Which steps are deterministic code, and which one is the model? (ae-retrieval, ae-model-boundary)',
      'Why must "nothing relevant found" be decided before the model is called, and in which function does that decision live?',
      'Your keyword retriever misses "Can I send it back?" for the returns policy. What kind of retrieval would catch it, and what would it cost you?',
      'How would you eval this system: what labelled question-to-document pairs would you collect, and how would you grade retrieval separately from the answer? (ae-evals)',
      'Two documents disagree. Is that a model problem, a retrieval problem or a data problem? Where would you fix it?',
      'What would you log for each question so someone could debug a wrong answer later?',
    ],
    buildExerciseId: 'lab-grounded-answer-build',
    changeRequest: {
      title: 'A conflicting policy',
      description:
        'The customer changed the returns policy from 30 to 60 days and added the new document without deleting the old one. Documents now carry an `updated` date. When two documents score the same, the newer one wins, so the model is given the current policy.',
      exerciseId: 'lab-grounded-answer-change',
    },
    review: [
      'An unsupported question returns the fixed answer and the model is never called; a test proves it.',
      'Every source the system answers from is named in the result.',
      'Ties are deterministic: the same question always picks the same document.',
      'You can name one question your keyword retriever gets wrong, and the eval case you would add for it.',
      'After the change request, the 60-day policy is the one the model sees, and a test says so.',
    ],
  },
]
