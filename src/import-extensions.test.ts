import { expect, test } from 'vite-plus/test'

import { normalizeImportExtension } from './import-extensions.ts'

test.each([
  ['initial slashes', `${'/'.repeat(100_000)}a`],
  ['slashes after an alias', `#${'/'.repeat(100_000)}a`],
  ['dots without a slash', '.'.repeat(100_000)],
])('ignores a long specifier with %s', (_name, specifier) => {
  expect(normalizeImportExtension(specifier, 'ts')).toBeNull()
})
