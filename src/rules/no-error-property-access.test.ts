import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noErrorPropertyAccess as rule } from './no-error-property-access.ts'

runRuleTest('no-error-property-access', rule, {
  invalid: [
    { code: 'try { run() } catch (failure) { log(failure.message) }', errors: 1 },
    { code: `try { run() } catch (unexpected) { log(unexpected['message']) }`, errors: 1 },
    { code: `import { Effect as E } from 'effect'; E.try({try: run, catch: (caught) => caught.message})`, errors: 1 },
    {
      code: `import * as Fx from 'effect/Effect'; Fx.tryPromise({try: run, catch(caught) { return caught.stack }})`,
      errors: 1,
    },
  ],
  valid: [
    'try { run() } catch (cause) { throw new ConfigFileError({ cause }) }',
    'const error = new TaggedError({ cause }); log(error.cause)',
    'effect.pipe(Effect.catch((error) => Effect.succeed(error.message)))',
    'try { run() } catch (error) { use((error) => error.message) }',
    `import { Effect } from './fake.ts'; Effect.try({try: run, catch: (error) => error.message})`,
  ],
})
