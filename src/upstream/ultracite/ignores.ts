// Vendored from Ultracite 7.12.3 at 48156546701badf2c6e60f25cf1e8511f7dc44c7.
// MIT, Copyright (c) 2022 to Present Hayden Bleasel. See THIRD-PARTY-NOTICES.md.
/**
 * Canonical ignore patterns shared across all linters and formatters.
 *
 * This file is the single source of truth. The prebuild script syncs these
 * patterns into biome/core's files.includes (as `!!`-prefixed globs). Other
 * tools (oxlint, oxfmt, eslint) import this module directly.
 */
export const ignorePatterns = [
  // Dependencies / VCS
  // oxlint only skips node_modules when a .gitignore lists it, so without
  // this entry `ultracite fix` rewrites installed packages in projects
  // that have no .gitignore (see issue #737).
  '**/node_modules',
  '**/.git',
  // Build / framework output
  '**/dist',
  '**/build',
  '**/out',
  '**/.next',
  '**/.open-next',
  '**/.nuxt',
  '**/.output',
  '**/.svelte-kit',
  '**/.vitepress/cache',
  '**/.vitepress/dist',
  '**/.turbo',
  '**/.vercel',
  '**/.netlify',
  '**/.wrangler',
  '**/.wrangler-dry-run',
  '**/.alchemy',
  '**/.docusaurus',
  '**/.cache',
  '**/.parcel-cache',
  '**/.vite',
  '**/.astro',
  '**/_astro',
  '**/public/build',
  '**/storybook-static',
  // Generated code
  '**/_generated',
  '**/*.gen.*',
  '**/*.generated.*',
  '**/*.auto.*',
  '**/generated',
  '**/auto-generated',
  '**/codegen',
  '**/__generated__',
  '**/graphql-types.*',
  '**/schema.d.ts',
  '**/schema.graphql.d.ts',
  '**/*.d.ts.map',
  '**/.yarn',
  // Test coverage
  '**/coverage',
  '**/.nyc_output',
  // Mobile
  '**/.expo',
  '**/.expo-shared',
  '**/android/build',
  '**/ios/build',
  '**/DerivedData/**/*',
  // Lock files
  '**/bun.lock',
  '**/bun.lockb',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  // Framework type definitions
  '**/next-env.d.ts',
  '**/worker-configuration.d.ts',
]
