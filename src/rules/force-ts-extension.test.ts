import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule, { matchJsImport } from './force-ts-extension.ts'

describe('matchJsImport', () => {
  describe('matches', () => {
    test('relative path with single dot', () => {
      expect(matchJsImport('./foo.js')).toEqual({ path: '/foo', start: '.', x: '' })
    })

    test('relative path with double dot and jsx', () => {
      expect(matchJsImport('../bar.jsx')).toEqual({ path: '/bar', start: '..', x: 'x' })
    })

    test('subpath import with single hash', () => {
      expect(matchJsImport('#/qux.jsx')).toEqual({ path: '/qux', start: '#', x: 'x' })
    })

    test('subpath import with hash alias', () => {
      expect(matchJsImport('#@/baz.js')).toEqual({ path: '/baz', start: '#@', x: '' })
    })

    test('nested relative path', () => {
      expect(matchJsImport('./reexport.js')).toEqual({ path: '/reexport', start: '.', x: '' })
    })
  })

  describe('does not match', () => {
    test('bare package name', () => {
      expect(matchJsImport('package-name')).toBeNull()
    })

    test('package name with .js but no slash', () => {
      expect(matchJsImport('package.js')).toBeNull()
    })

    test('double-hash subpath import', () => {
      expect(matchJsImport('##storybook/utils')).toBeNull()
    })

    test('relative ts file', () => {
      expect(matchJsImport('./ok.ts')).toBeNull()
    })

    test('relative tsx file', () => {
      expect(matchJsImport('../ok.tsx')).toBeNull()
    })

    test('absolute path starting with slash', () => {
      expect(matchJsImport('/foo.js')).toBeNull()
    })
  })

  describe('terminates quickly on adversarial input', () => {
    test('many leading slashes (no js suffix)', () => {
      const malicious = `${'/'.repeat(100_000)}a`
      const start = performance.now()
      const result = matchJsImport(malicious)
      const elapsed = performance.now() - start
      expect(result).toBeNull()
      expect(elapsed).toBeLessThan(100)
    })

    test('many slashes after hash prefix', () => {
      const malicious = `#${'/'.repeat(100_000)}a`
      const start = performance.now()
      const result = matchJsImport(malicious)
      const elapsed = performance.now() - start
      expect(result).toBeNull()
      expect(elapsed).toBeLessThan(100)
    })

    test('many dots without slash', () => {
      const malicious = '.'.repeat(100_000)
      const start = performance.now()
      const result = matchJsImport(malicious)
      const elapsed = performance.now() - start
      expect(result).toBeNull()
      expect(elapsed).toBeLessThan(100)
    })
  })
})

runRuleTest('force-ts-extension', rule, {
  invalid: [
    ...[
      ['mjs', 'mts'],
      ['cjs', 'cts'],
    ].flatMap(([javascript, typescript]) => [
      {
        code: `import './foo.${javascript}'`,
        errors: 1,
        output: `import './foo.${typescript}'`,
      },
      {
        code: `import('#@/foo.${typescript}?raw#part')`,
        errors: 1,
        options: [{ mode: 'js' }],
        output: `import('#@/foo.${javascript}?raw#part')`,
      },
    ]),
    { code: "import './foo.js'", options: [{}], errors: 1, output: "import './foo.ts'" },
    { code: "import './foo.jsx'", options: [{ mode: 'ts' }], errors: 1, output: "import './foo.tsx'" },
    ...['jsx', 'ts', 'tsx'].map((extension) => ({
      code: `import './foo.${extension}?raw#part'`,
      errors: 1,
      options: [{ mode: 'js' }],
      output: "import './foo.js?raw#part'",
    })),
    { code: "export * from '#@/foo.tsx'", options: [{ mode: 'js' }], errors: 1, output: "export * from '#@/foo.js'" },
    { code: "import('./foo.ts')", options: [{ mode: 'js' }], errors: 1, output: "import('./foo.js')" },
    { code: "import './foo'", options: [{ mode: 'js' }], errors: 1, output: null },
    { code: "import './foo/'", options: [{ mode: 'js' }], errors: 1, output: null },
    {
      code: "import './foo'",
      errors: 1,
      output: null,
      name: 'missing extension is reported without guessing resolution',
    },
    {
      code: "export * from './foo/'",
      errors: 1,
      output: null,
      name: 'directory import needs explicit filename and extension',
    },
    { code: "import './'", errors: 1, output: null },
    { code: "import '#@/foo?raw'", errors: 1, output: null },
    { code: "import('./foo.jsx?raw#part')", errors: 1, output: "import('./foo.tsx?raw#part')" },
    { code: "export * from './foo.js#part'", errors: 1, output: "export * from './foo.ts#part'" },
    {
      code: "import { foo } from './foo.js'",
      errors: 1,
      name: '.js import is reported and fixed to .ts',
      output: "import { foo } from './foo.ts'",
    },
    {
      code: "import { foo } from '../bar.jsx'",
      errors: 1,
      name: '.jsx import is reported and fixed to .tsx',
      output: "import { foo } from '../bar.tsx'",
    },
    {
      code: "export { foo } from './foo.js'",
      errors: 1,
      name: 're-export with .js is reported and fixed',
      output: "export { foo } from './foo.ts'",
    },
    {
      code: "import { baz } from '#@/baz.js'",
      errors: 1,
      name: 'subpath import with .js is reported and fixed',
      output: "import { baz } from '#@/baz.ts'",
    },
  ],
  valid: [
    "import './module.mts'",
    "export * from './module.cts?raw'",
    { code: "import('./module.mjs#part')", options: [{ mode: 'js' }] },
    { code: "import '#@/module.cjs'", options: [{ mode: 'js' }] },
    { code: "import './foo.js?raw#part'", options: [{ mode: 'js' }] },
    { code: "import './asset.svg'", options: [{ mode: 'js' }] },
    "import './foo.tsx'",
    "import './asset.svg?raw#part'",
    'import(variable)',
    { code: "import { foo } from './foo.ts'", name: '.ts import is allowed' },
    { code: "import { foo } from 'package-name'", name: 'bare package import is ignored' },
    { code: "import { foo } from 'package.js'", name: 'package name ending in .js is ignored' },
    { code: "import { foo } from '##storybook/utils'", name: 'double-hash subpath import is ignored' },
  ],
})
