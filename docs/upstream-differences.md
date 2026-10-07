# Incorporated sources and differences

The package incorporates fixed MIT-licensed sources from Effect and Ultracite.
It does not change the upstream Effect runtime.
Licenses are in [third-party notices](../THIRD-PARTY-NOTICES.md).

## Effect

Source: [Effect Oxc rules](https://github.com/Effect-TS/effect/tree/b1d200c40a1dad69def51ebdbf0a1a612a12b8ac/packages/tools/oxc/src/oxlint/rules).
Comparison revision: `b1d200c40a1dad69def51ebdbf0a1a612a12b8ac`.
Affected files: the five rules under `src/upstream/effect/`.
The upstream `@effect/oxc` package is private and unpublished, so these rules are incorporated into this plugin.

### Source changes

- Add source/license headers and local formatting.
- Import TypeScript `6.0.3` through the `typescript-api` alias in `no-unused-internal`.
  The development compiler, TypeScript `7.0.2`, does not provide `createSourceFile`.
- Register rules under the local `rules/` namespace.
- Test with Oxlint RuleTester instead of upstream mock visitor contexts.
  Cross-file tests use isolated directories under ignored `tmp/` and remove their own fixtures.

Diagnostics, fixes, matching, file discovery and process-local caches retain upstream behavior.
The runtime uses Effect `^4.0.1`; development uses local Vite Plus `^1.1.0`.
The Nix overlay revision `af16f6183aec0717d8975ee858c910ab43babee6` supplies the global Vite Plus `1.0.0` CLI.
Vite+ build tasks use `cache` inputs/outputs for automatic tracking and artifact restoration.

### Preset choices

The Effect preset checks package barrels and relative index imports.
Its patterns are configured in [`src/preset-builder.ts`](../src/preset-builder.ts).
It favors namespace imports from specific Effect modules.
The local `no-effect-subpath-import` and `no-effect-import-as` rules impose the opposite policy and are not enabled by presets.

`no-js-extension-imports` remains exported but is off in every preset.
Local `consistent-import-extension` covers its conversions and supports both `ts` and `js` output modes.
Enabling both would duplicate reports and introduce opposite fixes in `js` mode.
The local rule also supports slash-containing `#` paths, literal dynamic imports and query/fragment suffixes.
Slashless aliases such as `#utils` are outside its scope.
It preserves the `.mjs`/`.mts` and `.cjs`/`.cts` module families.
`require-import-extension` reports missing extensions without guessing a fix.
The combined `force-ts-extension` rule remains available but is not enabled by presets.

### Retained limits

- `no-unused-internal` scans `.ts` files under `<cwd>/packages/**/src/`.
  It excludes declarations and `dist`, `build` and `node_modules`.
  It does not scan standalone `src/`, singular `package/`, or `.tsx`, `.mts` and `.cts` files.
  Its source resolution is syntactic, not a TypeScript project type check.
  Its cache lasts for the process lifetime. Restart long-running linters after file changes.
- `no-import-from-barrel-package` resolves directory imports against supported `index` files.
  Explicit index paths do not need an existing target file.
- `no-opaque-instance-fields` checks non-static members in the two-call `Schema.Opaque(...) (...)` form.
  It tracks imported names, not lexical scope or shadowing.

## Ultracite

Source: [Ultracite 7.12.3 core](https://github.com/haydenbleasel/ultracite/blob/48156546701badf2c6e60f25cf1e8511f7dc44c7/packages/cli/config/oxlint/core/index.mjs).
Comparison revision: `48156546701badf2c6e60f25cf1e8511f7dc44c7`.
Affected files: `src/upstream/ultracite/{core,ignores}.ts`.
Only native core settings and shared ignores are incorporated. The full CLI is not a runtime dependency.
This avoids distributing unused CLI dependencies, including the chain covered by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Source changes add headers, apply TypeScript formatting and point the shared-ignore import to `./ignores.ts`.
The 537 source rule settings are unchanged and were verified with Oxlint `1.87.0`.
The preset builder merges them into both groups and replaces upstream file overrides.
Test files receive no exemptions. Shared generated-file ignores remain.
TypeScript and combined presets retain the local `**/*.gen.ts` alias allowance.

| Disabled native rule             | Reason                                       |
| -------------------------------- | -------------------------------------------- |
| `unicorn/prefer-bigint-literals` | Conflicts with Effect `no-bigint-literals`   |
| `preserve-caught-error`          | Conflicts with local `no-error-cause-option` |
| `prefer-const`                   | Duplicates part of local `no-let`            |

Both groups apply these changes, so preset order does not restore a conflict.
React, JavaScript-plugin, type-aware and formatter layers are not included.
Development formatting remains Vite Plus.

## Updates

Compare sources and tests against a fixed replacement revision.
Update source files, tests, notices and this record together.
Retain compiler compatibility, preset conflict checks and file/cache limits unless the change explicitly revises them.
