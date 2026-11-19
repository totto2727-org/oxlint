import type { ESTree, Rule, SourceCode } from '@oxlint/plugins'

import { fieldName, findBinding, isEffectMethod } from '#src/effect-method.ts'

const isEffectCatchProperty = (source: SourceCode, property: ESTree.Node): boolean => {
  if (property.type !== 'Property' || property.computed || fieldName(property.key) !== 'catch') {
    return false
  }
  const options = property.parent
  if (options.type !== 'ObjectExpression' || options.parent.type !== 'CallExpression') {
    return false
  }
  const { callee } = options.parent
  return (
    isEffectMethod(source, callee, { module: 'Effect', name: 'try' }) ||
    isEffectMethod(source, callee, { module: 'Effect', name: 'tryPromise' })
  )
}

const isEffectCatch = (source: SourceCode, node: ESTree.Node, name: string): boolean => {
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') {
    return false
  }
  const [parameter] = node.params
  return parameter?.type === 'Identifier' && parameter.name === name && isEffectCatchProperty(source, node.parent)
}

export const noErrorPropertyAccess: Rule = {
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
          binding?.defs.some(
            (definition) =>
              definition.type === 'CatchClause' ||
              (definition.type === 'Parameter' && isEffectCatch(sourceCode, definition.node, object.name)),
          ) === true
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
