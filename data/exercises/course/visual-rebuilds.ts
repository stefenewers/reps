import { visualWorkedExamples } from '@/data/course/content/visual-examples'
import { write } from '@/data/exercises/build'
import type { Section } from '@/lib/types'

export const sections: Section[] = visualWorkedExamples.map((example) => ({
  id: example.reconstructionExerciseId,
  title: example.title,
  summary: 'Reconstruct the worked example from a blank editor.',
  exercises: [
    write({
      id: example.reconstructionExerciseId,
      title: `Rebuild: ${example.title}`,
      skills: example.skills,
      prompt:
        example.problem +
        '\n\n' +
        (example.id === 'we-rewire'
          ? '`reverse_chain(build_list([4, 7, 2]))` → `ListNode(2)` (the new head)\n`reverse_chain(None)` → `None`'
          : example.tests
              .filter((test) => test.call && test.expected && !test.hidden)
              .slice(0, 2)
              .map((test) => '`' + test.call + '` → `' + test.expected + '`')
              .join('\n')),
      stage: 'reconstruct',
      minutes: 8,
      difficulty: 3,
      starterCode: example.starterCode,
      solution: example.solution,
      tests: example.tests,
      examples: example.tests
        .filter((test) => test.call && test.expected && !test.hidden)
        .slice(0, 2)
        .map((test) => ({ input: test.call!, output: test.expected! })),
      explanation: 'Rebuild the steps you reasoned through, then check the edge cases in the tests.'
    })
  ]
}))
