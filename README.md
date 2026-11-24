# @totto2727/oxlint

[Oxlint](https://oxc.rs/docs/guide/usage/linter.html) rules and a standard preset for JavaScript and TypeScript projects that use Effect.

## Usage

Check your source files with the configured preset:

```sh
npx oxlint --config .oxlintrc.mjs src
```

Replace `src` with your source directory.
The preset reports policy violations, such as `rules/no-let` for a `let` declaration.
`rules/no-for-loops` reports `for`, `for...of`, `for...in`, and `for await...of`.
Use collection combinators, `Effect.forEach`, or `Stream.runForEach` when they express the same behavior.
If a loop is necessary, add `oxlint-disable-next-line rules/no-for-loops -- <reason>` above it.
`rules/no-local-export-list` requires named exports at their declarations, such as `export const value`, instead of a separate `export { value }`.
Use `export { value } from './source.ts'` to re-export from another module. Empty `export {}` module markers are allowed.
Tests use the same general rules as application files, plus Vitest rules for `*.test.ts` and `*.test.tsx`.
Use Vitest's `test` instead of `it`, including inside `describe`.
ESM modules may use top-level `await` without a lint suppression.

## Key features

- Shared lint policies for JavaScript and TypeScript, with separate Effect tracing presets for applications and libraries.
- Required import extensions and configurable TypeScript or JavaScript output extensions.
- All native Oxlint rule categories, general-purpose built-in plugins, and incorporated Effect rules.
- ESM exports with TypeScript declarations.

## Prerequisites

- Node.js 24 or later.
- An ESM configuration.

## Setup

Install the plugin, Oxlint and its type-aware checker as development dependencies:

```sh
npm install --save-dev @totto2727/oxlint oxlint oxlint-tsgolint
```

Select the application preset in `.oxlintrc.mjs`:

```js
import preset from '@totto2727/oxlint/preset/application'
import { defineConfig } from 'oxlint'

export default defineConfig({ extends: [preset] })
```

For a library, import `@totto2727/oxlint/preset/library` instead.
If you upgrade from `0.1`, replace `/typescript` or `/effect` imports with the preset for your project.
If you used `typescriptRuleNames` or `effectRuleNames`, use the combined `presetRuleNames` list instead.
Remove explicit `rules/force-ts-extension` and `rules/no-js-extension-imports` entries. The standard preset uses `require-import-extension` and `consistent-import-extension` instead.

The preset enables all seven native rule categories as errors, including nursery rules, and turns on type-aware linting.
React, React Perf and JSX A11y are enabled alongside the general-purpose built-in plugins.
The built-in Vitest plugin and `rules/require-vitest-hooks` apply only to `*.test.ts` and `*.test.tsx` at any directory depth.
`rules/require-vitest-hooks` reports standalone setup and cleanup expressions outside hooks in recognized Vitest test modules and suites.
Put shared setup and cleanup in hooks, for example `beforeEach(() => vi.clearAllMocks())`.
When a test needs the result of setup, create it in that test with `const` instead of assigning it to a shared `let` in a hook.
Next.js, Vue and Jest are opt-in.
If you set `plugins` in your own config, include the preset plugins as well: `plugins: [...(preset.plugins ?? []), 'nextjs']`.
Set the environment for your runtime in your own config.
When native and custom rules conflict or report the same issue, the preset favors the custom policy unless the native rule provides better coverage.

## API

The default package export is the plugin.
All plugin rule IDs use the `rules/` prefix.
The `/preset/application` and `/preset/library` exports apply the same shared rules with different tracing policies.
The `/preset` export applies the shared rules without assuming a project kind.
In a workspace that contains both kinds of code, extend `/preset` and set `['error', 'application']` or `['error', 'library']` on `rules/effect-tracing` for each package scope.
The named export `presetRuleNames` lists enabled custom rules.
The `compatibilityRuleNames` export is empty.

See [the preset source](https://github.com/totto2727-org/oxlint/blob/main/src/preset.ts) for conflict resolutions and their reasons.

### Import extensions

`require-import-extension` reports missing extensions without adding a guessed extension.
`consistent-import-extension` converts known extensions and keeps ESM and CommonJS module families separate.
The default mode is `ts`.

| Input          | `ts` mode | `js` mode |
| -------------- | --------- | --------- |
| `.js`, `.ts`   | `.ts`     | `.js`     |
| `.jsx`, `.tsx` | `.tsx`    | `.js`     |
| `.mjs`, `.mts` | `.mts`    | `.mjs`    |
| `.cjs`, `.cts` | `.cts`    | `.cjs`    |

Set `'rules/consistent-import-extension': ['error', { mode: 'js' }]` in your configuration's `rules` object for JavaScript output.
These rules check relative paths and slash-containing `#` paths, such as `#@/utils`, in imports, re-exports and literal dynamic imports.
They ignore slashless aliases such as `#utils`.
They preserve query strings and fragments and ignore bare package imports and non-code assets.

`no-index-filename` rejects files named `index.ts` or `index.tsx`, even if no code imports them.
Name the file for its purpose, such as `routes.ts` or `dashboard.tsx`, and update its import paths or package export targets.
The rule does not rename files automatically.

`no-import-from-barrel-package` reports named value imports and namespace imports from relative `index` files, including directory imports with an index file.
Import directly from the module that defines the value.
The standard preset does not guess which external package paths are barrels.
Set the rule's `checkPatterns` option to match specific package paths if those paths have suitable module subpaths.

`no-effect-import-as` and `no-effect-subpath-import` require unaliased named imports from Effect package roots and public category entry points.
Use `import { Effect, Schema } from 'effect'` and `import { HttpClient } from 'effect/http'` instead of namespace imports or individual module subpaths.
The rule treats a single segment that does not start with an uppercase letter as a category without checking the installed package's export map.
This convention also applies to legacy `effect/unstable/<category>` paths. The documented Schema JIT side-effect entry remains allowed.

`no-raw-crypto` reports references to the global Web Crypto object, including access through `globalThis`, `global`, `self` and `window`.
It reports these references inside `Effect.tryPromise` callbacks as well.
It reports static imports, dynamic imports, direct `require` calls and re-exports of Node.js `node:crypto` and `crypto` with string literal specifiers.
Local bindings and type-only references are allowed.
The rule checks direct references and literal property names without tracing aliases of global objects.
The shared preset assigns Node.js crypto imports to this rule for the crypto-specific diagnostic.
If you override the `no-node-imports` allowlist, include `crypto` to retain this behavior.

For SHA-256 digests, import `Digest` from `effect/crypto`, get the `Digest.Digest` service and call `digest.digest(Digest.sha256, bytes)`.
Provide `Digest.layerWebCrypto` where you configure the services.
For secure random bytes and UUIDs, use `SecureRandom.SecureRandom` and provide `SecureRandom.layerWebCrypto`.
See the [Digest service](https://github.com/Effect-TS/effect/blob/effect%404.1.5/packages/effect/src/crypto/Digest.ts) and [SecureRandom service](https://github.com/Effect-TS/effect/blob/effect%404.1.5/packages/effect/src/crypto/SecureRandom.ts) in Effect 4.1.5.
If a runtime adapter needs direct access, suppress the specific line with an `oxlint-disable-next-line rules/no-raw-crypto -- <reason>` comment.

### Effect errors and validation

`require-tagged-error` reports direct construction and subclassing of native errors and untagged `Data.Error`.
Use `Data.TaggedError` or `Schema.TaggedError` for application errors whether or not they have a `cause`.
If an error wraps a previous failure, retain the original value in a required `cause` field.
Use a separate tagged error for failures with no cause.
`no-optional-error-cause` reports optional `cause` declarations in tagged error definitions, including same-file type aliases, interfaces, and constant Schema field objects.
Use `cause: Schema.Unknown` or a required `cause: unknown` when wrapping a failure. Omit `cause` entirely when the error has no cause.
`no-error-property-access` checks JavaScript catch bindings and direct `Effect.try` or `Effect.tryPromise` callbacks, not typed failures that happen to be named `error`.
If an external API requires a native constructor, use a line-level suppression with the interoperability reason. `eslint/preserve-caught-error` still checks native rethrows.

`no-direct-tag-access` replaces `no-option-tag-comparison` and rejects direct `_tag` access, including literal brackets, optional chaining, destructuring and `in` checks.
Use `Option.isSome` or `Option.isNone` for `Option`, and `Result.isSuccess` or `Result.isFailure` for `Result`.
Use `Exit.isSuccess` or `Exit.isFailure` for `Exit`.
Use `Match.tag` or `Match.tagsExhaustive` for tagged domain values, such as values defined with `Data.TaggedClass` or `Data.TaggedError`.
The rule does not guess the receiver type or rewrite branches automatically.

`require-tagged-data` rejects handwritten `_tag` properties in TypeScript types, classes and object literals.
Define data with `Data.TaggedClass`, `Data.TaggedEnum`, `Schema.TaggedClass`, `Schema.TaggedStruct` or `Schema.TaggedUnion`.
Pair the `Data.TaggedEnum` type with `Data.taggedEnum` to create values.
Infer TypeScript types from those definitions instead of redeclaring the tag.
Keep `require-tagged-error` for error constructions that do not define a tag at all.

`prefer-schema-format-validation` reports inline regex tests that reject input by throwing or yielding a newly constructed failure.
Define a named Schema for the format and its length or range constraints. This rule does not report ordinary regex classification or infer the domain of numeric comparisons.

`require-top-level-decoder` reports decoder construction inside a function.
Build decoders for fixed schemas at module scope so calls can reuse them.
If the schema depends on runtime input, or a factory builds and retains a decoder once per instance, suppress only the construction line and state why it cannot be hoisted.

```ts
// oxlint-disable-next-line rules/require-top-level-decoder -- The factory builds this decoder once from the selected schema and reuses it for every request.
const decode = Schema.decodeUnknownEffect(selectedSchema)
```

### Effect tracing

`effect-tracing` reports named generator callbacks written inline in `Effect.gen`. Keep the callback anonymous.
In an application, use `Effect.fn` for reusable Effect functions. Spans are optional. To name the trace of a generator, use `Effect.gen(function* () { … }).pipe(Effect.withSpan('loadUser'))`.
In a library, use `Effect.fnUntraced` and leave `Effect.withSpan` and `Effect.withSpanScoped` to the application.
Named `Effect.fn` records call and definition locations and creates a span. Unnamed `Effect.fn` records the locations but does not create a span.
If an application needs an untraced function on a performance-critical path, or a library must add tracing, suppress only the call line and state the reason.
The shared preset checks generator names without requiring either tracing policy.

### Immutable data types

`no-readonly` reports handwritten TypeScript `readonly` modifiers, including on properties, arrays, tuples, and mapped types.
Use `Schema.Struct`, `Schema.Array`, or `Schema.Tuple`, and derive the type via `typeof MySchema.Type`.
These schemas infer immutable types by default. They do not freeze values at runtime.
If an external contract requires the modifier, suppress only the declaration line and state the reason.

## Development

For repository maintenance instructions, see [AGENTS.md](./AGENTS.md).

## License

[MIT](./LICENSE).
See [third-party notices](./THIRD-PARTY-NOTICES.md) for incorporated source licenses.
