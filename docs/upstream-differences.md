# Upstream Oxlint source integrations

## Provenance

The five rules in `src/upstream/effect/` derive from [Effect-TS/effect's Oxlint sources](https://github.com/Effect-TS/effect/tree/b1d200c40a1dad69def51ebdbf0a1a612a12b8ac/packages/tools/oxc/src/oxlint/rules) at fixed revision `b1d200c40a1dad69def51ebdbf0a1a612a12b8ac`.
The upstream [MIT license](https://github.com/Effect-TS/effect/blob/b1d200c40a1dad69def51ebdbf0a1a612a12b8ac/LICENSE) is reproduced in [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md), including its original copyright holder.
The vendored files are `no-bigint-literals.ts`, `no-import-from-barrel-package.ts`, `no-js-extension-imports.ts`, `no-opaque-instance-fields.ts`, and `no-unused-internal.ts`.
Vendoring provides the rules independently of the private, unpublished upstream `@effect/oxc` package.
This is source integration into the local lint plugin, not deployment customization and not a modification to the upstream Effect runtime library.

## Stable runtime and tooling compatibility

The runtime dependency uses the stable Effect `^4.0.1` range, and development tooling uses Vite Plus `^1.0.0`.
Vite Plus task inputs and outputs are nested under `cache` as documented in its [run configuration](https://viteplus.dev/config/run), retaining [automatic input tracking](https://viteplus.dev/guide/automatic-data-tracking) and built-artifact restoration.
The fixed upstream source comparison revisions below are unchanged, and no upstream Effect runtime source is modified.

## Local source adjustments

- Add provenance/license headers and apply the local formatter, including single quotes, trailing commas, import ordering, and equivalent control-flow presentation.
- Import the stable TypeScript compiler API from `typescript-api`, an npm alias for TypeScript `6.0.3`, in `no-unused-internal` instead of upstream's `typescript` import.
  The local development compiler remains TypeScript `7.0.2`, whose package does not provide `createSourceFile`; the alias is a direct runtime dependency required by the vendored analyzer.
- Keep the upstream diagnostics, fixes, matching policy, filesystem resolution, source-discovery boundaries, and cache behavior.
- Register rules under the existing local `rules/` plugin namespace instead of requiring a separate upstream plugin.
- Adapt upstream examples to the actual Oxlint `RuleTester` with the local Vite+ test runner and TypeScript parsing, instead of upstream's mock visitor context.
  Cross-file tests create isolated workspaces under ignored `tmp/`, use a unique working directory per case to respect upstream caching, and remove only their own fixtures after the suite.

## Preset policy and duplicate handling

The Effect preset intentionally adopts upstream's module-oriented import policy.
Its `no-import-from-barrel-package` options match the Effect package barrels using `^effect$`, `^effect/(.+/)?[a-z][a-z0-9]*$`, `^@effect/[^/]+$`, and `^@effect/[^/]+/(.+/)?[a-z][a-z0-9]*$`, with `checkRelativeIndexImports: true`.
The rule itself defaults to no package patterns and enables relative index checking unless explicitly disabled.
It rejects named value imports from matched barrels and recommends namespace imports from specific modules, for example `import * as Effect from 'effect/Effect'`.
Type-only imports, default imports, side-effect-only imports, and re-exports are not rejected by this upstream rule.

The older `no-effect-subpath-import` and `no-effect-import-as` rules remain individually available but are excluded from the default preset.
This is an intentional change of policy, not equivalent replacement: those rules respectively required package-root imports and prohibited namespace/renamed imports, directly contradicting upstream's recommendation.
Do not combine the old root-only policy with the new module-oriented policy unless the consumer deliberately configures narrower, non-conflicting scopes.

The upstream `no-js-extension-imports` rule remains individually available but is not enabled alongside the configurable local `consistent-import-extension` rule.
Both report relative `.js` and `.jsx` static imports/re-exports, causing duplicate diagnostics; upstream's TypeScript fixes also conflict with local `mode: 'js'`.
They are not semantically identical or fully substitutable.
Upstream additionally converts relative `.mjs` to `.mts` and `.cjs` to `.cts`, while the local configurable rule only normalizes `.js`, `.jsx`, `.ts`, and `.tsx`.
The local rule additionally covers hash aliases, literal dynamic imports, preserved query/hash suffixes, and selectable JavaScript output mode.
Upstream ignores dynamic imports, hash aliases, and paths ending in query/hash suffixes.
The local `require-import-extension` reports missing extensions separately and never guesses an unsafe resolution fix.
The older combined `force-ts-extension` also remains available but is not enabled together with its split replacements.

## Retained upstream operational boundaries

`no-unused-internal` scans production `.ts` files under `<cwd>/packages/**/src/`, excluding declaration files and `dist`, `build`, and `node_modules` directories.
It does not discover standalone `src/`, this virtual workspace's singular `package/`, or `.tsx`/`.mts`/`.cts` files.
It performs syntactic analysis and its own workspace package/source resolution, rather than a full TypeScript project/type-checker resolution.
It caches analysis by working directory for the process lifetime, without filesystem invalidation, so a fresh linter process is required after changes in long-running integrations.
These constraints are retained from the comparison revision rather than silently broadened or fixed locally.

`no-import-from-barrel-package` resolves relative directory barrels using filesystem `index` files with supported code extensions, and recognizes explicit index paths without requiring the target to exist.
`no-opaque-instance-fields` recognizes imported Schema/Opaque bindings syntactically and reports non-static properties and methods, including constructors, in the upstream two-call `Schema.Opaque(...) (...)` shape.
It does not implement lexical binding/shadowing resolution beyond upstream's import-name tracking.

## Updating

Compare all five rules and their upstream tests against a fixed replacement revision before updating.
Keep the compiler alias, attribution, optional-rule coverage, policy conflicts, and retained filesystem/cache constraints synchronized with that comparison in the same change.

## Ultracite native configuration integration

Only the native core configuration and shared ignore patterns from Ultracite `7.12.3` are incorporated under `src/upstream/ultracite/` with MIT attribution.
The complete CLI npm package is not a runtime dependency.
A direct dependency trial introduced the unused CLI's `fast-glob`/`micromatch`/`braces` chain affected by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), with no patched dependency version available at review time.
The static native configuration does not require that code, so fixed source integration avoids distributing the unnecessary vulnerable dependency tree.
Its npm `gitHead` is `48156546701badf2c6e60f25cf1e8511f7dc44c7`; the [public core configuration](https://github.com/haydenbleasel/ultracite/blob/48156546701badf2c6e60f25cf1e8511f7dc44c7/packages/cli/config/oxlint/core/index.mjs) contains 537 native rule settings and is compatible with the current Oxlint `1.87.0`.
The local preset builder flattens this configuration into both custom-rule groups, replaces upstream overrides rather than inheriting test-specific or Astro exceptions, and removes the original monorepo's test-only custom relaxations.
It retains the existing generated alias exemption and upstream shared generated/output/cache ignores.
It disables `unicorn/prefer-bigint-literals` and `preserve-caught-error` to avoid opposite Effect recommendations, and `prefer-const` to avoid the subset overlap with `no-let`.
The adjustments are common to both groups so reversing their composition does not restore a conflict.
Optional React, JavaScript-plugin, type-aware and formatter configurations are not inherited.
Source adjustments are limited to provenance headers, TypeScript/local formatting and rewriting the shared-ignore import to `./ignores.ts`; core configuration values are unchanged before the documented preset adaptations.
Update both source files, their MIT notice, tests and this fixed revision together.
The package's development CLI and formatter remain Vite Plus with the existing formatter settings.
