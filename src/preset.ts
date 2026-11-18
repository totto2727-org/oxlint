import { fileURLToPath } from 'node:url'

import type { OxlintConfig } from 'oxlint'

import { presetRuleNames } from './rule-names.ts'

// Effect v4 registers tests through these helpers. layer and describeWrapped only register suites.
const effectVitestTestBlocks = [
  ...['effect', 'live', 'it.effect', 'it.live'].flatMap((name) => [
    name,
    ...['skip', 'skipIf', 'runIf', 'only', 'each', 'fails', 'prop'].map((modifier) => `${name}.${modifier}`),
  ]),
  'prop',
  'it.prop',
]

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
    // Native Error ignores an `error` option. Use the standard `cause` to retain the original failure.
    'rules/no-error-cause-option': 'off',
    // A blanket ban also rejects deliberate imports from a package's public entry point.
    'rules/no-import-from-barrel-package': 'off',
    // Effect uses anonymous generators as callbacks, where a name adds no information.
    'func-names': ['error', 'as-needed', { generators: 'never' }],
    'id-length': ['error', { checkGeneric: false, properties: 'never' }],
    // Effect uses capitalized factories such as Schema.Struct and Context.Service without new.
    'new-cap': ['error', { capIsNew: false }],
    'no-magic-numbers': ['error', { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, ignoreDefaultValues: true }],
    // Bracket access and destructuring can read the tag without triggering no-underscore-dangle.
    'no-restricted-properties': [
      'error',
      { property: '_tag', message: 'Use a public predicate or matcher instead of accessing `_tag` directly.' },
    ],
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
    // Requiring deeply readonly parameters adds type wrappers or allowlists at external API boundaries.
    'typescript/prefer-readonly-parameter-types': 'off',
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
    // The custom rule recommends Effect Platform and reports Node.js imports without a default allowlist.
    'import/no-nodejs-modules': 'off',
    // Require the caught value as the cause when wrapping it in a native error.
    'eslint/preserve-caught-error': 'error',
    // Its automatic replacement, Date.now(), is forbidden by the custom Temporal policy.
    'unicorn/prefer-date-now': 'off',
    // The native rule expands truthiness into length comparisons that the custom Effect rule rejects.
    'unicorn/explicit-length-check': 'off',
    // Keep the Effect Predicate diagnostic rather than also suggesting a direct undefined comparison.
    'unicorn/no-typeof-undefined': 'off',
    // Namespace imports keep related APIs qualified without requiring per-package exceptions.
    'import/no-namespace': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['jsx', 'tsx'] }],
    // Allow JSX text. The default no-literals policy requires braces that jsx-curly-brace-presence removes.
    'react/jsx-no-literals': 'off',
    // The automatic JSX runtime does not need React in scope. Classic JSX can opt back in.
    'react/react-in-jsx-scope': 'off',
    // Vitest disables globals by default, so tests must be able to import its APIs explicitly.
    'vitest/no-importing-vitest-globals': 'off',
    // Assertions inside @effect/vitest test blocks are not standalone.
    'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: effectVitestTestBlocks }],
    // Use the dedicated called-once matchers instead of requiring an argument of 1.
    'vitest/prefer-called-times': 'off',
    // Keep exact boolean assertions. Falsy and truthy matchers would accept non-boolean values.
    'vitest/prefer-to-be-falsy': 'off',
    'vitest/prefer-to-be-truthy': 'off',
    // Assertion counts are useful when a callback might not run, not after direct assertions.
    'vitest/prefer-expect-assertions': ['error', { onlyFunctionsWithExpectInCallback: true }],
    // Keep setup local to tests rather than requiring hooks that vitest/no-hooks forbids.
    'vitest/require-hook': 'off',
    // Vitest already enforces a shared timeout. Only exceptional tests need their own value.
    'vitest/require-test-timeout': 'off',
  },
}

export default preset
