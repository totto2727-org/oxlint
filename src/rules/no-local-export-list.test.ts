import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noLocalExportList } from './no-local-export-list.ts'

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('no-local-export-list', noLocalExportList, {
  invalid: [
    { code: 'const value = 1; export { value }', errors: [{ message: /at their declarations/u }] },
    { code: 'const value = 1; export { value as renamed }', errors: [{ message: /at their declarations/u }] },
    {
      code: 'type Value = string; export type { Value }',
      errors: [{ message: /at their declarations/u }],
      filename: 'fixture.ts',
    },
    { code: 'import { value } from "./source.ts"; export { value }', errors: [{ message: /from another module/u }] },
  ],
  valid: [
    { code: 'export const value = 1; const privateValue = value', name: 'inline export before a private declaration' },
    {
      code: 'export function getValue() {}; export type Value = string',
      filename: 'fixture.ts',
      name: 'inline function and type exports',
    },
    {
      code: 'export { type Value, value as renamed } from "./source.ts"',
      filename: 'fixture.ts',
      name: 'named re-export from another module',
    },
    { code: 'export * from "./source.ts"', name: 'star re-export is outside this rule' },
    { code: 'export {}', name: 'empty module marker' },
  ],
})
