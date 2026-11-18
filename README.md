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

The default package export is the plugin: 29 local rules and five Effect rule implementations.
All plugin rule IDs use the `rules/` prefix.
The `/preset` export is the standard Oxlint configuration.
The named exports `presetRuleNames` and `compatibilityRuleNames` list enabled and opt-in custom rules, respectively.
The four compatibility rules are opt-in alternatives to current import policies.

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

## Development

For repository maintenance instructions, see [AGENTS.md](./AGENTS.md).

## License

[MIT](./LICENSE).
See [third-party notices](./THIRD-PARTY-NOTICES.md) for incorporated source licenses.
