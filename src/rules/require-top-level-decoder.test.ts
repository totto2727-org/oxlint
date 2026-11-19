import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isHoistableDecoderCall, requireTopLevelDecoder as rule } from './require-top-level-decoder.ts'

const makeCall = (namespace: string, method: string): object => ({
  callee: {
    computed: false,
    object: { name: namespace, type: 'Identifier' },
    property: { name: method, type: 'Identifier' },
    type: 'MemberExpression',
  },
  type: 'CallExpression',
})

describe('hoistable decoder detection', () => {
  describe('schema decoder variants', () => {
    test.each(['decode', 'decodeEffect', 'decodeSync', 'decodeUnknownEffect', 'decodeUnknownSync'])(
      'recognizes Schema.%s',
      (method) => {
        expect(isHoistableDecoderCall(makeCall('Schema', method))).toBe(true)
      },
    )
  })

  describe('http client response decoder variants', () => {
    test.each(['schemaJson', 'schemaBodyJson', 'schema'])('recognizes HttpClientResponse.%s', (method) => {
      expect(isHoistableDecoderCall(makeCall('HttpClientResponse', method))).toBe(true)
    })
  })

  test('ignores Schema.parse', () => {
    expect(isHoistableDecoderCall(makeCall('Schema', 'parse'))).toBe(false)
  })

  test('ignores other namespaces', () => {
    expect(isHoistableDecoderCall(makeCall('Other', 'decode'))).toBe(false)
  })

  test('non-CallExpression returns false', () => {
    expect(isHoistableDecoderCall({ name: 'decode', type: 'Identifier' })).toBe(false)
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('require-top-level-decoder', rule, {
  invalid: [
    {
      code: 'const f = () => Schema.decodeEffect(schema)(input)',
      errors: 1,
      name: 'decode call inside arrow function is reported',
    },
    {
      code: 'function f() { return Schema.decode(schema)(input) }',
      errors: 1,
      name: 'decode call inside function declaration is reported',
    },
    {
      code: 'const f = () => HttpClientResponse.schemaJson(schema)',
      errors: 1,
      name: 'HttpClientResponse.schema* call inside function is reported',
    },
  ],
  valid: [
    {
      code: 'const decoder = Schema.decodeEffect(schema)',
      name: 'top-level decoder construction is allowed',
    },
    {
      code: 'const decoder = Schema.decode(schema); const f = () => decoder(input)',
      name: 'hoisted decoder reused inside function is allowed',
    },
    {
      code: 'const f = () => helper(input)',
      name: 'unrelated function body is allowed',
    },
  ],
})
