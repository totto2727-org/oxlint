import { fileURLToPath } from 'node:url'

import { generateIgnorePatterns } from '@totto2727/gitignore-patterns'
import type { OxlintConfig } from 'oxlint'
import { defineConfig } from 'vite-plus'

import libraryPreset from './src/library.ts'

const ignorePatterns = await generateIgnorePatterns(new URL('.', import.meta.url))

// Existing findings in this package only. Remove each entry after fixing its findings.
const migrationRules = [
  'eslint/capitalized-comments',
  'eslint/complexity',
  'eslint/curly',
  'eslint/func-style',
  'id-length',
  'eslint/init-declarations',
  'eslint/max-lines',
  'eslint/max-lines-per-function',
  'eslint/max-params',
  'eslint/max-statements',
  'eslint/no-continue',
  'no-magic-numbers',
  'eslint/no-nested-ternary',
  'eslint/no-template-curly-in-string',
  'eslint/no-use-before-define',
  'eslint/prefer-destructuring',
  'eslint/prefer-named-capture-group',
  'eslint/require-unicode-regexp',
  'eslint/sort-keys',
  'import/exports-last',
  'import/group-exports',
  'import/max-dependencies',
  'import/no-default-export',
  'import/no-relative-parent-imports',
  'jsdoc/require-param',
  'jsdoc/require-returns',
  'node/no-sync',
  'node/no-top-level-await',
  'oxc/no-map-spread',
  'rules/force-array-empty',
  'rules/force-predicate',
  'rules/force-string-empty',
  'rules/no-import-from-barrel-package',
  'rules/no-let',
  'rules/no-node-imports',
  'rules/no-readonly',
  'rules/prefer-is-nullish',
  'typescript/array-type',
  'typescript/explicit-function-return-type',
  'typescript/no-confusing-void-expression',
  'typescript/no-unnecessary-condition',
  'typescript/no-unnecessary-type-assertion',
  'typescript/no-unsafe-assignment',
  'typescript/no-unsafe-type-assertion',
  'typescript/prefer-optional-chain',
  'typescript/strict-boolean-expressions',
  'typescript/switch-exhaustiveness-check',
  'unicorn/import-style',
  'unicorn/no-array-callback-reference',
  'unicorn/no-array-for-each',
  'unicorn/no-array-method-this-argument',
  'unicorn/no-array-sort',
  'unicorn/no-lonely-if',
  'unicorn/no-nested-ternary',
  'unicorn/no-null',
  'unicorn/prefer-string-raw',
  'unicorn/prefer-string-replace-all',
  'unicorn/relative-url-style',
  'unicorn/switch-case-braces',
]

const testMigrationRules = [
  'rules/require-vitest-hooks',
  'vitest/consistent-test-it',
  'vitest/max-expects',
  'vitest/no-conditional-in-test',
  'vitest/prefer-describe-function-title',
  'vitest/prefer-lowercase-title',
  'vitest/prefer-strict-equal',
  'vitest/prefer-to-be',
  'vitest/require-top-level-describe',
]

type RuleMap = NonNullable<OxlintConfig['rules']>

const asWarnings = (names: string[], rules: OxlintConfig['rules']): RuleMap =>
  Object.fromEntries<RuleMap[string]>(
    names.map((name) => {
      const rule = rules?.[name]
      return [name, Array.isArray(rule) ? ['warn', ...rule.slice(1)] : 'warn']
    }),
  )

export default defineConfig({
  fmt: {
    arrowParens: 'always',
    experimentalSortImports: {
      ignoreCase: true,
      newlinesBetween: true,
      order: 'asc',
    },
    experimentalSortPackageJson: true,
    ignorePatterns,
    jsxSingleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    semi: false,
    singleQuote: true,
  },
  lint: {
    ...libraryPreset,
    env: { node: true },
    ignorePatterns,
    jsPlugins: [fileURLToPath(new URL('./dist/plugin.js', import.meta.url))],
    options: { ...libraryPreset.options, typeCheck: true },
    rules: { ...libraryPreset.rules, ...asWarnings(migrationRules, libraryPreset.rules) },
    overrides:
      libraryPreset.overrides?.map((override) => ({
        ...override,
        rules: { ...override.rules, ...asWarnings(testMigrationRules, override.rules) },
      })) ?? [],
  },
  pack: {
    clean: true,
    dts: true,
    entry: ['src/plugin.ts', 'src/preset.ts', 'src/application.ts', 'src/library.ts'],
    format: ['esm'],
    platform: 'neutral',
  },
  run: {
    tasks: {
      build: {
        cache: {
          input: [{ auto: true }, '!dist/**'],
          output: ['dist/**'],
        },
        command: 'vp pack',
      },
      check: {
        command: 'vp check',
        dependsOn: ['build'],
      },
      ci: {
        command: '',
        dependsOn: ['check', 'test', 'package'],
      },
      fix: {
        command: 'vp fmt',
      },
      package: {
        command: 'npm pack --dry-run',
        dependsOn: ['build'],
      },
      test: {
        command: 'vp test run',
      },
    },
  },
  test: { include: ['src/**/*.test.ts'], setupFiles: ['./src/__fixtures__/rule-tester-setup.ts'] },
})
