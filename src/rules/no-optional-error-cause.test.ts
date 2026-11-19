import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noOptionalErrorCause as rule } from './no-optional-error-cause.ts'

runRuleTest('no-optional-error-cause', rule, {
  invalid: [
    {
      code: `import { Data } from 'effect'; class Failure extends Data.TaggedError('Failure')<{ readonly cause?: unknown }> {}`,
      errors: 1,
    },
    {
      code: `import * as D from 'effect/Data'; const Failure = class extends D.TaggedError('Failure')<{ 'cause'?: unknown }> {}`,
      errors: 1,
    },
    {
      code: `import { TaggedError as Tagged } from 'effect/Data'; class Failure extends Tagged('Failure')<{ cause?: unknown }> {}`,
      errors: 1,
    },
    {
      code: `import { Schema as S } from 'effect'; class Failure extends S.TaggedErrorClass<Failure>()('Failure', { cause: S.optionalKey(S.Unknown) }) {}`,
      errors: 1,
    },
    {
      code: `import { TaggedErrorClass, optional, Unknown } from 'effect/Schema'; class Failure extends TaggedErrorClass<Failure>()('Failure', { cause: optional(Unknown) }) {}`,
      errors: 1,
    },
    {
      code: `import { Data } from 'effect'; type Fields = { readonly cause?: unknown }; class Failure extends Data.TaggedError('Failure')<Fields> {}`,
      errors: 1,
    },
    {
      code: `import { Data } from 'effect'; interface Base { cause?: unknown }; interface Fields extends Base { message: string }; class Failure extends Data.TaggedError('Failure')<Fields> {}`,
      errors: 1,
    },
    {
      code: `import { Schema } from 'effect'; const Fields = Schema.Struct({ cause: Schema.optionalKey(Schema.Unknown) }); class Failure extends Schema.TaggedError<Failure>()('Failure', Fields) {}`,
      errors: 1,
    },
    {
      code: `import { Data } from 'effect'; class Failure extends Data.TaggedError('Failure')<{ message: string }> { declare readonly cause?: unknown }`,
      errors: 1,
    },
  ].map(({ code, errors }) => ({ code, errors, filename: 'test.ts' })),
  valid: [
    `import { Data } from 'effect'; class Failure extends Data.TaggedError('Failure')<{ cause: unknown }> {}`,
    `import { Data } from 'effect'; class Failure extends Data.TaggedError('Failure')<{ details?: string }> {}`,
    `import { Data } from 'effect'; interface Base { cause?: unknown }; interface Fields extends Base { cause: unknown }; class Failure extends Data.TaggedError('Failure')<Fields> {}`,
    `import { Data } from 'effect'; type Fields = { cause?: unknown }; class Failure extends Data.TaggedError('Failure')<Fields & { cause: unknown }> {}`,
    `import { Schema } from 'effect'; class Failure extends Schema.TaggedErrorClass<Failure>()('Failure', { cause: Schema.Unknown }) {}`,
    `import { Schema } from 'effect'; const Fields = Schema.Struct({ cause: Schema.Unknown }); class Failure extends Schema.TaggedError<Failure>()('Failure', Fields) {}`,
    `import { Schema } from 'effect'; const Fields = { details: Schema.optional(Schema.Unknown) }; class Failure extends Schema.TaggedError<Failure>()('Failure', Fields) {}`,
    `import { Data } from './local.ts'; class Failure extends Data.TaggedError('Failure')<{ cause?: unknown }> {}`,
    `import { Data } from 'effect'; function f(Data: Library) { return class extends Data.TaggedError('Failure')<{ cause?: unknown }> {} }`,
    `interface LogEvent { cause?: unknown }`,
  ].map((code) => ({ code, filename: 'test.ts' })),
})
