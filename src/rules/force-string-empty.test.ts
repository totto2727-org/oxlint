import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isEmptyStringLiteral, forceStringEmpty as rule } from './force-string-empty.ts'

describe('recognition of empty string literals', () => {
  test('empty string literal returns true', () => {
    expect(isEmptyStringLiteral({ type: 'Literal', value: '' })).toBe(true)
  })

  test('non-empty string literal returns false', () => {
    expect(isEmptyStringLiteral({ type: 'Literal', value: 'hello' })).toBe(false)
  })

  test('number literal returns false', () => {
    expect(isEmptyStringLiteral({ type: 'Literal', value: 0 })).toBe(false)
  })

  test('null literal returns false', () => {
    // oxlint-disable-next-line unicorn/no-null -- ESTree uses null for the value of a null literal.
    expect(isEmptyStringLiteral({ type: 'Literal', value: null })).toBe(false)
  })

  test('non-literal node returns false', () => {
    expect(isEmptyStringLiteral({ name: '', type: 'Identifier' })).toBe(false)
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('force-string-empty', rule, {
  invalid: [
    { code: "if (s === '') {}", errors: 1, name: "=== '' reports String.isEmpty" },
    { code: "if ('' === s) {}", errors: 1, name: "'' === s reports String.isEmpty" },
    { code: "if (s !== '') {}", errors: 1, name: "!== '' reports String.isNonEmpty" },
  ],
  valid: [
    { code: 'if (String.isEmpty(s)) {}', name: 'recommended String.isEmpty call' },
    { code: "if (s === 'hello') {}", name: 'comparison with non-empty literal is ignored' },
    { code: 'if (s === 0) {}', name: 'numeric comparison is ignored' },
  ],
})
