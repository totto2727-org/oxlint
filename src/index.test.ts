import { describe, expect, test } from 'vite-plus/test'

import effect from './effect.ts'
import plugin, { compatibilityRuleNames, effectRuleNames, typescriptRuleNames } from './index.ts'
import preset from './preset.ts'
import typescript from './typescript.ts'

const keys = (names: readonly string[]) => names.map((name) => `rules/${name}`).sort()

describe('public plugin and grouped presets', () => {
  test('every rule belongs to one group or the compatibility surface', () => {
    const names = [...typescriptRuleNames, ...effectRuleNames, ...compatibilityRuleNames]
    expect(new Set(names).size).toBe(29)
    expect(Object.keys(plugin.rules).sort()).toEqual([...names].sort())
  })
  test('TypeScript preset does not enable Effect policy', () => {
    expect(Object.keys(typescript.rules ?? {}).sort()).toEqual(keys(typescriptRuleNames))
  })
  test('Effect preset does not enable generic policy', () => {
    expect(Object.keys(effect.rules ?? {}).sort()).toEqual(keys(effectRuleNames))
  })
  test('combined preset enables both groups without duplicate extension diagnostics', () => {
    expect(Object.keys(preset.rules ?? {}).sort()).toEqual(keys([...typescriptRuleNames, ...effectRuleNames]))
    expect(preset.rules).not.toHaveProperty('rules/force-ts-extension')
  })
  test('all presets resolve the built public plugin', () => {
    expect(preset.jsPlugins).toEqual(typescript.jsPlugins)
    expect(effect.jsPlugins).toEqual(typescript.jsPlugins)
    expect(preset.jsPlugins?.[0]).toMatch(/index\.js$/)
  })
})
