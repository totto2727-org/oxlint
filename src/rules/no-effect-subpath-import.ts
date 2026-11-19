import type { Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { hasProperty, isReportable } from '../helpers.ts'

const EFFECT_ECOSYSTEM_RE = /^@?effect(?:\/|$)/u

// Public category entry points in Effect 4's package.json exports, not individual modules under them.
const categoryEntries = new Set([
  'ai',
  'cli',
  'cluster',
  'devtools',
  'encoding',
  'eventlog',
  'http',
  'http-api',
  'net',
  'observability',
  'persistence',
  'process',
  'reactivity',
  'rpc',
  'schema',
  'socket',
  'sql',
  'testing',
  'workers',
  'workflow',
])

export const isAllowedEffectImport = (source: string): boolean => {
  if (source === 'effect' || (source.startsWith('effect/') && categoryEntries.has(source.slice('effect/'.length)))) {
    return true
  }
  // Effect documents this side-effect entry for enabling Schema JIT globally.
  if (source === 'effect/schema/SchemaJITCompiler/enable') {
    return true
  }
  if (/^@effect\/[^/]+$/u.test(source)) {
    return true
  }
  if (/^effect\/unstable\/[^/]+$/u.test(source)) {
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
