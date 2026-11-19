import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isSchemaUnknownDecodeCall, preferNonUnknownDecode as rule } from './prefer-non-unknown-decode.ts'

const makeSchemaCall = (method: string): object => ({
  callee: {
    computed: false,
    object: { name: 'Schema', type: 'Identifier' },
    property: { name: method, type: 'Identifier' },
    type: 'MemberExpression',
  },
  type: 'CallExpression',
})

describe('unknown schema decoder detection', () => {
  test.each(['decodeUnknownEffect', 'decodeUnknownExit'])('%s returns method name', (method) => {
    expect(isSchemaUnknownDecodeCall(makeSchemaCall(method))).toBe(method)
  })

  test('allows decodeEffect', () => {
    expect(isSchemaUnknownDecodeCall(makeSchemaCall('decodeEffect'))).toBeUndefined()
  })

  test('allows decodeExit', () => {
    expect(isSchemaUnknownDecodeCall(makeSchemaCall('decodeExit'))).toBeUndefined()
  })

  test('allows other namespaces', () => {
    expect(
      isSchemaUnknownDecodeCall({
        callee: {
          computed: false,
          object: { name: 'Other', type: 'Identifier' },
          property: { name: 'decodeUnknownEffect', type: 'Identifier' },
          type: 'MemberExpression',
        },
        type: 'CallExpression',
      }),
    ).toBeUndefined()
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('prefer-non-unknown-decode', rule, {
  invalid: [
    {
      code: 'Schema.decodeUnknownEffect(schema)(input)',
      errors: 1,
      name: 'decodeUnknownEffect is reported',
    },
    {
      code: 'Schema.decodeUnknownExit(schema)(input)',
      errors: 1,
      name: 'decodeUnknownExit is reported',
    },
  ],
  valid: [
    { code: 'Schema.decodeEffect(schema)(input)', name: 'decodeEffect is allowed' },
    { code: 'Schema.decodeExit(schema)(input)', name: 'decodeExit is allowed' },
    {
      code: 'Other.decodeUnknownEffect(schema)(input)',
      name: 'non-Schema namespace decodeUnknownEffect is ignored',
    },
  ],
})
