import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { effectTracing as rule } from './effect-tracing.ts'

runRuleTest('effect-tracing', rule, {
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

const codeUsingEffect = (expression: string): string => `import { Effect } from 'effect'; ${expression}`

runRuleTest('effect-tracing (application)', rule, {
  invalid: [`Effect.fnUntraced(function* () {})`, `Effect.fnUntracedEager(function* () {})`].map((expression) => ({
    code: codeUsingEffect(expression),
    errors: [{ message: /Use `Effect\.fn`.*explain why/u }],
    options: ['application'],
  })),
  valid: [
    `Effect.fn('loadUser')(function* () {})`,
    `Effect.fn(function* () {})`,
    `Effect.gen(function* () {}).pipe(Effect.withSpan('loadUser'))`,
    `Effect.gen(function* () {}).pipe(Effect.withSpanScoped('loadUser'))`,
    `Effect.gen(function* () {})`,
    `function run(Effect) { Effect.fnUntraced(function* () {}) }`,
  ].map((expression) => ({ code: codeUsingEffect(expression), options: ['application'] })),
})

runRuleTest('effect-tracing (library)', rule, {
  invalid: [
    { expression: `Effect.fn('loadUser')(function* () {})`, message: /Use `Effect\.fnUntraced`/u },
    { expression: `Effect.fn(function* () {})`, message: /Use `Effect\.fnUntraced`/u },
    { expression: `Effect.succeed('user').pipe(Effect.withSpan('loadUser'))`, message: /Leave span creation/u },
    { expression: `Effect.withSpanScoped('loadUser')(Effect.succeed('user'))`, message: /Leave span creation/u },
    { expression: `Effect.gen(function* loadUser() {})`, message: /anonymous\. Leave span creation/u },
  ].map(({ expression, message }) => ({
    code: codeUsingEffect(expression),
    errors: [{ message }],
    options: ['library'],
  })),
  valid: [
    `Effect.fnUntraced(function* () {})`,
    `Effect.fnUntracedEager(function* () {})`,
    `Effect.gen(function* () {})`,
    `function run(Effect) { Effect.withSpan('loadUser') }`,
    `Effect[withSpan]('loadUser')`,
  ].map((expression) => ({ code: codeUsingEffect(expression), options: ['library'] })),
})
