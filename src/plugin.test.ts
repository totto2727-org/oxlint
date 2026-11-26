import { Array, Predicate } from 'effect'
import type { OxlintConfig } from 'oxlint'
import { describe, expect, test } from 'vite-plus/test'

import applicationPreset from './application.ts'
import libraryPreset from './library.ts'
import plugin, { compatibilityRuleNames, presetRuleNames } from './plugin.ts'
import preset from './preset.ts'

const checkedPreset: OxlintConfig = preset
const vitest = checkedPreset.overrides?.[0]
const vitestRules = vitest?.rules
const productionRules = checkedPreset.rules ?? {}

const getStandaloneExpect = (): { functions: unknown; severity: unknown } => {
  const setting = vitestRules?.['vitest/no-standalone-expect']
  if (!Array.isArray(setting)) {
    return { functions: undefined, severity: setting }
  }
  const [severity, options] = setting
  return { functions: Predicate.isObject(options) ? options['additionalTestBlockFunctions'] : undefined, severity }
}

const customKeys = (): string[] =>
  Object.entries({ ...productionRules, ...vitestRules })
    .filter(([name, setting]) => name.startsWith('rules/') && setting !== 'off')
    .map(([name]) => name)
    .toSorted()

describe('public plugin and standard preset', () => {
  test('enables all registered plugin rules by default', () => {
    const names = Array.fromIterable(presetRuleNames)
    expect(new Set(names).size).toBe(names.length)
    expect(Object.keys(plugin.rules).toSorted()).toStrictEqual(names.toSorted())
    expect(customKeys()).toStrictEqual(names.map((name) => `rules/${name}`).toSorted())
    expect(compatibilityRuleNames).toStrictEqual([])
  })

  test('enables all native categories and standard plugins', () => {
    expect(preset.categories).toStrictEqual({
      correctness: 'error',
      nursery: 'error',
      pedantic: 'error',
      perf: 'error',
      restriction: 'error',
      style: 'error',
      suspicious: 'error',
    })
    expect(preset.plugins).toStrictEqual([
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
    ])
    expect(checkedPreset.options?.typeAware).toBe(true)
  })

  test('resolves the distributed plugin and scopes Vitest to test filenames', () => {
    expect(checkedPreset.jsPlugins?.[0]).toMatch(/plugin\.js$/u)
    expect(preset.overrides).toHaveLength(1)
    expect(vitest?.files).toStrictEqual(['**/*.test.ts', '**/*.test.tsx'])
    expect(vitest?.plugins).toStrictEqual(['vitest'])
    expect(Object.keys(productionRules).some((name) => name.startsWith('vitest/'))).toBe(false)
  })
})

describe('shared function style', () => {
  test('uses expressions for functions and requires arrows for React components', () => {
    expect(productionRules['eslint/func-style']).toStrictEqual(['error', 'expression'])
    expect(productionRules['react/function-component-definition']).toStrictEqual([
      'error',
      { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
    ])
  })
})

describe('standard rule policy', () => {
  test.each([
    'eslint/preserve-caught-error',
    'rules/effect-tracing',
    'rules/no-direct-tag-access',
    'rules/no-effect-import-as',
    'rules/no-effect-runtime-run',
    'rules/no-effect-subpath-import',
    'rules/no-fetch',
    'rules/no-for-loops',
    'rules/no-import-from-barrel-package',
    'rules/no-jsx-script-tag',
    'rules/no-let',
    'rules/no-local-export-list',
    'rules/no-node-imports',
    'rules/no-raw-crypto',
    'rules/no-readonly',
    'rules/require-disable-reason',
    'rules/require-tagged-data',
  ])('enables %s', (rule) => {
    expect(productionRules[rule]).toBe('error')
  })
})

describe('rules replaced by the standard policy', () => {
  test.each([
    'eslint/prefer-const',
    'eslint/require-await',
    'import/exports-last',
    'import/extensions',
    'import/group-exports',
    'import/no-namespace',
    'import/no-nodejs-modules',
    'node/no-top-level-await',
    'react/jsx-no-literals',
    'react/react-in-jsx-scope',
    'typescript/prefer-for-of',
    'typescript/prefer-readonly',
    'typescript/prefer-readonly-parameter-types',
    'unicorn/explicit-length-check',
    'unicorn/no-array-for-each',
    'unicorn/no-array-method-this-argument',
    'unicorn/no-typeof-undefined',
    'unicorn/prefer-bigint-literals',
    'unicorn/prefer-date-now',
  ])('disables conflicting rule %s', (rule) => {
    expect(productionRules[rule]).toBe('off')
  })

  test.each(['no-restricted-properties', 'rules/no-option-tag-comparison', 'rules/require-vitest-hooks'])(
    'does not set %s globally',
    (rule) => {
      expect(productionRules[rule]).toBeUndefined()
    },
  )
})

describe('standard rule options', () => {
  test('keeps native options compatible with formatting and Effect', () => {
    expect(productionRules['sort-imports']).toBe('off')
    expect(productionRules['func-names']).toStrictEqual(['error', 'as-needed', { generators: 'never' }])
    expect(productionRules['no-underscore-dangle']).toStrictEqual(['error', { allow: ['_tag'] }])
    expect(productionRules['react/jsx-filename-extension']).toStrictEqual(['error', { extensions: ['jsx', 'tsx'] }])
    expect(productionRules['typescript/require-await']).not.toBe('off')
  })

  test('allows magic numbers only in test files', () => {
    expect(productionRules['no-magic-numbers']).toStrictEqual([
      'error',
      { ignoreArrayIndexes: true, ignoreDefaultValues: true },
    ])
    expect(vitestRules?.['no-magic-numbers']).toBe('off')
  })

  test('shares its rules across application and library variants', () => {
    expect(applicationPreset).toStrictEqual({
      ...preset,
      rules: { ...productionRules, 'rules/effect-tracing': ['error', 'application'] },
    })
    expect(libraryPreset).toStrictEqual({
      ...preset,
      rules: { ...productionRules, 'rules/effect-tracing': ['error', 'library'] },
    })
  })
})

describe('vitest rule policy', () => {
  test.each([
    'vitest/no-hooks',
    'vitest/no-importing-vitest-globals',
    'vitest/prefer-called-times',
    'vitest/prefer-to-be-falsy',
    'vitest/prefer-to-be-truthy',
    'vitest/require-hook',
    'vitest/require-test-timeout',
  ])('disables conflicting test rule %s', (rule) => {
    expect(vitestRules?.[rule]).toBe('off')
  })

  test('uses the custom hook rule and only counts callback assertions', () => {
    expect(vitestRules?.['rules/require-vitest-hooks']).toBe('error')
    expect(vitestRules?.['vitest/prefer-expect-assertions']).toStrictEqual([
      'error',
      { onlyFunctionsWithExpectInCallback: true },
    ])
  })

  test('uses test for Vitest test declarations', () => {
    expect(vitestRules?.['vitest/consistent-test-it']).toStrictEqual(['error', { fn: 'test' }])
  })

  test.each([
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
  ])('recognizes %s as an Effect test block', (name) => {
    const { functions, severity } = getStandaloneExpect()
    expect(severity).toBe('error')
    expect(functions).toContain(name)
  })
})
