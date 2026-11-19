import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { getRuntimeMethod, noEffectRuntimeRun as rule } from './no-effect-runtime-run.ts'

describe('extraction of Effect runtime method names', () => {
  test('detects Effect.runPromise member expression', () => {
    expect(
      getRuntimeMethod({
        computed: false,
        object: { name: 'Effect', type: 'Identifier' },
        property: { name: 'runPromise', type: 'Identifier' },
        type: 'MemberExpression',
      }),
    ).toBe('runPromise')
  })

  test('detects runtime.runSync member expression by method name only', () => {
    expect(
      getRuntimeMethod({
        computed: false,
        object: { name: 'runtime', type: 'Identifier' },
        property: { name: 'runSync', type: 'Identifier' },
        type: 'MemberExpression',
      }),
    ).toBe('runSync')
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers cases synchronously during test collection.
runRuleTest('no-effect-runtime-run', rule, {
  invalid: [
    { code: 'Effect.runPromise(program)', errors: 1, name: 'Effect.runPromise is reported' },
    { code: 'Effect.runPromiseExit(program)', errors: 1, name: 'Effect.runPromiseExit is reported' },
    { code: 'Effect.runSync(program)', errors: 1, name: 'Effect.runSync is reported' },
    { code: 'Effect.runFork(program)', errors: 1, name: 'Effect.runFork is reported' },
    { code: 'NodeRuntime.runMain(program)', errors: 1, name: 'NodeRuntime.runMain is reported' },
    { code: 'runtime.runSync(handler)', errors: 1, name: 'runtime.runSync is reported by method name' },
  ],
  valid: [{ code: 'program.pipe(Effect.provide(layer))', name: 'Effect composition is allowed' }],
})
