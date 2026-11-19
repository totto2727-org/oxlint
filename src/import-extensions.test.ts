import { describe, expect, test } from 'vite-plus/test'

import { normalizeImportExtension } from './import-extensions.ts'

const stressLength = 100_000

describe('import extension normalization', () => {
  test.each([
    ['initial slashes', `${'/'.repeat(stressLength)}a`],
    ['slashes after an alias', `#${'/'.repeat(stressLength)}a`],
    ['dots without a slash', '.'.repeat(stressLength)],
  ])('ignores a long specifier with %s', (_name, specifier) => {
    expect(normalizeImportExtension(specifier, 'ts')).toBeUndefined()
  })
})
