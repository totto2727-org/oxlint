export const typescriptRuleNames = [
  'consistent-import-extension',
  'no-eslint-disable-comments',
  'no-jsx-script-tag',
  'no-let',
  'no-redundant-alias',
  'no-string-style',
  'require-disable-reason',
  'require-import-extension',
] as const

export const effectRuleNames = [
  'force-array-empty',
  'force-iterable-empty',
  'force-predicate',
  'force-string-empty',
  'no-effect-import-as',
  'no-effect-runtime-run',
  'no-effect-subpath-import',
  'no-error-cause-option',
  'no-error-property-access',
  'no-fetch',
  'no-instanceof-error',
  'no-js-date',
  'no-node-imports',
  'no-option-tag-comparison',
  'no-raw-hono-create-middleware',
  'no-sync-decode',
  'no-type-predicate',
  'prefer-is-nullish',
  'prefer-non-unknown-decode',
  'require-top-level-decoder',
] as const

// The legacy combined extension rule remains available, but is not enabled
// alongside its replacement rules to avoid duplicate reports.
export const compatibilityRuleNames = ['force-ts-extension'] as const
