import { describe, expect, test } from 'vite-plus/test'

import effect from './effect.ts'
import plugin, { compatibilityRuleNames, effectRuleNames, typescriptRuleNames } from './index.ts'
import preset from './preset.ts'
import typescript from './typescript.ts'

const keys = (names: readonly string[]) => names.map((name) => `rules/${name}`).sort()
const customKeys = (config: { rules?: unknown }) =>
  Object.entries(config.rules ?? {})
    .filter(([name, setting]) => name.startsWith('rules/') && setting !== 'off')
    .map(([name]) => name)
    .sort()

describe('public plugin and grouped presets', () => {
  test('every rule belongs to one group or the compatibility surface', () => {
    const names = [...typescriptRuleNames, ...effectRuleNames, ...compatibilityRuleNames]
    expect(new Set(names).size).toBe(34)
    expect(Object.keys(plugin.rules).sort()).toEqual([...names].sort())
  })
  test('TypeScript preset does not enable Effect custom policy', () => {
    expect(customKeys(typescript)).toEqual(keys(typescriptRuleNames))
  })
  test('Effect preset adds only Effect custom policy to the native baseline', () => {
    expect(customKeys(effect)).toEqual(keys(effectRuleNames))
  })
  test('Effect preset checks official module imports rather than opposing legacy imports', () => {
    expect(effect.rules?.['rules/no-import-from-barrel-package']).toEqual([
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
    expect(effect.rules).not.toHaveProperty('rules/no-effect-import-as')
    expect(effect.rules).not.toHaveProperty('rules/no-effect-subpath-import')
    expect(preset.rules).not.toHaveProperty('rules/no-js-extension-imports')
  })
  test('combined preset enables both groups without duplicate extension diagnostics', () => {
    expect(customKeys(preset)).toEqual(keys([...typescriptRuleNames, ...effectRuleNames]))
    for (const name of compatibilityRuleNames) {
      expect(preset.rules).not.toHaveProperty(`rules/${name}`)
    }
    expect(preset.rules).toHaveProperty('rules/no-import-from-barrel-package')
  })
  test('all presets resolve the built public plugin', () => {
    expect(preset.jsPlugins).toEqual(typescript.jsPlugins)
    expect(effect.jsPlugins).toEqual(typescript.jsPlugins)
    expect(preset.jsPlugins?.[0]).toMatch(/index\.js$/)
  })
  test('presets do not include consumer-specific file exemptions', () => {
    for (const config of [typescript, effect, preset]) {
      expect(config.overrides).toBeUndefined()
    }
  })
  test('every group enables the same native categories and general-purpose plugins', () => {
    for (const config of [typescript, effect, preset]) {
      expect(config.categories).toEqual({
        correctness: 'error',
        nursery: 'error',
        pedantic: 'error',
        perf: 'error',
        restriction: 'error',
        style: 'error',
        suspicious: 'error',
      })
      expect(config.plugins).toEqual(['eslint', 'import', 'jsdoc', 'node', 'oxc', 'promise', 'typescript', 'unicorn'])
      expect(config.options?.typeAware).toBe(true)
    }
  })

  test('custom policies suppress their competing native rule only in the relevant preset', () => {
    for (const rule of ['import/extensions', 'eslint/prefer-const']) {
      expect(typescript.rules?.[rule]).toBe('off')
      expect(preset.rules?.[rule]).toBe('off')
      expect(effect.rules).not.toHaveProperty(rule)
    }
    for (const rule of [
      'eslint/preserve-caught-error',
      'import/no-nodejs-modules',
      'unicorn/explicit-length-check',
      'unicorn/no-typeof-undefined',
      'unicorn/prefer-bigint-literals',
      'unicorn/prefer-date-now',
    ]) {
      expect(effect.rules?.[rule]).toBe('off')
      expect(preset.rules?.[rule]).toBe('off')
      expect(typescript.rules).not.toHaveProperty(rule)
    }
  })

  test('the namespace import exception is limited to Effect module specifiers', () => {
    const setting = ['error', { ignore: ['effect/**', '@effect/**'] }]
    expect(effect.rules?.['import/no-namespace']).toEqual(setting)
    expect(preset.rules?.['import/no-namespace']).toEqual(setting)
    expect(typescript.rules).not.toHaveProperty('import/no-namespace')
  })
})
