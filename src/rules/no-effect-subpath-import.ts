import type { Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { getImportSource, isReportable } from '#src/helpers.ts'

const EFFECT_ECOSYSTEM_RE = /^@?effect(?:\/|$)/u

const PACKAGE_ENTRY_RE = /^(?<entry>effect|@effect\/[^/]+)(?:\/|$)/u
const CATEGORY_ENTRY_RE = /^(?<entry>effect\/(?:unstable\/|(?!unstable\/))[^A-Z/][^/]*)(?:\/|$)/u

const findEntry = (source: string): string | undefined =>
  CATEGORY_ENTRY_RE.exec(source)?.groups?.['entry'] ?? PACKAGE_ENTRY_RE.exec(source)?.groups?.['entry']

export const isAllowedEffectImport = (source: string): boolean => {
  // Effect documents this side-effect entry for enabling Schema JIT globally.
  if (source === 'effect/schema/SchemaJITCompiler/enable') {
    return true
  }
  return findEntry(source) === source
}

export const noEffectSubpathImport: Rule = {
  create(context) {
    return {
      ImportDeclaration(node: unknown) {
        if (!isReportable(node)) {
          return
        }
        const source = getImportSource(node)
        if (!Predicate.isString(source) || !EFFECT_ECOSYSTEM_RE.test(source) || isAllowedEffectImport(source)) {
          return
        }
        context.report({
          message: `Import from \`${findEntry(source) ?? 'a public Effect package entry'}\` instead of \`${source}\`.`,
          node,
        })
      },
    }
  },
  meta: {
    type: 'problem',
  },
}
