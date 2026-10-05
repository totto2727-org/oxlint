import { describe, expect, test } from 'vite-plus/test'

import effect from './effect.ts'
import plugin, { compatibilityRuleNames, effectRuleNames, typescriptRuleNames } from './index.ts'
import preset from './preset.ts'
import typescript from './typescript.ts'
import ultraciteCore from './upstream/ultracite/core.ts'

const keys = (names: readonly string[]) => names.map((name) => `rules/${name}`).sort()
const customKeys = (config: { rules?: unknown }) =>
  Object.keys(config.rules ?? {})
    .filter((name) => name.startsWith('rules/'))
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
  test('test files do not receive relaxed custom rules', () => {
    for (const config of [typescript, effect, preset]) {
      expect(config.overrides?.some((override) => override.files.some((pattern) => /test|spec/.test(pattern)))).toBe(
        false,
      )
    }
  })
  test('all groups include Ultracite native rules without conflicting bigint autofixes', () => {
    for (const config of [typescript, effect, preset]) {
      expect(config.rules?.['no-debugger']).toBe('error')
      expect(config.rules?.['no-empty-function']).toBe('error')
      expect(config.rules?.['unicorn/prefer-bigint-literals']).toBe('off')
      expect(config.rules?.['preserve-caught-error']).toBe('off')
      expect(config.rules?.['prefer-const']).toBe('off')
      expect(config.plugins).toContain('unicorn')
    }
    expect(typescript.rules).not.toHaveProperty('rules/no-bigint-literals')
    expect(effect.rules?.['rules/no-bigint-literals']).toBe('error')
  })
  test('all native core settings are retained except the three documented adjustments', () => {
    const adjusted = new Set(['unicorn/prefer-bigint-literals', 'preserve-caught-error', 'prefer-const'])
    expect(Object.keys(ultraciteCore.rules ?? {})).toHaveLength(537)
    for (const config of [typescript, effect, preset]) {
      expect(config.env).toEqual(ultraciteCore.env)
      expect(config.plugins).toEqual(ultraciteCore.plugins)
      expect(config.ignorePatterns).toEqual(ultraciteCore.ignorePatterns)
      for (const [name, setting] of Object.entries(ultraciteCore.rules ?? {})) {
        expect(config.rules?.[name]).toEqual(adjusted.has(name) ? 'off' : setting)
      }
      expect(config.overrides?.some((override) => override.files.includes('**/*.astro'))).toBe(false)
    }
  })
})
