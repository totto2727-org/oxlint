# template-vite-plus-lib initialization

## Template files

| File                                     | Meaning                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `README.md`                              | AI initialization entry point.                                                                      |
| `AGENTS.md`                              | Template file map and initialization steps, replaced during initialization.                         |
| `README_TEMPLATE.md`                     | Consumer library README to customize and promote to README.md.                                      |
| `AGENTS_TEMPLATE.md`                     | Developer guidance to customize and promote to AGENTS.md.                                           |
| `src/index.ts`                           | Public library exports.                                                                             |
| `src/greet.ts`                           | Sample library function to replace.                                                                 |
| `src/greet.test.ts`                      | Tests through the public library entry point.                                                       |
| `package.json`                           | Private-by-default package identity, ESM exports, declarations, dependencies, and package contents. |
| `pnpm-lock.yaml`                         | Locked JavaScript dependencies.                                                                     |
| `vite.config.ts`                         | Vite+ formatter, linter, tests, declaration packaging, and aggregate tasks.                         |
| `tsconfig.json`                          | Strictest and node-ts presets with minimal library source-checking overrides.                       |
| `flake.nix`                              | Development shells only, with Node.js, Vite+, Bun, and nixfmt.                                      |
| `flake.lock`                             | Pinned Nix inputs.                                                                                  |
| `.envrc`                                 | Optional direnv entry point.                                                                        |
| `.github/workflows/ci.yml`               | Pre-merge checks, tests, library packaging, and npm contents validation.                            |
| `.github/workflows/publish.yml.disabled` | Disabled repository-linked npm OIDC publication.                                                    |
| `.gitignore`                             | Local dependencies, generated output, archives, and temporary files excluded from Git.              |
| `LICENSE`                                | License and copyright holder to review.                                                             |

## Initialization

### 1. Establish the project and environment

Work from the copied repository root.
Use the user's intended repository, package name, purpose, license, and publication target.
Ask for missing registry ownership decisions rather than inventing credentials or publishing permissions.
Enter `nix develop`, then run `vp install --frozen-lockfile`.
Review `.envrc` before explicitly allowing direnv.
CI uses `setup-nix@main`, then `setup-typescript@main`, and loads the shell in its run step with `eval "$(nix print-dev-env "$GITHUB_WORKSPACE#default")"`.
Keep all `totto2727-org/monorepo` action references on `@main`.

### 2. Replace the library and metadata

Replace the name, version, description, repository URL, and license in `package.json`, the flake description, and the license holder.
Replace the greeting implementation and tests with the requested library.
Keep public exports in `src/index.ts`, and align `exports`, `types`, and `files` with the generated files.
Keep `private: true` until the user explicitly configures publication.
Retain Vite+ for both formatting and linting, with all existing formatter settings including `semi: false`, single quotes, print width 120, and preserved Markdown wrapping.
Do not add `CLAUDE.md`, `package.nix`, Nix package/CLI overlay outputs, CLI entry points, or Nix build CI.

Use `vp pack` to build the library with `pack.dts: true`, or `vp run build` for the cache-aware task.
The [official build guide](https://viteplus.dev/guide/build) says `vp build` always invokes Vite's production build, even when a build script exists.
The [official pack guide](https://viteplus.dev/guide/pack) specifies `vp pack` for libraries and built-in declaration generation.
Vite library mode can bundle JavaScript through `vp build`, but declarations require additional tooling.
This template deliberately uses the smaller native `vp pack` configuration instead of a declaration plugin or custom build hook.

### 3. Create the project's documentation

Customize `README_TEMPLATE.md` around consumer usage, prerequisites, dependency installation, and every public export.
Its local archive setup is usable before registry publication. Replace it with the actual npm dependency installation command only when that package exists.
Do not add a CLI installation matrix or developer build commands to the consumer README.
Customize `AGENTS_TEMPLATE.md` around the actual paths, tasks, library boundaries, and publication constraints.
Remove obsolete placeholder content and initialization guidance from the final project documents.
Replace `README.md` and `AGENTS.md` with the customized `README_TEMPLATE.md` and `AGENTS_TEMPLATE.md`, then remove the two `_TEMPLATE.md` files.
Keep their share-artifact provenance footers.

### 4. Configure optional npm publication

Keep `.github/workflows/publish.yml.disabled` disabled until the package owner completes registry linking.
Keep `private: true` unless npm publication is explicitly wanted.

1. Set the real package name, version, and repository URL, and ensure the npm package exists under an account or organization the user controls. If npm requires an initial authenticated publication before trusted-publisher settings exist, the package owner must perform it manually.
2. Configure the package's npm Trusted Publisher with the exact GitHub owner, repository, and workflow filename `publish.yml`. Enable direct publication, not staged-only publishing. If an npm trusted-publisher environment is configured, add the matching protected environment to the workflow job.
3. Review the [npm trusted publishing requirements](https://docs.npmjs.com/trusted-publishers/) and current shared [publish-npm action](https://github.com/totto2727-org/monorepo/blob/main/.github/actions/publish-npm/action.yaml). It runs `bun publish` after skipping versions already on the registry. The pinned development shell supplies Bun. Keep job-scoped `id-token: write`, the GitHub-hosted runner, and `working-directory: .`. Do not add long-lived npm tokens.
4. Review third-party action pins and protect release tags. Remove `private: true` only when ready, then rename `publish.yml.disabled` to `publish.yml`. Delete the disabled workflow instead if publication is not wanted.
5. Run pre-merge validation and review a real packed consumer before tagging. Push a protected `v<version>` tag that matches `package.json` only from a validated commit. The workflow installs locked dependencies, runs `vp pack`, and calls `totto2727-org/monorepo/.github/actions/publish-npm@main`. Do not duplicate CI checks, tests, or dry runs in the publish workflow. Use a new version for changed contents.

### 5. Validate and hand off

Run `vp run fix` and `vp run ci`.
The aggregate task runs `check`, `test`, and `build` concurrently, with `package` running `npm pack --dry-run` only after `build` completes.
All tasks, including `fix`, use Vite+ default caching.
The build task excludes `dist/**` from automatic inputs and restores `dist/**` outputs on cache hits.
Keep `dist/` ignored by the formatter and linter.
TypeScript uses default file discovery, which can include built declarations.
Use `vp run --no-cache ci` when a fresh execution is needed.
No task starts an application or builds a Nix package.
Inspect `dist/index.js` and `dist/index.d.ts`, then run `npm pack --pack-destination tmp` after creating `tmp/`.
Install that archive into an isolated consumer under `tmp/`, compile an ESM TypeScript import by package name with strict NodeNext resolution, and execute the exported function.
Check positive return types and rejected invalid arguments, not just declaration-file existence.
Keep temporary consumers and archives under ignored `tmp/` and out of commits.
Remove temporary TypeScript consumers before whole-project checks, because TypeScript discovery does not honor `.gitignore`.
Update `pnpm-lock.yaml` when dependencies change and `flake.lock` when Nix inputs change.
Validate both the active CI workflow and disabled publication file with actionlint without enabling publication.
Review final documents for obsolete placeholders and links before committing.
