import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isAllowedEffectImport, noEffectSubpathImport as rule } from './no-effect-subpath-import.ts'

describe('classification of Effect package entries', () => {
  describe('allowed imports', () => {
    test('effect root package', () => {
      expect(isAllowedEffectImport('effect')).toBe(true)
    })

    test('@effect/platform root (single segment after @effect/)', () => {
      expect(isAllowedEffectImport('@effect/platform')).toBe(true)
    })

    test('@effect/platform-node root', () => {
      expect(isAllowedEffectImport('@effect/platform-node')).toBe(true)
    })

    test('legacy category path effect/unstable/http', () => {
      expect(isAllowedEffectImport('effect/unstable/http')).toBe(true)
    })

    test.each(['effect/http', 'effect/cli', 'effect/reactivity', 'effect/http-api', 'effect/testing', 'effect/schema'])(
      '%s is a public v4 category',
      (source) => {
        expect(isAllowedEffectImport(source)).toBe(true)
      },
    )

    test.each(['effect/new-category', 'effect/newCategory', 'effect/unstable/new-category'])(
      '%s does not require a hardcoded entry',
      (source) => {
        expect(isAllowedEffectImport(source)).toBe(true)
      },
    )
  })

  test.each([
    '@effect/platform/NodeRuntime',
    'effect/Stream',
    'effect/unstable/HttpClient',
    'effect/http/client',
    'effect/unstable/foo/bar',
  ])('rejects the subpath %s', (source) => {
    expect(isAllowedEffectImport(source)).toBe(false)
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('no-effect-subpath-import', rule, {
  invalid: [
    {
      code: "import { Schema } from 'effect/Schema'",
      errors: [{ message: 'Import from `effect` instead of `effect/Schema`.' }],
      name: 'subpath under effect root is reported',
    },
    {
      code: "import { NodeRuntime } from '@effect/platform-node/NodeRuntime'",
      errors: [{ message: 'Import from `@effect/platform-node` instead of `@effect/platform-node/NodeRuntime`.' }],
      name: 'subpath under @effect scope is reported',
    },
    {
      code: "import type { HttpServerResponse } from 'effect/http/HttpServerResponse'",
      errors: [{ message: 'Import from `effect/http` instead of `effect/http/HttpServerResponse`.' }],
      filename: 'http-types.ts',
      name: 'individual modules under a public category are reported',
    },
    {
      code: "import { SqlClient } from 'effect/unstable/sql/SqlClient'",
      errors: [{ message: 'Import from `effect/unstable/sql` instead of `effect/unstable/sql/SqlClient`.' }],
    },
    {
      code: "import { HttpClient } from 'effect/unstable/HttpClient'",
      errors: [{ message: 'Import from `effect` instead of `effect/unstable/HttpClient`.' }],
    },
  ],
  valid: [
    { code: "import { Schema } from 'effect'", name: 'effect root import is allowed' },
    { code: "import { HttpServerResponse } from 'effect/http'", name: 'public Effect v4 category is allowed' },
    { code: "import { Feature } from 'effect/new-category'", name: 'new category names are allowed' },
    { code: "import 'effect/schema/SchemaJITCompiler/enable'", name: 'documented side-effect entry is allowed' },
    {
      code: "import { NodeRuntime } from '@effect/platform-node'",
      name: '@effect package root import is allowed',
    },
    {
      code: "import { Sql } from 'effect/unstable/sql'",
      name: 'effect/unstable/<pkg> namespace import is allowed',
    },
    { code: "import { foo } from 'unrelated/deep/path'", name: 'unrelated package subpath is allowed' },
  ],
})
