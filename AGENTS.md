# @totto2727/oxlint

## Boundaries

- Keep README content for package users. Put maintenance instructions here.
- Do not merge PRs, publish packages or change credentials without an explicit user request.
- Keep temporary files under ignored `tmp/`. Do not commit them.
- Use `AGENTS.md`. Do not create `CLAUDE.md`.

## Files

| Path                                | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `src/index.ts`                      | Plugin and named exports                   |
| `src/rules/`                        | Local rules and RuleTester tests           |
| `src/upstream/`                     | Fixed Effect rules and Ultracite settings  |
| `src/rule-groups.ts`                | TypeScript, Effect and compatibility lists |
| `src/{preset,typescript,effect}.ts` | Preset exports                             |
| `vite.config.ts`                    | Formatting, lint, tests, build and tasks   |
| `package.json`                      | Dependencies, exports and package files    |
| `flake.nix`                         | Development shell                          |

## Tasks

Run commands from the repository root inside `nix develop`.

| Command                           | Result                                          |
| --------------------------------- | ----------------------------------------------- |
| `vp install --frozen-lockfile`    | Install locked dependencies                     |
| `vp run fix`                      | Format and apply supported lint fixes           |
| `vp run check`                    | Check formatting, lint and source types         |
| `vp run test`                     | Run tests                                       |
| `vp run build`                    | Build ESM files and declarations with `vp pack` |
| `vp run ci`                       | Run checks, tests, build and package inspection |
| `vp run --no-cache ci`            | Run CI without task caching                     |
| `vp run package`                  | Inspect package contents after build            |
| `npm pack --pack-destination tmp` | Create a consumer archive                       |

Create `tmp/` before packing an archive.
Validate workflows with `actionlint .github/workflows/ci.yml .github/workflows/publish.yml.disabled` when actionlint is available.
Do not enable publication to validate a workflow.

## Build and types

- Use Vite+ for formatting, lint, tests and packaging. Keep tasks in `vite.config.ts`.
- Keep `dist/` out of formatting and lint inputs.
- Track build inputs automatically, excluding `dist/**`. Keep `cache.output: ['dist/**']` for cache restoration.
- Package inspection depends on build. Do not bypass that dependency with `--parallel`.
- Keep no semicolons, single quotes, width 120 and unwrapped Markdown.
- Keep the strictest preset before node-ts in `tsconfig.json`.
- Use default TypeScript file discovery. Remove temporary TypeScript consumers before whole-project checks.
- Keep the global Nix CLI pin independent of the local Vite+ dependency.
- Export only a development shell from Nix. Do not add package or CLI outputs.
- Keep shared GitHub Actions on `@main` and use their existing Nix environment loading.

## Public API checks

The package is ESM-only.
Keep export conditions aligned with built files, with `types` before `import`.
For export changes, install a real archive into a consumer under `tmp/`.
Compile imports by package name with strict NodeNext resolution.
Check accepted and rejected calls, then run the built exports.
Source type checks alone do not validate the distributed declarations.
Keep required notices and the divergence record in the package's `files` list.

## Incorporated sources

Read [upstream differences](./docs/upstream-differences.md) before changing incorporated code.
Update sources, tests, MIT notices and comparison revisions together.
Keep the stable `typescript-api` dependency separate from the development compiler.
Do not combine the official Effect import policy with its conflicting local compatibility rules.
Keep the duplicate official extension rule off in presets.
Preserve native settings, plugins, environment and shared ignores from Ultracite.
Exclude upstream file overrides, including test exemptions.
Keep the three native conflict adjustments common to both preset groups.
Do not add React, JavaScript-plugin, type-aware or formatter layers implicitly.
Validate both preset orders with an installed archive after preset changes.

## Publication

Keep publication aligned with the library template and its shared `publish-npm@main` action.
Do not add custom triggers, version checks or direct publication commands.
The owner controls workflow enablement, registry linking and permissions.
Do not change `.github/workflows/publish.yml.disabled` without an explicit request.

## References

- [Vite+ tasks](https://viteplus.dev/config/run) and [input tracking](https://viteplus.dev/guide/automatic-data-tracking)
- [Vite+ packaging](https://viteplus.dev/guide/pack)
- [Shared publication action](https://github.com/totto2727-org/monorepo/blob/main/.github/actions/publish-npm/action.yaml)
