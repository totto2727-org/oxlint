# @totto2727/oxlint

[Oxlint](https://oxc.rs/docs/guide/usage/linter.html) rules and presets for TypeScript and Effect.

## Usage

Check your source files with the configured preset:

```sh
npx oxlint --config .oxlintrc.mjs src
```

Replace `src` with your source directory.
The preset reports policy violations, such as `rules/no-let` for a `let` declaration.
Tests use the same rules as application files.

## Key features

- Separate TypeScript and Effect presets, plus a combined preset.
- Required import extensions and configurable TypeScript or JavaScript output extensions.
- Shared native Ultracite settings and incorporated Effect rule implementations.
- ESM exports with TypeScript declarations.

## Prerequisites

- Node.js 24 or later.
- An ESM configuration.

## Setup

Install the plugin and Oxlint as development dependencies:

```sh
npm install --save-dev @totto2727/oxlint oxlint
```

Enable both rule groups in `.oxlintrc.mjs`:

```js
import preset from '@totto2727/oxlint/preset'
import { defineConfig } from 'oxlint'

export default defineConfig({ extends: [preset] })
```

Use `/typescript` or `/effect` instead of `/preset` to select one group.
See [Getting started](https://oxlint.totto2727.dev/en/guide/getting-started) for individual-rule configuration.

## API

The default package export is the plugin: 29 local rules and five Effect rule implementations.
All plugin rule IDs use the `rules/` prefix.
The `/typescript`, `/effect` and `/preset` exports are Oxlint configurations.
Named exports `typescriptRuleNames`, `effectRuleNames` and `compatibilityRuleNames` list the rules in each group.
The four compatibility rules are available but not enabled by presets.

- [TypeScript preset](https://oxlint.totto2727.dev/en/presets/typescript)
- [Effect preset](https://oxlint.totto2727.dev/en/presets/effect), including external rules and disabled-rule reasons
- [Local rules](https://oxlint.totto2727.dev/en)

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
