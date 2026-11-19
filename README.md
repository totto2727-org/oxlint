# @totto2727/oxlint

[Oxlint](https://oxc.rs/docs/guide/usage/linter.html) rules and a standard preset for JavaScript and TypeScript projects that use Effect.

## Usage

Check your source files with the configured preset:

```sh
npx oxlint --config .oxlintrc.mjs src
```

Replace `src` with your source directory.
The preset reports policy violations, such as `rules/no-let` for a `let` declaration.
Tests use the same rules as application files.

## Key features

- One standard preset for JavaScript and TypeScript projects that use Effect.
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

Enable the standard preset in `.oxlintrc.mjs`:

```js
import preset from '@totto2727/oxlint/preset'
import { defineConfig } from 'oxlint'

export default defineConfig({ extends: [preset] })
```

If you upgrade from `0.1`, replace `/typescript` or `/effect` imports with `/preset`.
If you used `typescriptRuleNames` or `effectRuleNames`, use the combined `presetRuleNames` list instead.

The preset enables all seven native rule categories as errors, including nursery rules, and turns on type-aware linting.
React, React Perf, JSX A11y and Vitest are enabled alongside the general-purpose built-in plugins.
Next.js, Vue and Jest are opt-in.
If you set `plugins` in your own config, include the preset plugins as well: `plugins: [...(preset.plugins ?? []), 'nextjs']`.
Set the environment for your runtime in your own config.
When native and custom rules conflict or report the same issue, the preset favors the custom policy unless the native rule provides better coverage.

## API

The default package export is the plugin.
All plugin rule IDs use the `rules/` prefix.
The `/preset` export is the standard Oxlint configuration.
The named exports `presetRuleNames` and `compatibilityRuleNames` list enabled and opt-in custom rules, respectively.
Compatibility rules are opt-in.

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

### Effect errors and validation

`require-tagged-error` reports direct construction and subclassing of native errors and untagged `Data.Error`.
Use `Data.TaggedError` or `Schema.TaggedError` for application errors whether or not they have a `cause`.
If an error wraps a previous failure, retain the original value in a required `cause` field.
Use a separate tagged error for failures with no cause.
`no-optional-error-cause` reports optional `cause` declarations in tagged error definitions, including same-file type aliases, interfaces, and constant Schema field objects.
Use `readonly cause: unknown` or `cause: Schema.Unknown` when wrapping a failure. Omit `cause` entirely when the error has no cause.
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

## Development

For repository maintenance instructions, see [AGENTS.md](./AGENTS.md).

## License

[MIT](./LICENSE).
See [third-party notices](./THIRD-PARTY-NOTICES.md) for incorporated source licenses.
