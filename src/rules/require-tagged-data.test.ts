import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule from './require-tagged-data.ts'

runRuleTest('require-tagged-data', rule, {
  invalid: [
    { code: "type State = { _tag: 'Ready' } | { _tag: 'Pending' }", filename: 'test.ts', errors: 2, output: null },
    ...[
      "type State = { readonly _tag: 'Ready' }",
      "interface State { readonly '_tag': 'Ready' }",
      "type State = { ['_tag']: 'Ready' }",
      "class Ready { readonly _tag = 'Ready' }",
      "abstract class State { abstract readonly _tag: 'Ready' }",
      "class Ready { constructor(public readonly _tag = 'Ready') {} }",
      "class Ready { get _tag() { return 'Ready' } }",
      "const state = { _tag: 'Ready' }",
      "const state = { ['_tag']: 'Ready' }",
      'const state = { [`_tag`]: name }',
      'const state = { _tag }',
      "const Shape = Schema.Struct({ _tag: Schema.Literal('Ready') })",
    ].map((code) => ({ code, filename: 'test.ts', errors: 1, output: null })),
  ],
  valid: [
    "class Ready extends Data.TaggedClass('Ready')<{ readonly count: number }> {}",
    "class Failure extends Data.TaggedError('Failure')<{ readonly cause: unknown }> {}",
    'type State = Data.TaggedEnum<{ Ready: { count: number }; Pending: {} }>',
    "const Ready = Schema.TaggedStruct('Ready', { count: Schema.Number })",
    'const State = Schema.TaggedUnion({ Ready: { count: Schema.Number }, Pending: {} })',
    'type State = typeof Ready.Type',
    'const { _tag: tag } = state',
    'const name = state._tag',
    'const state = { [_tag]: name }',
    'const fn = (_tag: string) => _tag',
  ].map((code) => ({ code, filename: 'test.ts' })),
})
