import { describe, expect, test } from 'vite-plus/test'

import plugin, { compatibilityRuleNames, presetRuleNames } from './index.ts'
import preset from './preset.ts'

const keys = (names: readonly string[]) => names.map((name) => `rules/${name}`).sort()

const customKeys = () =>
  Object.entries(preset.rules ?? {})
    .filter(([name, setting]) => name.startsWith('rules/') && setting !== 'off')
    .map(([name]) => name)
    .sort()

describe('public plugin and standard preset', () => {
  test('all plugin rules are either enabled by default or opt-in compatibility rules', () => {
    const names = [...presetRuleNames, ...compatibilityRuleNames]
    expect(new Set(names).size).toBe(names.length)
    expect(Object.keys(plugin.rules).sort()).toEqual(names.sort())
    expect(customKeys()).toEqual(keys(presetRuleNames))
    for (const name of compatibilityRuleNames) {
      expect([undefined, 'off']).toContain(preset.rules?.[`rules/${name}`])
    }
  })

  test('permits public barrel imports and namespace imports', () => {
    expect(preset.rules?.['rules/no-import-from-barrel-package']).toBe('off')
    expect(preset.rules?.['import/no-namespace']).toBe('off')
  })

  test('resolves the built public plugin without consumer-specific file exemptions', () => {
    expect(preset.jsPlugins?.[0]).toMatch(/index\.js$/)
    expect(preset.overrides).toBeUndefined()
  })

  test('enables all native categories and the standard plugins without other stacks', () => {
    expect(preset.categories).toEqual({
      correctness: 'error',
      nursery: 'error',
      pedantic: 'error',
      perf: 'error',
      restriction: 'error',
      style: 'error',
      suspicious: 'error',
    })
    expect(preset.plugins).toEqual([
      'eslint',
      'import',
      'jsdoc',
      'jsx-a11y',
      'node',
      'oxc',
      'promise',
      'react',
      'react-perf',
      'typescript',
      'unicorn',
      'vitest',
    ])
    expect(preset.options?.typeAware).toBe(true)
  })

  test('gives custom policies priority over competing native rules', () => {
    expect(preset.rules?.['sort-imports']).toEqual(['error', { ignoreCase: true, ignoreDeclarationSort: true }])
    for (const rule of [
      'eslint/prefer-const',
      'import/extensions',
      'import/no-nodejs-modules',
      'unicorn/explicit-length-check',
      'unicorn/no-typeof-undefined',
      'unicorn/prefer-bigint-literals',
      'unicorn/prefer-date-now',
    ]) {
      expect(preset.rules?.[rule]).toBe('off')
    }
  })

  test('requires local reasons for intentional runtime, platform, and rendering exceptions', () => {
    expect(preset.rules?.['rules/require-disable-reason']).toBe('error')
    expect(preset.rules?.['rules/no-effect-runtime-run']).toBe('error')
    expect(preset.rules?.['rules/no-fetch']).toBe('error')
    expect(preset.rules?.['rules/no-jsx-script-tag']).toBe('error')
    expect(preset.rules?.['rules/no-node-imports']).toBe('error')
  })

  test('preserves the original failure when rethrowing a native error', () => {
    expect(preset.rules?.['eslint/preserve-caught-error']).toBe('error')
    expect(preset.rules?.['rules/no-error-cause-option']).toBe('off')
  })

  test('disallows direct tag access without changing tag declarations', () => {
    expect(preset.rules?.['no-underscore-dangle']).toBeUndefined()
    expect(preset.rules?.['no-restricted-properties']).toEqual([
      'error',
      { property: '_tag', message: 'Use a public predicate or matcher instead of accessing `_tag` directly.' },
    ])
    expect(preset.rules?.['rules/no-option-tag-comparison']).toBe('error')
  })

  test('supports automatic JSX and explicit Vitest APIs without conflicting hook policies', () => {
    expect(preset.rules?.['react/jsx-filename-extension']).toEqual(['error', { extensions: ['jsx', 'tsx'] }])
    expect(preset.rules?.['react/jsx-no-literals']).toBe('off')
    expect(preset.rules?.['react/react-in-jsx-scope']).toBe('off')
    expect(preset.rules?.['vitest/no-importing-vitest-globals']).toBe('off')
    expect(preset.rules?.['vitest/prefer-called-times']).toBe('off')
    expect(preset.rules?.['vitest/require-hook']).toBe('off')
    expect(preset.rules?.['vitest/no-hooks']).not.toBe('off')
    expect(preset.rules?.['eslint/require-await']).toBe('off')
    expect(preset.rules?.['typescript/require-await']).not.toBe('off')
  })

  test('recognizes Effect tests without requiring boilerplate assertion counts and timeouts', () => {
    expect(preset.rules?.['vitest/no-standalone-expect']).toEqual([
      'error',
      {
        additionalTestBlockFunctions: expect.arrayContaining([
          'effect',
          'live',
          'prop',
          'it.effect',
          'it.live',
          'it.prop',
          'effect.only',
          'effect.skip',
          'effect.fails',
          'it.effect.each',
          'it.live.skipIf',
          'it.live.runIf',
          'it.live.prop',
        ]),
      },
    ])
    expect(preset.rules?.['vitest/prefer-expect-assertions']).toEqual([
      'error',
      { onlyFunctionsWithExpectInCallback: true },
    ])
    expect(preset.rules?.['vitest/require-test-timeout']).toBe('off')
  })

  test('preserves assertions that require an exact boolean', () => {
    expect(preset.rules?.['vitest/prefer-to-be-falsy']).toBe('off')
    expect(preset.rules?.['vitest/prefer-to-be-truthy']).toBe('off')
  })

  test('does not require deeply readonly parameter types', () => {
    expect(preset.rules?.['typescript/prefer-readonly-parameter-types']).toBe('off')
  })
})
