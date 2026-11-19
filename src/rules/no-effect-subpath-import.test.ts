import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule, { isAllowedEffectImport } from './no-effect-subpath-import.ts'

describe('isAllowedEffectImport', () => {
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

  describe('disallowed subpath imports', () => {
    test('@effect/platform/NodeRuntime', () => {
      expect(isAllowedEffectImport('@effect/platform/NodeRuntime')).toBe(false)
    })

    test('effect/Stream subpath', () => {
      expect(isAllowedEffectImport('effect/Stream')).toBe(false)
    })

    test('effect/unstable/HttpClient is an individual module', () => {
      expect(isAllowedEffectImport('effect/unstable/HttpClient')).toBe(false)
    })

    test('effect/http/client is a nested path even though it has no uppercase segment', () => {
      expect(isAllowedEffectImport('effect/http/client')).toBe(false)
    })

    test('effect/unstable/foo/bar (double segment under unstable/)', () => {
      expect(isAllowedEffectImport('effect/unstable/foo/bar')).toBe(false)
    })
  })
})

runRuleTest('no-effect-subpath-import', rule, {
  invalid: [
    {
      code: "import { Schema } from 'effect/Schema'",
      errors: 1,
      name: 'subpath under effect root is reported',
    },
    {
      code: "import { NodeRuntime } from '@effect/platform-node/NodeRuntime'",
      errors: 1,
      name: 'subpath under @effect scope is reported',
    },
    {
      code: "import type { HttpServerResponse } from 'effect/http/HttpServerResponse'",
      errors: 1,
      filename: 'http-types.ts',
      name: 'individual modules under a public category are reported',
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
