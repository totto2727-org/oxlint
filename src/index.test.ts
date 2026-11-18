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
    expect(new Set(names).size).toBe(34)
    expect(Object.keys(plugin.rules).sort()).toEqual(names.sort())
    expect(customKeys()).toEqual(keys(presetRuleNames))
    for (const name of compatibilityRuleNames) {
      expect(preset.rules).not.toHaveProperty(`rules/${name}`)
    }
  })

  test('enforces official Effect module imports with a narrow namespace exception', () => {
    expect(preset.rules?.['rules/no-import-from-barrel-package']).toEqual([
      'error',
      {
        checkPatterns: [
          '^effect$',
          '^effect/(.+/)?[a-z][a-z0-9]*$',
          '^@effect/[^/]+$',
          '^@effect/[^/]+/(.+/)?[a-z][a-z0-9]*$',
        ],
        checkRelativeIndexImports: true,
      },
    ])
    expect(preset.rules?.['import/no-namespace']).toEqual(['error', { ignore: ['effect/**', '@effect/**'] }])
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
      'eslint/preserve-caught-error',
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
    expect(preset.rules?.['rules/no-node-imports']).toEqual([
      'error',
      { allow: ['child_process', 'crypto', 'os', 'util'] },
    ])
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
      { additionalTestBlockFunctions: ['it.effect'] },
    ])
    expect(preset.rules?.['vitest/prefer-expect-assertions']).toEqual([
      'error',
      { onlyFunctionsWithExpectInCallback: true },
    ])
    expect(preset.rules?.['vitest/require-test-timeout']).toBe('off')
  })
})
