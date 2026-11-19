import type { Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { hasProperty, isReportable } from '../helpers.ts'

const EFFECT_ECOSYSTEM_RE = /^@?effect(?:\/|$)/u

const CATEGORY_ENTRY_RE = /^effect\/(?:unstable\/)?[^A-Z/][^/]*$/u

export const isAllowedEffectImport = (source: string): boolean => {
  if (source === 'effect' || CATEGORY_ENTRY_RE.test(source)) {
    return true
  }
  // Effect documents this side-effect entry for enabling Schema JIT globally.
  if (source === 'effect/schema/SchemaJITCompiler/enable') {
    return true
  }
  if (/^@effect\/[^/]+$/u.test(source)) {
    return true
  }
  return false
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
          message:
            'Import from the Effect package root or a public category entry, not an individual module (for example, use `effect/http` instead of `effect/http/HttpClient`).',
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
