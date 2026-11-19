import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { getNodeBuiltinSpecifier, noNodeImports as rule } from './no-node-imports.ts'

describe('node builtin specifier normalization', () => {
  test('returns builtin package without node protocol', () => {
    expect(getNodeBuiltinSpecifier('node:fs/promises')).toBe('fs/promises')
  })

  test('returns undefined for non-node imports', () => {
    expect(getNodeBuiltinSpecifier('effect')).toBeUndefined()
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('no-node-imports', rule, {
  invalid: [
    { code: "import { readFile } from 'node:fs/promises'", errors: 1, name: 'node import is reported' },
    { code: "import { spawn } from 'node:child_process'", errors: 1, name: 'child_process is not exempt' },
    { code: "import { randomUUID } from 'node:crypto'", errors: 1, name: 'crypto is not exempt' },
    { code: "import { platform } from 'node:os'", errors: 1, name: 'os is not exempt' },
    { code: "import { inspect } from 'node:util'", errors: 1, name: 'util is not exempt' },
    { code: "export { readFile } from 'node:fs/promises'", errors: 1, name: 'node re-export is reported' },
    { code: "export * from 'node:fs/promises'", errors: 1, name: 'node export all is reported' },
  ],
  valid: [
    { code: "import { Effect } from 'effect'", name: 'non-node import is allowed' },
    {
      code: "import { join } from 'node:path'",
      name: 'array whitelist allows selected builtin',
      options: [['path']],
    },
    {
      code: "import { readFile } from 'node:fs/promises'",
      name: 'object allow whitelist allows selected builtin',
      options: [{ allow: ['fs/promises'] }],
    },
    {
      code: "import { readFile } from 'node:fs/promises'",
      name: 'object allowed whitelist allows selected builtin',
      options: [{ allowed: ['fs/promises'] }],
    },
  ],
})
