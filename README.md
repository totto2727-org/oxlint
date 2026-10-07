# @totto2727/oxlint

Custom [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) rules for TypeScript and Effect-oriented applications.
The plugin preserves the monorepo's 27 rules, adds two independently configurable import-extension rules, and incorporates five official Effect Oxc rules.

## Setup

The first npm release is pending registry-owner setup.
The enabled GitHub Actions workflow publishes automatically on `v<version>` tags using npm Trusted Publishing, once the owner links `totto2727-org/oxlint` and `publish.yml` in npm package settings.
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
import typescript from '@totto2727/oxlint/typescript'
import { defineConfig } from 'oxlint'

export default defineConfig({ extends: [typescript] })
```

### Effect rules

```ts
import effect from '@totto2727/oxlint/effect'
import typescript from '@totto2727/oxlint/typescript'
import { defineConfig } from 'oxlint'

export default defineConfig({ extends: [typescript, effect] })
```

The Effect preset can also be used alone.
`@totto2727/oxlint/preset` enables both groups with the generated-file exception.
Test files receive the same rules as production files; no test-only relaxation is inherited.
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

- Default export from `@totto2727/oxlint`: the Oxlint plugin with 34 rules.
- Named exports `typescriptRuleNames`, `effectRuleNames`, and `compatibilityRuleNames`: readonly rule-name lists.
- Default exports from `/typescript`, `/effect`, and `/preset`: Oxlint configurations.

### Ultracite baseline

Both groups include the native Oxlint core configuration from Ultracite `7.12.3`, incorporated at its fixed source revision with MIT attribution.
Only the core configuration and shared ignores are incorporated, not the Ultracite CLI or its runtime dependency tree.
Its native rules, plugins, browser environment and shared output/cache/generated-file ignores are flattened into the public configurations.
Upstream file-specific overrides, including test-only relaxations and Astro exceptions, are not inherited.
Normal and test source files receive the same custom and native rules.
The two groups remain TypeScript and Effect; Ultracite does not introduce a third group.

Three native rules are explicitly disabled in the shared baseline:

- `unicorn/prefer-bigint-literals` would suggest literals that the official Effect `no-bigint-literals` rule forbids.
- `preserve-caught-error` requires the native `{ cause }` convention rejected by `no-error-cause-option`.
- `prefer-const` overlaps the stricter custom `no-let` policy and would report some declarations twice.

These choices are shared by both groups so changing their composition order does not restore the conflicts.
The TypeScript-only preset does not ban BigInt literals.
Other ordinary upstream `off` settings remain intact; skipping test-only relaxations does not mean enabling every disabled rule.
React, JavaScript-plugin and type-aware Ultracite layers are not automatically enabled.
The separate Ultracite Oxfmt preset is not adopted, so the existing Vite Plus formatter policy remains unchanged.
See the [pinned official core configuration](https://github.com/haydenbleasel/ultracite/blob/48156546701badf2c6e60f25cf1e8511f7dc44c7/packages/cli/config/oxlint/core/index.mjs) and [official Oxlint integration documentation](https://github.com/haydenbleasel/ultracite/blob/48156546701badf2c6e60f25cf1e8511f7dc44c7/apps/docs/docs/provider/oxlint.mdx).

### TypeScript

`consistent-import-extension`, `no-eslint-disable-comments`, `no-jsx-script-tag`, `no-let`, `no-redundant-alias`, `no-string-style`, `require-disable-reason`, and `require-import-extension`.

### Effect

`force-array-empty`, `force-iterable-empty`, `force-predicate`, `force-string-empty`, `no-bigint-literals`, `no-import-from-barrel-package`, `no-opaque-instance-fields`, `no-unused-internal`, `no-effect-runtime-run`, `no-error-cause-option`, `no-error-property-access`, `no-fetch`, `no-instanceof-error`, `no-js-date`, `no-node-imports`, `no-option-tag-comparison`, `no-raw-hono-create-middleware`, `no-sync-decode`, `no-type-predicate`, `prefer-is-nullish`, `prefer-non-unknown-decode`, and `require-top-level-decoder`.

These rules encode the original application's Effect policy, including shared Hono middleware and external-library boundaries, rather than universal recommendations for every Effect project.

### Official Effect rules and deduplication

The [official Effect Oxc rules](https://github.com/Effect-TS/effect/tree/b1d200c40a1dad69def51ebdbf0a1a612a12b8ac/packages/tools/oxc/src/oxlint/rules) are incorporated at a fixed revision because `@effect/oxc` is currently a private, unpublished upstream package.
The Effect preset enables `no-bigint-literals`, `no-import-from-barrel-package`, `no-opaque-instance-fields`, and `no-unused-internal` with the upstream barrel-check options.
It does not import unrelated native-rule settings from upstream's repository configuration.
`no-unused-internal` retains upstream's `cwd/packages/**/src/*.ts` workspace scan and per-working-directory cache, so flat `src/` projects are not covered by this rule.
Its runtime compiler API is pinned separately as `typescript-api` (TypeScript 6), while Vite Plus development continues to use TypeScript 7.

The following rules remain available for explicit use, but are not enabled by the presets:

- `force-ts-extension` and official `no-js-extension-imports` overlap the independently configurable extension rules and would cause duplicate diagnostics or conflict with JavaScript mode. The upstream rule also supports `.mjs` / `.cjs` to `.mts` / `.cts` conversion for static relative imports, which the custom four-extension rule does not cover. They are not exact equivalents.
- `no-effect-subpath-import` conflicts with the official preference for direct module imports.
- `no-effect-import-as` rejects the namespace imports used by the official convention.

For example, the official import policy accepts `import * as Schema from 'effect/Schema'` and rejects `import { Schema } from 'effect'`.
The two custom legacy import policies can still be explicitly enabled by projects that retain the opposite convention.
See [upstream differences](./docs/upstream-differences.md) and [third-party notices](./THIRD-PARTY-NOTICES.md) for source provenance and license details.

## Documentation

The separate [documentation site repository](https://github.com/totto2727-org/oxlint-docs) documents each rule with options and examples.

## Development

See [AGENTS.md](./AGENTS.md) for commands and npm Trusted Publisher setup.

## License

MIT

_This README was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [README template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/readme/template.md)._
