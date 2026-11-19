import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isLetDeclaration, noLet as rule } from './no-let.ts'

describe('let declaration detection', () => {
  test('let declaration returns true', () => {
    expect(isLetDeclaration({ kind: 'let', type: 'VariableDeclaration' })).toBe(true)
  })

  test('const declaration returns false', () => {
    expect(isLetDeclaration({ kind: 'const', type: 'VariableDeclaration' })).toBe(false)
  })

  test('var declaration returns false', () => {
    expect(isLetDeclaration({ kind: 'var', type: 'VariableDeclaration' })).toBe(false)
  })

  test('non-object returns false', () => {
    expect(isLetDeclaration(JSON.parse('null'))).toBe(false)
    expect(isLetDeclaration('let')).toBe(false)
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('no-let', rule, {
  invalid: [
    { code: 'let x = 1', errors: 1, name: 'let declaration is reported' },
    { code: 'let x = 1, y = 2', errors: 1, name: 'multi-declarator let is reported once per declaration' },
  ],
  valid: [
    { code: 'const x = 1', name: 'const declaration is allowed' },
    { code: 'var x = 1', name: 'var declaration is not reported by this rule' },
  ],
})
