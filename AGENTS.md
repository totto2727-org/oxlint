# @totto2727/oxlint

## Repository structure

```text
src/index.ts        Public library entry point
src/index.test.ts   Public-entry-point tests
src/rules/          Rules and colocated Oxlint RuleTester tests
src/rule-groups.ts  TypeScript and Effect classification
src/{preset,typescript,effect}.ts  Built preset entry points
vite.config.ts      Vite+ formatter, linter, tests, packaging, and tasks
package.json        Package identity and runtime/type export map
flake.nix           Development shells only
.github/workflows/  CI and tag-triggered npm publication
```

## Development commands

### Execution rules

- Run commands from the repository root inside `nix develop`.
- Use Vite+ for both formatting and linting, source type checks, tests, and library packaging.
- Keep temporary consumers and package archives under ignored `tmp/` and out of commits.
- Keep `AGENTS.md` canonical without creating `CLAUDE.md`.

### Standard tasks

- `nix develop`: Enter the pinned development environment.
- `vp install --frozen-lockfile`: Install locked development dependencies.
- `vp run fix`: Apply Vite+ formatting and supported lint fixes with `vp check --fix`.
- `vp run check`: Verify formatting, lint rules, and inherited strictest source types through the cached `vp check` task.
- `vp run test`: Run tests through Vite+ once with task caching.
- `vp run build`: Build the ESM library and TypeScript declarations with `vp pack`, restoring `dist/**` on cache hits.
- `vp run ci`: Run check, test, and build in parallel, followed by package contents validation after build.
- `vp run --no-cache ci`: Execute the same task graph without caching when fresh validation is needed.
- `vp run package`: Build or restore the library, then inspect npm package contents without publishing.
- `npm pack --dry-run`: Inspect package contents after `vp pack` without publishing.
- `npm pack --pack-destination tmp`: Create a real consumer archive after creating `tmp/` and running `vp pack`.
- `actionlint .github/workflows/ci.yml .github/workflows/publish.yml`: Validate both workflow definitions. Supply actionlint separately when needed.

## Architecture

### Public library boundary

- Export the consumer API from `src/index.ts` and test that public entry point.
- Keep `package.json` export conditions aligned with `dist/index.js` and `dist/index.d.ts`, with `types` before `import`.
- This package is ESM-only. Do not imply CommonJS support without adding and validating that output.
- `vp check` checks source types, but does not prove declarations reach consumers. For export changes, install a real npm archive into an isolated consumer under `tmp/`, compile imports by package name with strict NodeNext resolution, check rejected invalid calls, and execute the built exports.

## Development tools

- **Vite+**: Both formatter and linter use the configuration in `vite.config.ts` through `vp check`. Tests use `vite-plus/test`. `vp pack` delegates library builds and declaration generation to tsdown. `vp build` invokes Vite production builds and does not natively emit declarations, so the cache-aware `build` task invokes `vp pack` without a declaration plugin.
- **Task caching**: Vite+ configuration tasks, including `fix`, cache by default. The `ci` dependency graph allows check, test, and build to run concurrently and orders package inspection after build. Build inputs use automatic tracking except `dist/**`. Explicit `cache.output: ["dist/**"]` restores JavaScript and declarations on cache hits. Vite+ automatically declines to cache a `fix` run that reads and rewrites the same input, while unchanged runs can hit cache. Keep `dist/` ignored by the formatter and linter. TypeScript default discovery can include built declarations. Do not use `--parallel` to bypass package inspection's build dependency.
- **TypeScript**: `tsconfig.json` extends exact presets `@tsconfig/strictest` 2.0.8, then `@tsconfig/node-ts` 23.6.4. It retains strictness including `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`, and inherits import-extension rewriting, erasable syntax, and verbatim module syntax. Rewriting enables TypeScript import extensions without a duplicate local flag. Local options are only ESNext, NodeNext, no-emit source checks, and Node types. NodeNext module resolution is inferred from the module setting. Use default TypeScript file discovery without local include/exclude lists. Remove temporary TypeScript consumers before whole-project checks because discovery does not honor `.gitignore`.
- **Nix flakes**: Pin the development shell only. The external Vite+ input overlay installs tooling, not a package/CLI overlay exported by this library. The global CLI and local vite-plus dependency are pinned independently. Bun is present for the shared npm publication action.
- **GitHub Actions**: CI runs `setup-nix@main`, then `setup-typescript@main` with `--frozen-lockfile`, loads the environment with `eval "$(nix print-dev-env "$GITHUB_WORKSPACE#default")"`, and runs `vp run ci`. Keep shared `totto2727-org/monorepo` actions on `@main`.

## Package-specific rules

- Keep all existing formatter defaults, including no semicolons, single quotes, print width 120, and preserved Markdown wrapping.
- Keep `files: ["dist", "THIRD-PARTY-NOTICES.md", "docs/upstream-differences.md"]` aligned with generated outputs and required attribution. Update `pnpm-lock.yaml` when dependencies change and `flake.lock` when Nix inputs change.
- Do not introduce `package.nix`, Nix package or CLI overlay outputs, CLI installation routes, or Nix build CI.
- Keep README usage consumer-focused, document all public exports, and use only supported dependency installation paths. Do not claim npm availability before the package exists.
- The tag-triggered `publish.yml` workflow is enabled at the user's request. Before creating a release tag, the package owner must complete the first publication and configure npm trusted publishing for GitHub owner `totto2727-org`, repository `oxlint`, and workflow filename `publish.yml`. No GitHub environment is configured for the publication job. Permit direct publishing, not staged-only publishing.
- Review package metadata, third-party action pins, protected release tags, and a real packed consumer before each release. Use a protected `v<version>` tag matching the manifest from a validated commit. Do not claim registry linking or publication is complete until verified.
- Retain job-scoped `id-token: write` and a GitHub-hosted runner. Do not add long-lived registry tokens. The publish workflow installs locked dependencies, runs `vp pack`, verifies the release tag matches the manifest version, and runs `npm publish --provenance --access public`. It must not duplicate pre-merge checks, tests, or dry runs.
- The shared `publish-npm@main` action currently uses `vp pm stage publish`, which stages rather than completes publication. This repository deliberately publishes directly to meet the automatic release requirement. Use a new version for changed contents.

## Upstream Effect rules

- `src/upstream/effect/` incorporates the five official Effect Oxc rules at the revision documented in [upstream differences](./docs/upstream-differences.md).
- Update source, tests, MIT notices, revision metadata, and the divergence record together. Keep upstream semantics unless a documented compatibility adaptation is necessary.
- The unpublished `@effect/oxc` package cannot be used as a normal registry dependency. Keep the stable compiler API dependency alias independent of Vite Plus's TypeScript CLI.
- Never enable both the official module-import policy and the opposite legacy root-import policies. Keep overlapping extension rules opt-in and test the combined preset with a real Oxlint consumer.

## Ultracite native baseline

- Keep `src/upstream/ultracite/{core,ignores}.ts` aligned with the fixed official version and its MIT notice. Update source, tests, provenance and source revision together. Do not add the full Ultracite CLI dependency tree merely to load static configuration.
- Keep upstream file-specific overrides out of the public presets, including test-only relaxations. Preserve ordinary native rule settings, plugins, environment and shared ignores.
- Keep the three documented conflict/deduplication adjustments common to both groups so either composition order remains valid.
- Do not implicitly adopt optional React, JavaScript-plugin, type-aware or Oxfmt layers. Updates must validate the current Oxlint version with real packed consumers, both group orders and identical ordinary/test-file policy.

## Task-specific documentation

- When changing task dependencies or cache inputs/outputs: [Vite+ run configuration](https://viteplus.dev/config/run) and [automatic tracking](https://viteplus.dev/guide/automatic-data-tracking).
- When changing library packaging or declarations: [Vite+ pack guide](https://viteplus.dev/guide/pack).
- When comparing Vite production builds with library packaging: [Vite+ build guide](https://viteplus.dev/guide/build).
- When enabling registry publication: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [shared publish-npm action](https://github.com/totto2727-org/monorepo/blob/main/.github/actions/publish-npm/action.yaml).

_This AGENTS.md was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [AGENTS template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/agents/template.md)._
