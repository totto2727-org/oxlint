import { fileURLToPath } from 'node:url'

import type { OxlintConfig } from 'oxlint'

import { effectRuleNames, typescriptRuleNames } from './rule-groups.ts'

type RuleName = (typeof typescriptRuleNames)[number] | (typeof effectRuleNames)[number]

const relaxedTestRules = new Set<RuleName>([
  'no-effect-runtime-run',
  'no-let',
  'no-node-imports',
  'no-sync-decode',
  'no-type-predicate',
  'prefer-is-nullish',
  'prefer-non-unknown-decode',
  'require-top-level-decoder',
])

export const createPreset = (names: readonly RuleName[]): OxlintConfig => ({
  jsPlugins: [fileURLToPath(new URL('./index.js', import.meta.url))],
  rules: Object.fromEntries(
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
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/_test-helper.{ts,tsx}'],
      rules: Object.fromEntries(
        names.filter((name) => relaxedTestRules.has(name)).map((name) => [`rules/${name}`, 'allow']),
      ),
    },
    ...(names.includes('no-redundant-alias')
      ? [
          {
            files: ['**/*.gen.ts'],
            rules: { 'rules/no-redundant-alias': 'allow' as const },
          },
        ]
      : []),
  ],
})
