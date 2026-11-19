import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { requireTaggedError as rule } from './require-tagged-error.ts'

runRuleTest('require-tagged-error', rule, {
  invalid: [
    { code: `throw new Error('invalid')`, errors: 1 },
    { code: `Effect.fail(new TypeError('invalid', { cause }))`, errors: 1 },
    { code: `const error = globalThis['RangeError']('invalid')`, errors: 1 },
    { code: `class QueryDecodeError extends globalThis.Error {}`, errors: 1 },
    { code: `const QueryDecodeError = class extends Error {}`, errors: 1 },
    { code: `import { Data } from 'effect'; new Data.Error({ cause })`, errors: 1 },
    { code: `import { Error as Untagged } from 'effect/Data'; class Failure extends Untagged {}`, errors: 1 },
  ],
  valid: [
    `class InvalidInput extends Data.TaggedError('InvalidInput')<{ message: string }> {}`,
    `class ReadError extends Data.TaggedError('ReadError')<{ cause: unknown }> {}`,
    `class ReadError extends Schema.TaggedErrorClass<ReadError>()('ReadError', { cause: Schema.Unknown }) {}`,
    `function check(Error: () => object) { return Error() }`,
    `function check(globalThis: { Error: () => object }) { return globalThis.Error() }`,
    `import { Error } from './domain.ts'; new Error()`,
    `const error: Error = original; throw error`,
    `declare class ExternalError extends Error {}`,
  ].map((code) => ({ code, filename: 'test.ts' })),
})
