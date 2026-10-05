import type { Rule } from '@oxlint/plugins'

import { createImportExtensionListeners, matchImportPath } from './force-ts-extension.ts'

const rule: Rule = {
  create: (context) =>
    createImportExtensionListeners(
      context,
      (value) => {
        const match = matchImportPath(value)
        // Resolution is intentionally not guessed: missing paths may be .tsx or directory indexes.
        return match !== null && (match.extension === '' || match.directory) ? value : null
      },
      'Use an explicit extension in relative and subpath imports',
    ),
  meta: {
    schema: [],
    type: 'problem',
  },
}

export default rule
