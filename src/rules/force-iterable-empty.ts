import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isReportable } from '#src/helpers.ts'

import { classifySizeComparison } from './force-array-empty.ts'

const isIterableSizeCall = (node: unknown): boolean =>
  Predicate.isObject(node) &&
  node['type'] === 'CallExpression' &&
  Predicate.isObject(node['callee']) &&
  node['callee']['type'] === 'MemberExpression' &&
  node['callee']['computed'] !== true &&
  Predicate.isObject(node['callee']['object']) &&
  node['callee']['object']['type'] === 'Identifier' &&
  node['callee']['object']['name'] === 'Iterable' &&
  Predicate.isObject(node['callee']['property']) &&
  node['callee']['property']['type'] === 'Identifier' &&
  node['callee']['property']['name'] === 'size'

const rule: Rule = {
  create(context: Context) {
    return {
      BinaryExpression(node: unknown) {
        if (!isReportable(node)) {
          return
        }
        const kind = classifySizeComparison(node, isIterableSizeCall)
        if (Predicate.isNullish(kind)) {
          return
        }
        const message =
          kind === 'empty'
            ? 'Use Iterable.isEmpty() instead of Iterable.size() === 0 comparison'
            : 'Use !Iterable.isEmpty() instead of Iterable.size() comparison'
        context.report({
          message,
          node,
        })
      },
    }
  },
  meta: {
    type: 'problem',
  },
}

export { isIterableSizeCall, rule as forceIterableEmpty }
