import { fileURLToPath } from 'node:url'

import type { OxlintConfig } from 'oxlint'

import { presetRuleNames } from './rule-names.ts'

const preset: OxlintConfig = {
  categories: {
    correctness: 'error',
    nursery: 'error',
    pedantic: 'error',
    perf: 'error',
    restriction: 'error',
    style: 'error',
    suspicious: 'error',
  },
  jsPlugins: [fileURLToPath(new URL('./index.js', import.meta.url))],
  options: { typeAware: true },
  // The standard stack uses React and Vitest, not Next.js, Vue or Jest.
  plugins: [
    'eslint',
    'import',
    'jsdoc',
    'jsx-a11y',
    'node',
    'oxc',
    'promise',
    'react',
    'react-perf',
    'typescript',
    'unicorn',
    'vitest',
  ],
  rules: {
    ...Object.fromEntries(presetRuleNames.map((name) => [`rules/${name}`, 'error'] as const)),
    'rules/no-node-imports': ['error', { allow: ['child_process', 'crypto', 'os', 'util'] }],
    'rules/no-import-from-barrel-package': [
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
    ],
    'one-var': ['error', 'never'],
    // import/no-duplicates also detects imports that resolve to the same module.
    'no-duplicate-imports': 'off',
    // unicorn/prefer-ternary can require a conditional expression instead of an if/else.
    'no-ternary': 'off',
    // unicorn/no-null replaces null with undefined. Keep explicit undefined available where it is required.
    'no-undefined': 'off',
    // no-default-export enforces named exports instead of the opposite policy.
    'import/no-named-export': 'off',
    // Do not turn a lone named export into a default export that no-default-export rejects.
    'import/prefer-default-export': 'off',
    // Keep async/await available for rules that require it, such as promise/prefer-await-to-then.
    'oxc/no-async-await': 'off',
    // Keep optional chaining available for typescript/prefer-optional-chain.
    'oxc/no-optional-chaining': 'off',
    // eslint/prefer-object-spread recommends the syntax this rule bans.
    'oxc/no-rest-spread-properties': 'off',
    // The custom rule rejects every let, including declarations that prefer-const can fix.
    'eslint/prefer-const': 'off',
    // The local extension rules also cover # aliases and support both source and emitted extensions.
    'import/extensions': 'off',
    // These rules suggest opposite syntax. Keep the Effect policy of using BigInt().
    'unicorn/prefer-bigint-literals': 'off',
    // The custom Effect rule provides platform guidance and a configurable allowlist.
    'import/no-nodejs-modules': 'off',
    // Effect errors preserve the original failure in an error field, not native Error.cause.
    'eslint/preserve-caught-error': 'off',
    // Its automatic replacement, Date.now(), is forbidden by the custom Temporal policy.
    'unicorn/prefer-date-now': 'off',
    // The native rule expands truthiness into length comparisons that the custom Effect rule rejects.
    'unicorn/explicit-length-check': 'off',
    // Keep the Effect Predicate diagnostic rather than also suggesting a direct undefined comparison.
    'unicorn/no-typeof-undefined': 'off',
    // Effect modules use namespace imports, e.g. import * as Schema from 'effect/Schema'.
    'import/no-namespace': ['error', { ignore: ['effect/**', '@effect/**'] }],
  },
}

export default preset
