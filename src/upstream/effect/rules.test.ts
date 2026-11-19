// Acceptance cases adapted from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
// oxlint-disable-next-line rules/no-node-imports -- RuleTester needs real package and barrel fixtures on disk.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
// oxlint-disable-next-line rules/no-node-imports -- The cleanup hook removes real fixture roots.
import { rm } from 'node:fs/promises'
// oxlint-disable-next-line rules/no-node-imports -- RuleTester receives absolute filesystem paths.
import path from 'node:path'

import { Data, Predicate } from 'effect'
import { RuleTester } from 'oxlint/plugins-dev'
import { afterAll, describe } from 'vite-plus/test'

import { noBigintLiterals } from './no-bigint-literals.ts'
import { noImportFromBarrelPackage } from './no-import-from-barrel-package.ts'
import { noOpaqueInstanceFields } from './no-opaque-instance-fields.ts'
import { noUnusedInternal } from './no-unused-internal.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const roots: string[] = []
class MissingFixtureFile extends Data.TaggedError('MissingFixtureFile')<{ file: string }> {}

const writeFixtureFile = (filename: string, code: string): void => {
  // oxlint-disable-next-line node/no-sync -- Fixture directories must exist by test collection.
  mkdirSync(path.dirname(filename), { recursive: true })
  // oxlint-disable-next-line node/no-sync -- Fixture contents must exist by test collection.
  writeFileSync(filename, code)
}

const fixture = (files: Record<string, string>, file: string): { code: string; cwd: string; filename: string } => {
  const parent = path.resolve('tmp')
  // oxlint-disable-next-line node/no-sync -- RuleTester collects fixture cases synchronously.
  mkdirSync(parent, { recursive: true })
  // oxlint-disable-next-line node/no-sync -- Register an isolated root before collecting its cases.
  const cwd = mkdtempSync(path.join(parent, 'effect-rule-'))
  roots.push(cwd)
  for (const [name, code] of Object.entries(files)) {
    writeFixtureFile(path.join(cwd, name), code)
  }
  const code = files[file]
  if (Predicate.isNullish(code)) {
    throw new MissingFixtureFile({ file })
  }
  return { code, cwd, filename: path.join(cwd, file) }
}

const bigintTests: RuleTester.TestCases = {
  invalid: [
    { code: 'const n = 1n', errors: 1, output: 'const n = BigInt("1")' },
    { code: 'const n = 0xFFn', errors: 1, output: 'const n = BigInt("255")' },
    { code: 'const n = -1n', errors: 1, output: 'const n = -BigInt("1")' },
  ],
  valid: ['const n = BigInt("1")', 'const n = 1', 'const n = "1n"'],
}

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

const barrelTests: RuleTester.TestCases = {
  invalid: [
    { code: "import { Effect } from 'effect'", errors: 1, options: barrelOptions },
    { code: "import { Effect as E } from 'effect'", errors: 1, options: barrelOptions },
    { code: "import * as Effect from 'effect'", errors: 1, options: barrelOptions },
    { code: "import { NodeRuntime } from '@effect/platform-node'", errors: 1, options: barrelOptions },
    { code: "import { HttpApi } from 'effect/unstable/httpapi'", errors: 1, options: barrelOptions },
    { code: "import { a } from './index.ts'", errors: 1 },
    { code: "import * as a from '../index'", errors: 1 },
    { code: "import { type A, b } from './index.ts'", errors: 1 },
    {
      ...fixture(
        { 'src/barrel/index.ts': 'export const a = 1', 'src/main.ts': "import { a } from './barrel'" },
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
}

const opaqueTests: RuleTester.TestCases = {
  invalid: [
    {
      code: "import { Schema } from 'effect'; class A extends Schema.Opaque<A>()(Schema.String) { value = 1 }",
      errors: 1,
    },
    {
      code: "import * as S from 'effect/Schema'; class A extends S.Opaque<A>()(S.String) { method() {} }",
      errors: 1,
    },
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
}

const internalInterface = '/** @internal */\nexport interface Internal { readonly value: string }\n'
const internalConst = '/** @internal */\nexport const internal = 1\n'

const unusedInternalTests: RuleTester.TestCases = {
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
          'packages/bar/src/Public.ts': 'import type * as I from "foo/Internal"\nexport type Public = I.Internal\n',
          'packages/foo/package.json': '{"name":"foo"}',
          'packages/foo/src/Internal.ts': internalInterface,
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
        'packages/foo/src/Consumer.ts': 'import type { Internal } from "./Internal.ts"\ntype Local = Internal\n',
        'packages/foo/src/Internal.ts': internalInterface,
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
}

describe('incorporated Effect rules', () => {
  afterAll(async () => {
    await Promise.all(roots.map(async (root) => rm(root, { force: true, recursive: true })))
  })
  // oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers tests rather than performing setup.
  tester.run('no-bigint-literals', noBigintLiterals, bigintTests)
  // oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers tests rather than performing setup.
  tester.run('no-import-from-barrel-package', noImportFromBarrelPackage, barrelTests)
  // oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers tests rather than performing setup.
  tester.run('no-opaque-instance-fields', noOpaqueInstanceFields, opaqueTests)
  // oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers tests rather than performing setup.
  tester.run('no-unused-internal', noUnusedInternal, unusedInternalTests)
})
