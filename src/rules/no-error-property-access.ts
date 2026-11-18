import type { ESTree, Rule, SourceCode } from '@oxlint/plugins'
import { Array } from 'effect'

import { fieldName, findBinding, isEffectMethod } from '../effect-method.ts'

const isEffectCatch = (source: SourceCode, node: ESTree.Node, name: string): boolean => {
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') {
    return false
  }
  const [parameter] = node.params
  if (parameter?.type !== 'Identifier' || parameter.name !== name) {
    return false
  }
  const property = node.parent
  if (property.type !== 'Property' || property.computed || fieldName(property.key) !== 'catch') {
    return false
  }
  const options = property.parent
  if (options.type !== 'ObjectExpression' || options.parent.type !== 'CallExpression') {
    return false
  }
  const { callee } = options.parent
  return isEffectMethod(source, callee, 'Effect', 'try') || isEffectMethod(source, callee, 'Effect', 'tryPromise')
}

const rule: Rule = {
  create(context) {
    const { sourceCode } = context
    return {
      MemberExpression(node) {
        const { object } = node
        if (object.type !== 'Identifier') {
          return
        }
        const binding = findBinding(sourceCode.getScope(object), object.name)
        if (
          Array.some(
            binding?.defs ?? [],
            (definition) =>
              definition.type === 'CatchClause' ||
              (definition.type === 'Parameter' && isEffectCatch(sourceCode, definition.node, object.name)),
          )
        ) {
          context.report({
            message: 'Do not read properties of an untyped caught value. Preserve it as the cause of a tagged error.',
            node,
          })
        }
      },
    }
  },
  meta: { type: 'problem' },
}

export default rule
