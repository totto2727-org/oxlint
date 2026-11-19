import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule from './no-direct-tag-access.ts'

runRuleTest('no-direct-tag-access', rule, {
  invalid: [
    "value._tag === 'Some'",
    "'Failure' === result['_tag']",
    "result?._tag !== 'Success'",
    "switch (state?.['_tag']) { case 'Ready': break }",
    'const tag = state[`_tag`]',
    'typeof value._tag',
    'value._tag = nextTag',
    'const { _tag: tag } = state',
    "const read = ({ ['_tag']: tag }) => tag",
    '({ _tag: tag } = state)',
    "'_tag' in value",
  ].map((code) => ({ code, errors: 1, output: null })),
  valid: [
    'Option.isSome(value)',
    'Option.isNone(value)',
    'Result.isSuccess(result)',
    'Result.isFailure(result)',
    'Exit.isFailure(exit)',
    "Match.value(state).pipe(Match.tag('Ready', use), Match.exhaustive)",
    'Match.value(state).pipe(Match.tagsExhaustive({ Ready: use }))',
    'value.tag',
    'value[_tag]',
    'const { [_tag]: tag } = value',
    "const pattern = { _tag: 'Ready' }",
  ],
})
