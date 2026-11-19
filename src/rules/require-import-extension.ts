import type { Rule } from '@oxlint/plugins'
import { Predicate, String } from 'effect'

import { createImportExtensionListeners, matchImportPath } from '#src/import-extensions.ts'

const rule: Rule = {
  create: (context) =>
    createImportExtensionListeners(
      context,
      (value) => {
        const match = matchImportPath(value)
        // Resolution is intentionally not guessed: missing paths may be .tsx or directory indexes.
        return Predicate.isNotNullish(match) && (String.isEmpty(match.extension) || match.directory) ? value : undefined
      },
      'Use an explicit extension in relative and subpath imports',
    ),
  meta: {
    schema: [],
    type: 'problem',
  },
}

export { rule as requireImportExtension }
