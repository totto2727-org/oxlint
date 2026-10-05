# @totto2727/oxlint

Custom [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) rules for TypeScript and Effect-oriented applications.
The plugin preserves the monorepo's 27 rules and adds two independently configurable import-extension rules.

## Setup

The first npm release is pending registry-owner setup.
Until publication, install a supplied archive as a project dependency:

```sh
npm install ./totto2727-oxlint-0.1.0.tgz
```

Requires Node.js 24 or newer and an ESM configuration.
The library depends directly on `oxlint`, uses its official `@oxlint/plugins` types, and does not depend on Vite Plus at runtime.
Vite Plus is used only for development and package management.

## Usage

### TypeScript rules

```ts
import { defineConfig } from 'oxlint'
import typescript from '@totto2727/oxlint/typescript'

export default defineConfig({ extends: [typescript] })
```

### Effect rules

```ts
import { defineConfig } from 'oxlint'
import typescript from '@totto2727/oxlint/typescript'
import effect from '@totto2727/oxlint/effect'

export default defineConfig({ extends: [typescript, effect] })
```

The Effect preset can also be used alone.
`@totto2727/oxlint/preset` enables both groups with the original test and generated-file exceptions.
All rule IDs retain the `rules/` prefix.

### Import extensions

The TypeScript preset enables `require-import-extension` and `consistent-import-extension` in TypeScript mode.
Relative paths and `#` aliases require explicit extensions, including import declarations, re-exports, and dynamic imports.
Bare package imports and non-code assets are left alone.
Missing extensions are reported without guessing a `.ts`, `.tsx`, or directory-index fix.
Known code extensions can be fixed while retaining query strings and URL fragments.

```ts
import typescript from '@totto2727/oxlint/typescript'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [typescript],
  rules: {
    'rules/consistent-import-extension': ['error', { mode: 'js' }],
  },
})
```

- `mode: 'js'`: normalize `.js`, `.jsx`, `.ts`, and `.tsx` to `.js`.
- `mode: 'ts'` (default): normalize `.js` / `.ts` to `.ts`, and `.jsx` / `.tsx` to `.tsx`.
- `require-import-extension`: only enforce the presence of an explicit extension.
- `force-ts-extension`: compatibility rule combining required extensions and TypeScript normalization. It accepts the same mode option, but is not enabled by presets to avoid duplicate reports.

## API and groups

- Default export from `@totto2727/oxlint`: the Oxlint plugin with 29 rules.
- Named exports `typescriptRuleNames`, `effectRuleNames`, and `compatibilityRuleNames`: readonly rule-name lists.
- Default exports from `/typescript`, `/effect`, and `/preset`: Oxlint configurations.

### TypeScript

`consistent-import-extension`, `no-eslint-disable-comments`, `no-jsx-script-tag`, `no-let`, `no-redundant-alias`, `no-string-style`, `require-disable-reason`, and `require-import-extension`.

### Effect

`force-array-empty`, `force-iterable-empty`, `force-predicate`, `force-string-empty`, `no-effect-import-as`, `no-effect-runtime-run`, `no-effect-subpath-import`, `no-error-cause-option`, `no-error-property-access`, `no-fetch`, `no-instanceof-error`, `no-js-date`, `no-node-imports`, `no-option-tag-comparison`, `no-raw-hono-create-middleware`, `no-sync-decode`, `no-type-predicate`, `prefer-is-nullish`, `prefer-non-unknown-decode`, and `require-top-level-decoder`.

These rules encode the original application's Effect policy, including shared Hono middleware and external-library boundaries, rather than universal recommendations for every Effect project.

## Documentation

The separate [documentation site repository](https://github.com/totto2727-org/oxlint-docs) documents each rule with options and examples.

## Development

See [AGENTS.md](./AGENTS.md) for commands and npm Trusted Publisher setup.

## License

MIT

_This README was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [README template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/readme/template.md)._
