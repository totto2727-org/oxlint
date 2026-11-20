import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noReadonly as rule } from './no-readonly.ts'

runRuleTest('no-readonly', rule, {
  invalid: [
    'interface Person { readonly name: string }',
    'type Person = { readonly name: string }',
    'type Person = { readonly [key: string]: string }',
    'type Names = readonly string[]',
    'type Pair = readonly [string, string]',
    'type Locked<T> = { readonly [K in keyof T]: T[K] }',
    'type Locked<T> = { +readonly [K in keyof T]: T[K] }',
    'type Writable<T> = { -readonly [K in keyof T]: T[K] }',
    'class Person { private readonly name = "" }',
    'abstract class Person { abstract readonly name: string }',
    'class Person { constructor(public readonly name: string) {} }',
  ].map((code) => ({ code, errors: 1, filename: 'test.ts' })),
  valid: [
    'const Person = Schema.Struct({ name: Schema.String }); type Person = typeof Person.Type',
    'const Names = Schema.Array(Schema.String); type Names = typeof Names.Type',
    'type Keys = keyof Person',
    'type Props = { readonly: boolean }',
    'const props = { readonly: true }',
    'const fixed = { name: "test" } as const',
    'class Person { constructor(public name: string) {} }',
  ].map((code) => ({ code, filename: 'test.ts' })),
})
