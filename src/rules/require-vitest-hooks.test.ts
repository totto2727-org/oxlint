import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule from './require-vitest-hooks.ts'

runRuleTest('require-vitest-hooks', rule, {
  valid: [
    { filename: 'entry.server.ts', code: 'let sequence = 0; serve(app)' },
    { filename: 'authoring.types.ts', code: "import { expectTypeOf } from 'vitest'; expectTypeOf(value).toBeString()" },
    "import { describe } from 'other'; describe('app', () => { startServer() })",
    "import { describe } from 'vitest'; function run(describe) { describe('app', () => { startServer() }) }",
    `import { beforeEach, afterEach, describe, test, vi } from 'vitest'
     vi.mock('./storage.ts')
     beforeEach(() => vi.clearAllMocks())
     describe('suite', () => {
       afterEach(cleanup)
       test('isolated fixture', () => { const fixture = createFixture(); fixture.run() })
     })`,
    "import * as v from 'vitest'; v.vi.hoisted(() => ({})); v.describe.each(items)('suite', () => { v.it('test', run) })",
    "import { layer, describeWrapped } from '@effect/vitest'; layer(services)((run) => { run.effect.each(items)('test', check) }); describeWrapped('suite', it => { it.live('test', check) })",
  ],
  invalid: [
    {
      filename: 'ordinary-name.ts',
      code: "import { test } from 'vitest'; resetDb(); test('case', run)",
      errors: 1,
      output: null,
    },
    {
      code: "import { beforeEach, vi } from 'vite-plus/test'; vi.clearAllMocks(); beforeEach(reset)",
      errors: 1,
      output: null,
    },
    {
      code: "import { describe as suite } from 'vitest'; suite('suite', () => { resetDb(); counter = 0 })",
      errors: 2,
      output: null,
    },
    {
      code: "import * as v from 'vitest'; v.describe.each(items)('suite', () => { v.vi.resetAllMocks(); v.test('case', run) })",
      errors: 1,
      output: null,
    },
    { code: "import { effect } from '@effect/vitest'; resetDb(); effect('case', run)", errors: 1, output: null },
    {
      code: "import { layer } from '@effect/vitest'; layer(services)((it) => { resetDb(); it.effect('case', run) })",
      errors: 1,
      output: null,
    },
  ],
})
