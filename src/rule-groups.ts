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
  'no-effect-runtime-run',
  'no-bigint-literals',
  'no-import-from-barrel-package',
  'no-opaque-instance-fields',
  'no-unused-internal',
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

// Retained opt-in rules are not enabled with their replacements or policies
// that conflict with the official Effect import convention.
export const compatibilityRuleNames = [
  'force-ts-extension',
  'no-effect-import-as',
  'no-effect-subpath-import',
  'no-js-extension-imports',
] as const
