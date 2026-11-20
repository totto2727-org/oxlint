import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { getNullishPredicateMember, preferIsNullish as rule } from './prefer-is-nullish.ts'

const makePredicateMember = (method: string): object => ({
  object: { name: 'Predicate', type: 'Identifier' },
  property: { name: method, type: 'Identifier' },
  type: 'MemberExpression',
})

describe('nullish predicate member detection', () => {
  test.each(['isNull', 'isNotNull', 'isUndefined', 'isNotUndefined'])('%s returns method name', (method) => {
    expect(getNullishPredicateMember(makePredicateMember(method))).toBe(method)
  })

  test('allows isNullish', () => {
    expect(getNullishPredicateMember(makePredicateMember('isNullish'))).toBeUndefined()
  })

  test('allows isNotNullish', () => {
    expect(getNullishPredicateMember(makePredicateMember('isNotNullish'))).toBeUndefined()
  })

  test('allows other namespaces', () => {
    expect(
      getNullishPredicateMember({
        object: { name: 'Option', type: 'Identifier' },
        property: { name: 'isNull', type: 'Identifier' },
        type: 'MemberExpression',
      }),
    ).toBeUndefined()
  })

  test('ignores expressions without an object', () => {
    expect(getNullishPredicateMember({ name: 'isNull', type: 'Identifier' })).toBeUndefined()
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('prefer-is-nullish', rule, {
  invalid: [
    { code: 'if (Predicate.isNull(x)) {}', errors: 1, name: 'Predicate.isNull is reported' },
    { code: 'if (Predicate.isNotNull(x)) {}', errors: 1, name: 'Predicate.isNotNull is reported' },
    { code: 'if (Predicate.isUndefined(x)) {}', errors: 1, name: 'Predicate.isUndefined is reported' },
    { code: 'if (Predicate.isNotUndefined(x)) {}', errors: 1, name: 'Predicate.isNotUndefined is reported' },
  ],
  valid: [
    { code: 'if (Predicate.isNullish(x)) {}', name: 'Predicate.isNullish is allowed' },
    { code: 'if (Predicate.isNotNullish(x)) {}', name: 'Predicate.isNotNullish is allowed' },
    { code: 'if (Predicate.isString(x)) {}', name: 'unrelated Predicate method is allowed' },
    { code: 'if (Other.isNull(x)) {}', name: 'non-Predicate namespace isNull is allowed' },
  ],
})
