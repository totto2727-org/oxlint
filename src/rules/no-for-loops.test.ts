import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noForLoops } from './no-for-loops.ts'

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('no-for-loops', noForLoops, {
  invalid: [
    { code: 'for (let i = 0; i < values.length; i++) visit(values[i])', errors: [{ message: /Array combinators/u }] },
    { code: 'for (const value of values) visit(value)', errors: [{ message: /Iterable combinators/u }] },
    { code: 'for (const key in record) visit(key)', errors: [{ message: /Object.keys or Object.entries/u }] },
    {
      code: 'async function consume(source) { for await (const value of source) visit(value) }',
      errors: [{ message: /Stream.runForEach/u }],
    },
  ],
  valid: [
    { code: 'const result = Array.map(values, transform)', name: 'a collection combinator is allowed' },
    { code: 'while (shouldRetry()) retry()', name: 'while loops are outside the scope of this rule' },
  ],
})
