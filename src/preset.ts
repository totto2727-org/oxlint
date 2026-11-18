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
    // Effect uses anonymous generators as callbacks, where a name adds no information.
    'func-names': ['error', 'as-needed', { generators: 'never' }],
    'id-length': ['error', { checkGeneric: false, properties: 'never' }],
    // Effect uses capitalized factories such as Schema.Struct and Context.Service without new.
    'new-cap': ['error', { capIsNew: false }],
    'no-magic-numbers': ['error', { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, ignoreDefaultValues: true }],
    // Effect exposes _tag on discriminated unions, and the custom rule still governs Option tags.
    'no-underscore-dangle': ['error', { allow: ['_tag'] }],
    // A standalone void documents an intentionally unawaited promise.
    'no-void': ['error', { allowAsStatement: true }],
    // Effect's synchronous interpreter is not Node.js synchronous I/O.
    'node/no-sync': ['error', { ignores: ['runSync'] }],
    'one-var': ['error', 'never'],
    // Allow formatters to sort import declarations by module path. Still validate named member ordering.
    'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
    // Contextually typed callbacks already have return types at their boundaries.
    'typescript/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    // Avoid flagging inferred callback types and service methods merely for being callable.
    'typescript/prefer-readonly-parameter-types': [
      'error',
      { ignoreInferredTypes: true, treatMethodsAsReadonly: true },
    ],
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
    // TypeScript's require-await also recognizes directly returned promises.
    'eslint/require-await': 'off',
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
    'react/jsx-filename-extension': ['error', { extensions: ['jsx', 'tsx'] }],
    // Allow JSX text. The default no-literals policy requires braces that jsx-curly-brace-presence removes.
    'react/jsx-no-literals': 'off',
    // The automatic JSX runtime does not need React in scope. Classic JSX can opt back in.
    'react/react-in-jsx-scope': 'off',
    // Vitest disables globals by default, so tests must be able to import its APIs explicitly.
    'vitest/no-importing-vitest-globals': 'off',
    // @effect/vitest runs assertions inside it.effect test blocks.
    'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['it.effect'] }],
    // Use the dedicated called-once matchers instead of requiring an argument of 1.
    'vitest/prefer-called-times': 'off',
    // Assertion counts are useful when a callback might not run, not after direct assertions.
    'vitest/prefer-expect-assertions': ['error', { onlyFunctionsWithExpectInCallback: true }],
    // Keep setup local to tests rather than requiring hooks that vitest/no-hooks forbids.
    'vitest/require-hook': 'off',
    // Vitest already enforces a shared timeout. Only exceptional tests need their own value.
    'vitest/require-test-timeout': 'off',
  },
}

export default preset
