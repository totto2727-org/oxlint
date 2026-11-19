import type { Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { hasProperty, isReportable } from '../helpers.ts'

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

const rule: Rule = {
  create(context) {
    return {
      ImportDeclaration(node: unknown) {
        if (!isReportable(node)) {
          return
        }
        if (!Predicate.isObject(node)) {
          return
        }
        if (!hasProperty(node, 'source')) {
          return
        }
        const { source } = node
        if (!Predicate.isObject(source)) {
          return
        }
        if (!hasProperty(source, 'value')) {
          return
        }
        if (!Predicate.isString(source.value)) {
          return
        }
        if (!EFFECT_ECOSYSTEM_RE.test(source.value)) {
          return
        }
        if (isAllowedEffectImport(source.value)) {
          return
        }
        context.report({
          message: `Import from \`${findEntry(source.value) ?? 'a public Effect package entry'}\` instead of \`${source.value}\`.`,
          node,
        })
      },
    }
  },
  meta: {
    type: 'problem',
  },
}

export default rule
