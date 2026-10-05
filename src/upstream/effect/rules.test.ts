// Acceptance cases adapted from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { RuleTester } from 'oxlint/plugins-dev'
import { afterAll } from 'vite-plus/test'

import noBigintLiterals from './no-bigint-literals.ts'
import noImportFromBarrelPackage from './no-import-from-barrel-package.ts'
import noJsExtensionImports from './no-js-extension-imports.ts'
import noOpaqueInstanceFields from './no-opaque-instance-fields.ts'
import noUnusedInternal from './no-unused-internal.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const roots: string[] = []
const fixture = (files: Record<string, string>, file: string) => {
  const parent = resolve('tmp')
  mkdirSync(parent, { recursive: true })
  const cwd = mkdtempSync(join(parent, 'effect-rule-'))
  roots.push(cwd)
  for (const [name, code] of Object.entries(files)) {
    const filename = join(cwd, name)
    mkdirSync(dirname(filename), { recursive: true })
    writeFileSync(filename, code)
  }
  const filename = join(cwd, file)
  return { cwd, filename, code: readFileSync(filename, 'utf8') }
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

tester.run('no-bigint-literals', noBigintLiterals, {
  invalid: [
    { code: 'const n = 1n', errors: 1, output: 'const n = BigInt("1")' },
    { code: 'const n = 0xFFn', errors: 1, output: 'const n = BigInt("255")' },
    { code: 'const n = -1n', errors: 1, output: 'const n = -BigInt("1")' },
  ],
  valid: ['const n = BigInt("1")', 'const n = 1', 'const n = "1n"'],
})

const barrelOptions = [
  {
    checkPatterns: [
      '^effect$',
      '^effect/(.+/)?[a-z][a-z0-9]*$',
      '^@effect/[^/]+$',
      '^@effect/[^/]+/(.+/)?[a-z][a-z0-9]*$',
    ],
    checkRelativeIndexImports: true,
  },
]

tester.run('no-import-from-barrel-package', noImportFromBarrelPackage, {
  invalid: [
    { code: "import { Effect } from 'effect'", options: barrelOptions, errors: 1 },
    { code: "import { Effect as E } from 'effect'", options: barrelOptions, errors: 1 },
    { code: "import * as Effect from 'effect'", options: barrelOptions, errors: 1 },
    { code: "import { NodeRuntime } from '@effect/platform-node'", options: barrelOptions, errors: 1 },
    { code: "import { HttpApi } from 'effect/unstable/httpapi'", options: barrelOptions, errors: 1 },
    { code: "import { a } from './index.ts'", errors: 1 },
    { code: "import * as a from '../index'", errors: 1 },
    { code: "import { type A, b } from './index.ts'", errors: 1 },
    {
      ...fixture(
        { 'src/main.ts': "import { a } from './barrel'", 'src/barrel/index.ts': 'export const a = 1' },
        'src/main.ts',
      ),
      errors: 1,
    },
  ],
  valid: [
    { code: "import * as Effect from 'effect/Effect'", options: barrelOptions },
    { code: "import * as NodeRuntime from '@effect/platform-node/NodeRuntime'", options: barrelOptions },
    { code: "import type { Effect } from 'effect'", options: barrelOptions },
    { code: "import { type Effect } from 'effect'", options: barrelOptions },
    { code: "import { Effect } from 'effect'" },
    { code: "import Default from 'effect'", options: barrelOptions },
    { code: "import 'effect'", options: barrelOptions },
    { code: "import { a } from './index.ts'", options: [{ checkRelativeIndexImports: false }] },
    "import { a } from './module.ts'",
    "export { Effect } from 'effect'",
  ],
})

tester.run('no-js-extension-imports', noJsExtensionImports, {
  invalid: [
    { code: "import { a } from './a.js'", errors: 1, output: 'import { a } from "./a.ts"' },
    { code: "import './a.jsx'", errors: 1, output: 'import "./a.tsx"' },
    { code: "export * from '../a.mjs'", errors: 1, output: 'export * from "../a.mts"' },
    { code: "export { a } from './a.cjs'", errors: 1, output: 'export { a } from "./a.cts"' },
  ],
  valid: [
    "import './a.ts'",
    "import './a.tsx'",
    "import './a.mts'",
    "import './a.cts'",
    "import 'package/a.js'",
    "import '#@/a.js'",
    "import './a.js?raw'",
    "import('./a.js')",
    'export const a = 1',
  ],
})

tester.run('no-opaque-instance-fields', noOpaqueInstanceFields, {
  invalid: [
    {
      code: "import { Schema } from 'effect'; class A extends Schema.Opaque<A>()(Schema.String) { value = 1 }",
      errors: 1,
    },
    { code: "import * as S from 'effect/Schema'; class A extends S.Opaque<A>()(S.String) { method() {} }", errors: 1 },
    { code: "import { Opaque as O } from 'effect/Schema'; const A = class extends O()(s) { value = 1 }", errors: 1 },
    {
      code: "import { Schema } from 'effect'; class A extends Schema.Opaque<A>()(Schema.String) { constructor() { super() } }",
      errors: 1,
    },
  ],
  valid: [
    "import { Schema } from 'effect'; class A extends Schema.Opaque<A>()(Schema.String) {}",
    "import { Schema } from 'effect'; class A extends Schema.Opaque<A>()(Schema.String) { static value = 1; static method() {} }",
    "import { Schema } from 'other'; class A extends Schema.Opaque<A>()(Schema.String) { value = 1 }",
    "import type { Schema } from 'effect'; class A extends Schema.Opaque<A>()(Schema.String) { value = 1 }",
    'class A extends Other { value = 1 }',
  ],
})

const internalInterface = '/** @internal */\nexport interface Internal { readonly value: string }\n'
const internalConst = '/** @internal */\nexport const internal = 1\n'

tester.run('no-unused-internal', noUnusedInternal, {
  invalid: [
    {
      ...fixture(
        { 'packages/foo/src/Internal.ts': '/** @internal */\nexport const unused = 1\n' },
        'packages/foo/src/Internal.ts',
      ),
      errors: 1,
    },
    {
      ...fixture(
        {
          'packages/foo/src/Internal.ts': internalInterface,
          'packages/foo/src/Public.ts':
            'import type { Internal } from "./Internal.ts"\nexport interface Public { readonly value: Internal }\n',
        },
        'packages/foo/src/Public.ts',
      ),
      errors: 1,
    },
    {
      ...fixture(
        {
          'packages/foo/src/Internal.ts': internalConst,
          'packages/foo/src/Public.ts': 'export { internal } from "./Internal.ts"\n',
        },
        'packages/foo/src/Public.ts',
      ),
      errors: 1,
    },
    {
      ...fixture(
        {
          'packages/foo/package.json': '{"name":"foo"}',
          'packages/foo/src/Internal.ts': internalInterface,
          'packages/bar/src/Public.ts': 'import type * as I from "foo/Internal"\nexport type Public = I.Internal\n',
        },
        'packages/bar/src/Public.ts',
      ),
      errors: 1,
    },
  ],
  valid: [
    fixture(
      { 'packages/foo/src/Internal.ts': '/** @internal */\nexport const used = 1\nexport const value = used\n' },
      'packages/foo/src/Internal.ts',
    ),
    fixture(
      {
        'packages/foo/src/Internal.ts': internalInterface,
        'packages/foo/src/Consumer.ts': 'import type { Internal } from "./Internal.ts"\ntype Local = Internal\n',
      },
      'packages/foo/src/Internal.ts',
    ),
    fixture(
      {
        'packages/foo/src/Internal.ts': internalInterface,
        'packages/foo/src/Public.ts':
          'import type { Internal } from "./Internal.ts"\nexport class Public {\n/** @internal */\ngetInternal(): Internal { throw new Error() } }\n',
      },
      'packages/foo/src/Public.ts',
    ),
    fixture(
      {
        'packages/foo/src/Internal.ts': internalInterface,
        'packages/foo/src/internal/Consumer.ts':
          'import type { Internal } from "../Internal.ts"\nexport interface PublicInsideInternalDirectory { readonly value: Internal }\n',
      },
      'packages/foo/src/internal/Consumer.ts',
    ),
    fixture({ 'src/Internal.ts': '/** @internal */\nexport const unused = 1\n' }, 'src/Internal.ts'),
  ],
})
