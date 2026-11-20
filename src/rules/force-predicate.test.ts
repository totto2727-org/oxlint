import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { getNullishSide, getStringValue, getTypeofType, forcePredicate as rule } from './force-predicate.ts'

describe('nullish operand classification', () => {
  test('null literal returns "null"', () => {
    // oxlint-disable-next-line unicorn/no-null -- ESTree uses null for the value of a null literal.
    expect(getNullishSide({ type: 'Literal', value: null })).toBe('null')
  })

  test('undefined identifier returns "undefined"', () => {
    expect(getNullishSide({ name: 'undefined', type: 'Identifier' })).toBe('undefined')
  })

  test('rejects numeric literals as nullish operands', () => {
    expect(getNullishSide({ type: 'Literal', value: 42 })).toBeUndefined()
  })

  test('rejects other identifiers as nullish operands', () => {
    expect(getNullishSide({ name: 'foo', type: 'Identifier' })).toBeUndefined()
  })

  test('rejects non-object operands', () => {
    // oxlint-disable-next-line unicorn/no-null -- Verify that a primitive null does not look like an ESTree node.
    expect(getNullishSide(null)).toBeUndefined()
    expect(getNullishSide('null')).toBeUndefined()
  })
})

describe('typeof operand recognition', () => {
  test('typeof UnaryExpression returns "typeof"', () => {
    expect(getTypeofType({ argument: {}, operator: 'typeof', type: 'UnaryExpression' })).toBe('typeof')
  })

  test('rejects unary expressions with another operator', () => {
    expect(getTypeofType({ argument: {}, operator: '!', type: 'UnaryExpression' })).toBeUndefined()
  })

  test('rejects other AST node types', () => {
    expect(getTypeofType({ type: 'Literal', value: 42 })).toBeUndefined()
  })
})

describe('string operand extraction', () => {
  test('string literal returns its value', () => {
    expect(getStringValue({ type: 'Literal', value: 'hello' })).toBe('hello')
  })

  test('empty string literal returns empty string', () => {
    expect(getStringValue({ type: 'Literal', value: '' })).toBe('')
  })

  test('does not extract a string from a number literal', () => {
    expect(getStringValue({ type: 'Literal', value: 42 })).toBeUndefined()
  })

  test('does not extract a string from an identifier', () => {
    expect(getStringValue({ name: 'foo', type: 'Identifier' })).toBeUndefined()
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('force-predicate', rule, {
  invalid: [
    { code: 'if (x === null) {}', errors: 1, name: '=== null reports Predicate.isNull' },
    { code: 'if (null === x) {}', errors: 1, name: 'null === x reports Predicate.isNull' },
    { code: 'if (x !== undefined) {}', errors: 1, name: '!== undefined reports Predicate.isUndefined' },
    { code: "if (typeof x === 'string') {}", errors: 1, name: "typeof === 'string' reports Predicate.isString" },
    { code: "if (typeof x === 'object') {}", errors: 1, name: "typeof === 'object' reports Predicate.isObject" },
    { code: "if (typeof x === 'function') {}", errors: 1, name: "typeof === 'function' reports Predicate.isFunction" },
  ],
  valid: [
    { code: 'if (Predicate.isNull(x)) {}', name: 'recommended Predicate.isNull call' },
    { code: 'if (Predicate.isString(x)) {}', name: 'recommended Predicate.isString call' },
    { code: 'if (x === 1) {}', name: 'unrelated numeric comparison is ignored' },
    { code: "if (typeof x === 'unknownType') {}", name: 'unknown typeof string is ignored' },
  ],
})
