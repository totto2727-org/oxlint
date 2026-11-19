import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { classifyLengthComparison, forceArrayEmpty as rule } from './force-array-empty.ts'

describe('length comparison classification', () => {
  test.each(
    (
      [
        ['===', 0, '===', 'empty'],
        ['!==', 0, '!==', 'non-empty'],
        ['==', 0, '==', 'empty'],
        ['!=', 0, '!=', 'non-empty'],
        ['>', 0, '<', 'non-empty'],
        ['<', 0, '>', undefined],
        ['>=', 0, '<=', undefined],
        ['<=', 0, '>=', 'empty'],
        ['===', 1, '===', undefined],
        ['!==', 1, '!==', undefined],
        ['<', 1, '>', 'empty'],
        ['>=', 1, '<=', 'non-empty'],
        ['>', 1, '<', undefined],
        ['<=', 1, '>=', undefined],
        ['===', 2, '===', undefined],
        ['>', 2, '<', undefined],
      ] as const
    ).map(([operator, literal, reversed, expected]) => ({ expected, literal, operator, reversed })),
  )('classifies length $operator $literal and its reversed comparison', ({ expected, literal, operator, reversed }) => {
    expect(classifyLengthComparison(operator, 'right', literal)).toBe(expected)
    expect(classifyLengthComparison(reversed, 'left', literal)).toBe(expected)
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('force-array-empty', rule, {
  invalid: [
    { code: 'if (arr.length === 0) {}', errors: 1, name: 'length === 0 reports empty' },
    { code: 'if (arr.length !== 0) {}', errors: 1, name: 'length !== 0 reports non-empty' },
    { code: 'if (arr.length > 0) {}', errors: 1, name: 'length > 0 reports non-empty' },
    { code: 'if (0 < arr.length) {}', errors: 1, name: '0 < length reports non-empty' },
    { code: 'if (arr.length < 1) {}', errors: 1, name: 'length < 1 reports empty' },
    { code: 'if (arr.length >= 1) {}', errors: 1, name: 'length >= 1 reports non-empty' },
  ],
  valid: [
    { code: 'if (arr.length === 5) {}', name: 'comparison with arbitrary literal is ignored' },
    { code: 'if (arr.length > 5) {}', name: 'comparison with non-empty-check literal is ignored' },
    { code: 'if (Array.isEmpty(arr)) {}', name: 'recommended Array.isEmpty call' },
    { code: 'if (arr.size === 0) {}', name: 'unrelated .size member is ignored' },
  ],
})
