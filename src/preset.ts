// oxlint-disable-next-line rules/no-node-imports -- Oxlint needs a native absolute filesystem path to load the installed plugin during config evaluation.
import { fileURLToPath } from 'node:url'

import type { OxlintConfig } from 'oxlint'

import { presetRuleNames } from './rule-names.ts'

// Effect v4 registers tests through these helpers. layer and describeWrapped only register suites.
const effectVitestTestBlocks = [
  ...['effect', 'live', 'it.effect', 'it.live'].flatMap((name) =>
    ['', '.skip', '.skipIf', '.runIf', '.only', '.each', '.fails', '.prop'].map((suffix) => `${name}${suffix}`),
  ),
  'prop',
  'it.prop',
]

const plugins: NonNullable<OxlintConfig['plugins']> = [
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
]

const testRule = 'require-vitest-hooks'

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
  jsPlugins: [fileURLToPath(new URL('plugin.js', import.meta.url))],
  options: { typeAware: true },
  overrides: [
    {
      // Scope the whole Vitest plugin so its category rules cannot run on application or type-only files.
      files: ['**/*.test.ts', '**/*.test.tsx'],
      plugins: ['vitest'],
      rules: {
        // Tests use literal inputs and expected values to make each case clear.
        'no-magic-numbers': 'off',
        [`rules/${testRule}`]: 'error',
        // Use the same Vitest test function inside and outside describe blocks.
        'vitest/consistent-test-it': ['error', { fn: 'test' }],
        // Shared setup and cleanup belong in hooks. Keep test data in test-local const bindings.
        'vitest/no-hooks': 'off',
        // Vitest disables globals by default, so tests must be able to import its APIs explicitly.
        'vitest/no-importing-vitest-globals': 'off',
        // Assertions inside @effect/vitest test blocks are not standalone.
        'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: effectVitestTestBlocks }],
        // Use the dedicated called-once matchers instead of requiring an argument of 1.
        'vitest/prefer-called-times': 'off',
        // Assertion counts are useful when a callback might not run, not after direct assertions.
        'vitest/prefer-expect-assertions': ['error', { onlyFunctionsWithExpectInCallback: true }],
        // Keep exact boolean assertions. Falsy and truthy matchers would accept non-boolean values.
        'vitest/prefer-to-be-falsy': 'off',
        'vitest/prefer-to-be-truthy': 'off',
        // Our rule also checks standalone state changes such as vi.stubEnv that the native rule misses.
        'vitest/require-hook': 'off',
        // Vitest already enforces a shared timeout. Only exceptional tests need their own value.
        'vitest/require-test-timeout': 'off',
      },
    },
  ],
  plugins,
  rules: {
    ...Object.fromEntries(
      presetRuleNames.filter((name) => name !== testRule).map((name) => [`rules/${name}`, 'error'] as const),
    ),
    // The custom rule rejects every let, including declarations that prefer-const can fix.
    'eslint/prefer-const': 'off',
    // Require the caught value as the cause when wrapping it in a native error.
    'eslint/preserve-caught-error': 'error',
    // TypeScript's require-await also recognizes directly returned promises.
    'eslint/require-await': 'off',
    // Effect uses anonymous generators as callbacks, where a name adds no information.
    'func-names': ['error', 'as-needed', { generators: 'never' }],
    'id-length': ['error', { checkGeneric: false, properties: 'never' }],
    // The custom no-local-export-list rule keeps named exports at their declarations.
    'import/exports-last': 'off',
    // The local extension rules also cover # aliases and support both source and emitted extensions.
    'import/extensions': 'off',
    // Grouping exports into a separate list conflicts with declaration-site exports.
    'import/group-exports': 'off',
    // The no-default-export rule enforces named exports instead of the opposite policy.
    'import/no-named-export': 'off',
    // Namespace imports keep related APIs qualified without requiring per-package exceptions.
    'import/no-namespace': 'off',
    // The custom rule recommends Effect Platform and reports Node.js imports without a default allowlist.
    'import/no-nodejs-modules': 'off',
    // Do not turn a lone named export into a default export that no-default-export rejects.
    'import/prefer-default-export': 'off',
    // Effect uses capitalized factories such as Schema.Struct and Context.Service without new.
    'new-cap': ['error', { capIsNew: false }],
    // The import/no-duplicates rule also detects imports that resolve to the same module.
    'no-duplicate-imports': 'off',
    'no-magic-numbers': ['error', { ignoreArrayIndexes: true, ignoreDefaultValues: true }],
    // The unicorn/prefer-ternary rule can require a conditional expression instead of an if/else.
    'no-ternary': 'off',
    // The unicorn/no-null rule replaces null with undefined. Keep explicit undefined available where it is required.
    'no-undefined': 'off',
    // The dedicated rule still bans direct tag access. Leave only its Effect-specific diagnostic for `_tag`.
    'no-underscore-dangle': ['error', { allow: ['_tag'] }],
    // Effect's synchronous interpreter is not Node.js synchronous I/O.
    'node/no-sync': ['error', { ignores: ['runSync'] }],
    // ESM supports awaiting asynchronous initialization at module scope.
    'node/no-top-level-await': 'off',
    'one-var': ['error', 'never'],
    // Keep async/await available for rules that require it, such as promise/prefer-await-to-then.
    'oxc/no-async-await': 'off',
    // Keep optional chaining available for typescript/prefer-optional-chain.
    'oxc/no-optional-chaining': 'off',
    // The eslint/prefer-object-spread rule recommends the syntax this rule bans.
    'oxc/no-rest-spread-properties': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['jsx', 'tsx'] }],
    // Allow JSX text. The default no-literals policy requires braces that jsx-curly-brace-presence removes.
    'react/jsx-no-literals': 'off',
    // The automatic JSX runtime does not need React in scope. Classic JSX can opt back in.
    'react/react-in-jsx-scope': 'off',
    // The formatter orders import declarations. Do not impose a separate member-order convention.
    'sort-imports': 'off',
    // Contextually typed callbacks already have return types at their boundaries.
    'typescript/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    // The custom no-for-loops rule uses combinators instead of converting indexed loops to for...of.
    'typescript/prefer-for-of': 'off',
    // This rule recommends the manual modifier that rules/no-readonly prohibits.
    'typescript/prefer-readonly': 'off',
    // Infer immutable data types from Effect Schema. Deep readonly parameter checks add wrappers at external boundaries.
    'typescript/prefer-readonly-parameter-types': 'off',
    // The native rule expands truthiness into length comparisons that the custom Effect rule rejects.
    'unicorn/explicit-length-check': 'off',
    // This rule recommends for...of instead of synchronous iteration combinators.
    'unicorn/no-array-for-each': 'off',
    // Oxlint treats the second arguments of Effect Array.forEach and Iterable.forEach as thisArg.
    'unicorn/no-array-method-this-argument': 'off',
    // Keep the Effect Predicate diagnostic rather than also suggesting a direct undefined comparison.
    'unicorn/no-typeof-undefined': 'off',
    // These rules suggest opposite syntax. Keep the Effect policy of using BigInt().
    'unicorn/prefer-bigint-literals': 'off',
    // Its automatic replacement, Date.now(), is forbidden by the custom Temporal policy.
    'unicorn/prefer-date-now': 'off',
  },
}

const modeRules = {
  application: { 'rules/effect-tracing': ['error', 'application'] },
  library: { 'rules/effect-tracing': ['error', 'library'] },
} satisfies Record<string, NonNullable<OxlintConfig['rules']>>

export const createPreset = (mode: keyof typeof modeRules): OxlintConfig => ({
  ...preset,
  rules: { ...preset.rules, ...modeRules[mode] },
})

// oxlint-disable-next-line import/no-default-export -- Oxlint consumers import the shared config as the package subpath's default export.
export default preset
