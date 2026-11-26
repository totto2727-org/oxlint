import { consistentImportExtension } from './rules/consistent-import-extension.ts'
import { effectTracing } from './rules/effect-tracing.ts'
import { forceArrayEmpty } from './rules/force-array-empty.ts'
import { forceIterableEmpty } from './rules/force-iterable-empty.ts'
import { forcePredicate } from './rules/force-predicate.ts'
import { forceStringEmpty } from './rules/force-string-empty.ts'
import { functionStyle } from './rules/function-style.ts'
import { noDirectTagAccess } from './rules/no-direct-tag-access.ts'
import { noEffectImportAs } from './rules/no-effect-import-as.ts'
import { noEffectRuntimeRun } from './rules/no-effect-runtime-run.ts'
// oxlint-disable-next-line import/max-dependencies -- The plugin entry must register every rule; a barrel would only hide these dependencies.
import { noEffectSubpathImport } from './rules/no-effect-subpath-import.ts'
import { noErrorPropertyAccess } from './rules/no-error-property-access.ts'
import { noEslintDisableComments } from './rules/no-eslint-disable-comments.ts'
import { noFetch } from './rules/no-fetch.ts'
import { noForLoops } from './rules/no-for-loops.ts'
import { noIndexFilename } from './rules/no-index-filename.ts'
import { noInstanceofError } from './rules/no-instanceof-error.ts'
import { noJsDate } from './rules/no-js-date.ts'
import { noJsxScriptTag } from './rules/no-jsx-script-tag.ts'
import { noLet } from './rules/no-let.ts'
import { noLocalExportList } from './rules/no-local-export-list.ts'
import { noNodeImports } from './rules/no-node-imports.ts'
import { noOptionalErrorCause } from './rules/no-optional-error-cause.ts'
import { noReadonly } from './rules/no-readonly.ts'
import { noRedundantAlias } from './rules/no-redundant-alias.ts'
import { noStringStyle } from './rules/no-string-style.ts'
import { noSyncDecode } from './rules/no-sync-decode.ts'
import { noTypePredicate } from './rules/no-type-predicate.ts'
import { preferIsNullish } from './rules/prefer-is-nullish.ts'
import { preferNonUnknownDecode } from './rules/prefer-non-unknown-decode.ts'
import { preferSchemaFormatValidation } from './rules/prefer-schema-format-validation.ts'
import { requireDisableReason } from './rules/require-disable-reason.ts'
import { requireImportExtension } from './rules/require-import-extension.ts'
import { requireTaggedData } from './rules/require-tagged-data.ts'
import { requireTaggedError } from './rules/require-tagged-error.ts'
import { requireTopLevelDecoder } from './rules/require-top-level-decoder.ts'
import { requireVitestHooks } from './rules/require-vitest-hooks.ts'
import { noBigintLiterals } from './upstream/effect/no-bigint-literals.ts'
import { noImportFromBarrelPackage } from './upstream/effect/no-import-from-barrel-package.ts'
import { noOpaqueInstanceFields } from './upstream/effect/no-opaque-instance-fields.ts'
import { noUnusedInternal } from './upstream/effect/no-unused-internal.ts'

const plugin = {
  meta: { name: 'rules' },
  rules: {
    'consistent-import-extension': consistentImportExtension,
    'effect-tracing': effectTracing,
    'force-array-empty': forceArrayEmpty,
    'force-iterable-empty': forceIterableEmpty,
    'force-predicate': forcePredicate,
    'force-string-empty': forceStringEmpty,
    'function-style': functionStyle,
    'no-bigint-literals': noBigintLiterals,
    'no-direct-tag-access': noDirectTagAccess,
    'no-effect-import-as': noEffectImportAs,
    'no-effect-runtime-run': noEffectRuntimeRun,
    'no-effect-subpath-import': noEffectSubpathImport,
    'no-error-property-access': noErrorPropertyAccess,
    'no-eslint-disable-comments': noEslintDisableComments,
    'no-fetch': noFetch,
    'no-for-loops': noForLoops,
    'no-import-from-barrel-package': noImportFromBarrelPackage,
    'no-index-filename': noIndexFilename,
    'no-instanceof-error': noInstanceofError,
    'no-js-date': noJsDate,
    'no-jsx-script-tag': noJsxScriptTag,
    'no-let': noLet,
    'no-local-export-list': noLocalExportList,
    'no-node-imports': noNodeImports,
    'no-opaque-instance-fields': noOpaqueInstanceFields,
    'no-optional-error-cause': noOptionalErrorCause,
    'no-readonly': noReadonly,
    'no-redundant-alias': noRedundantAlias,
    'no-string-style': noStringStyle,
    'no-sync-decode': noSyncDecode,
    'no-type-predicate': noTypePredicate,
    'no-unused-internal': noUnusedInternal,
    'prefer-is-nullish': preferIsNullish,
    'prefer-non-unknown-decode': preferNonUnknownDecode,
    'prefer-schema-format-validation': preferSchemaFormatValidation,
    'require-disable-reason': requireDisableReason,
    'require-import-extension': requireImportExtension,
    'require-tagged-data': requireTaggedData,
    'require-tagged-error': requireTaggedError,
    'require-top-level-decoder': requireTopLevelDecoder,
    'require-vitest-hooks': requireVitestHooks,
  },
}

export { compatibilityRuleNames, presetRuleNames } from './rule-names.ts'
// oxlint-disable-next-line import/no-default-export -- Oxlint reads the plugin object from this module's default export.
export default plugin
