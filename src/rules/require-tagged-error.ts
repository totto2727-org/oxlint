import type { ESTree, Rule, SourceCode } from '@oxlint/plugins'
import { Array, Predicate } from 'effect'

import { findBinding, isEffectMethod } from '#src/effect-method.ts'

const nativeErrors = new Set([
  'AggregateError',
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SuppressedError',
  'SyntaxError',
  'TypeError',
  'URIError',
])

const globalObjects = new Set(['globalThis', 'global', 'window', 'self'])

const isGlobalName = (source: SourceCode, node: ESTree.IdentifierReference): boolean =>
  Array.isReadonlyArrayEmpty(findBinding(source.getScope(node), node.name)?.defs ?? [])

const isNativeError = (source: SourceCode, expression: ESTree.Expression): boolean => {
  if (expression.type === 'Identifier') {
    return nativeErrors.has(expression.name) && isGlobalName(source, expression)
  }
  if (expression.type !== 'MemberExpression' || expression.object.type !== 'Identifier') {
    return false
  }
  const { object, property, computed } = expression
  if (!globalObjects.has(object.name) || !isGlobalName(source, object)) {
    return false
  }
  return computed
    ? property.type === 'Literal' && Predicate.isString(property.value) && nativeErrors.has(property.value)
    : property.type === 'Identifier' && nativeErrors.has(property.name)
}

const rule: Rule = {
  create(context) {
    const check = (expression: ESTree.Expression): void => {
      if (
        isNativeError(context.sourceCode, expression) ||
        isEffectMethod(context.sourceCode, expression, { module: 'Data', name: 'Error' })
      ) {
        context.report({
          message:
            'Define application errors with Data.TaggedError or Schema.TaggedError instead of an untagged error constructor.',
          node: expression,
        })
      }
    }
    const checkClass = (node: ESTree.Class): void => {
      if (Predicate.isNotNullish(node.superClass) && node.declare !== true) {
        check(node.superClass)
      }
    }
    return {
      CallExpression(node) {
        check(node.callee)
      },
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
      NewExpression(node) {
        check(node.callee)
      },
    }
  },
  meta: { type: 'problem' },
}

export { rule as requireTaggedError }
