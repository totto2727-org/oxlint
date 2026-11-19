import type { Rule } from '@oxlint/plugins'

import {
  createImportExtensionListeners,
  getImportExtensionMode,
  importExtensionSchema,
  normalizeImportExtension,
} from '#src/import-extensions.ts'

export const consistentImportExtension: Rule = {
  create(context) {
    const mode = getImportExtensionMode(context.options[0])
    return createImportExtensionListeners(
      context,
      (value) => normalizeImportExtension(value, mode),
      mode === 'js'
        ? 'Use JavaScript import extensions (.js, .mjs or .cjs) for code modules'
        : 'Use TypeScript import extensions (.ts, .tsx, .mts or .cts) for code modules',
    )
  },
  meta: {
    fixable: 'code',
    schema: importExtensionSchema,
    type: 'problem',
  },
}
