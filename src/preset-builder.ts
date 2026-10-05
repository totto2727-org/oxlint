import { fileURLToPath } from 'node:url'

import type { OxlintConfig } from 'oxlint'

import { effectRuleNames, typescriptRuleNames } from './rule-groups.ts'
import ultraciteCore from './upstream/ultracite/core.ts'

type RuleName = (typeof typescriptRuleNames)[number] | (typeof effectRuleNames)[number]

export const createPreset = (names: readonly RuleName[]): OxlintConfig => ({
  ...ultraciteCore,
  jsPlugins: [fileURLToPath(new URL('./index.js', import.meta.url))],
  rules: {
    ...ultraciteCore.rules,
    // Keep either group composition order compatible with Effect's no-bigint-literals.
    'unicorn/prefer-bigint-literals': 'off',
    // Effect errors use { error }, not the native Error.cause convention.
    'preserve-caught-error': 'off',
    // The custom no-let policy is broader and should report the declaration only once.
    'prefer-const': 'off',
    ...Object.fromEntries(
      names.map((name) => [
        `rules/${name}`,
        name === 'no-node-imports'
          ? ['error', { allow: ['child_process', 'crypto', 'os', 'util'] }]
          : name === 'no-import-from-barrel-package'
            ? [
                'error',
                {
                  checkPatterns: [
                    '^effect$',
                    '^effect/(.+/)?[a-z][a-z0-9]*$',
                    '^@effect/[^/]+$',
                    '^@effect/[^/]+/(.+/)?[a-z][a-z0-9]*$',
                  ],
                  checkRelativeIndexImports: true,
                },
              ]
            : 'error',
      ]),
    ),
  },
  overrides: names.includes('no-redundant-alias')
    ? [
        {
          files: ['**/*.gen.ts'],
          rules: { 'rules/no-redundant-alias': 'allow' as const },
        },
      ]
    : [],
})
