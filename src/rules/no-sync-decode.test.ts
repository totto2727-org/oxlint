import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isSchemaBannedDecodeCall, noSyncDecode as rule } from './no-sync-decode.ts'

const makeSchemaCall = (method: string): object => ({
  callee: {
    computed: false,
    object: { name: 'Schema', type: 'Identifier' },
    property: { name: method, type: 'Identifier' },
    type: 'MemberExpression',
  },
  type: 'CallExpression',
})

describe('synchronous or promise-based schema decoder detection', () => {
  test.each(['decodeSync', 'decodePromise', 'decodeUnknownSync', 'decodeUnknownPromise'])(
    '%s returns method name',
    (method) => {
      expect(isSchemaBannedDecodeCall(makeSchemaCall(method))).toBe(method)
    },
  )

  test('allows decodeEffect', () => {
    expect(isSchemaBannedDecodeCall(makeSchemaCall('decodeEffect'))).toBeUndefined()
  })

  test('allows decodeExit', () => {
    expect(isSchemaBannedDecodeCall(makeSchemaCall('decodeExit'))).toBeUndefined()
  })

  test('allows other namespaces', () => {
    expect(
      isSchemaBannedDecodeCall({
        callee: {
          computed: false,
          object: { name: 'Other', type: 'Identifier' },
          property: { name: 'decodeSync', type: 'Identifier' },
          type: 'MemberExpression',
        },
        type: 'CallExpression',
      }),
    ).toBeUndefined()
  })

  test('ignores expressions other than calls', () => {
    expect(isSchemaBannedDecodeCall({ name: 'decodeSync', type: 'Identifier' })).toBeUndefined()
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('no-sync-decode', rule, {
  invalid: [
    { code: 'Schema.decodeSync(schema)(input)', errors: 1, name: 'decodeSync is reported' },
    { code: 'Schema.decodePromise(schema)(input)', errors: 1, name: 'decodePromise is reported' },
    { code: 'Schema.decodeUnknownSync(schema)(input)', errors: 1, name: 'decodeUnknownSync is reported' },
    { code: 'Schema.decodeUnknownPromise(schema)(input)', errors: 1, name: 'decodeUnknownPromise is reported' },
  ],
  valid: [
    { code: 'Schema.decodeEffect(schema)(input)', name: 'decodeEffect is allowed' },
    { code: 'Schema.decodeUnknownEffect(schema)(input)', name: 'decodeUnknownEffect is allowed' },
    { code: 'Schema.decodeExit(schema)(input)', name: 'decodeExit is allowed' },
    { code: 'Other.decodeSync(schema)(input)', name: 'unrelated namespace decodeSync is ignored' },
  ],
})
