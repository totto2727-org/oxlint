import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule from './prefer-span-over-gen-name.ts'

runRuleTest('prefer-span-over-gen-name', rule, {
  invalid: [
    `import { Effect } from 'effect'; const program = Effect.gen(function* loadUser() {})`,
    `import { Effect } from 'effect'; const run = () => Effect.gen({ self }, function* loadUser() {})`,
    `import { Effect } from 'effect'; Effect['gen'](function* loadUser() {})`,
    `import { gen as make } from 'effect/Effect'; make(function* loadUser() {})`,
    `import * as E from 'effect/Effect'; E.gen(function* loadUser() {})`,
    `import { Effect } from 'effect'; Effect.gen(function* loadUser() {}).pipe(Effect.withSpan('loadUser'))`,
  ].map((code) => ({
    code,
    errors: [{ message: /Keep the `Effect\.gen` callback anonymous.*`Effect\.withSpan`/u }],
  })),
  valid: [
    `import { Effect } from 'effect'; Effect.gen(function* () {})`,
    `import { Effect } from 'effect'; Effect.gen(function* () {}).pipe(Effect.withSpan('loadUser'))`,
    `import { Effect } from 'effect'; function* loadUser() {}; Effect.gen(loadUser)`,
    `import { Effect } from 'effect'; Effect.fn('loadUser')(function* () {})`,
    `import { Effect } from 'effect'; Effect[gen](function* loadUser() {})`,
    `import { Effect } from 'effect'; function wrap(Effect) { return Effect.gen(function* loadUser() {}) }`,
    `import { Effect } from './other.ts'; Effect.gen(function* loadUser() {})`,
    `other(function* loadUser() {})`,
  ],
})
