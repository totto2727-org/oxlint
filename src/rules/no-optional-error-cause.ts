import type { ESTree, Rule } from '@oxlint/plugins'

import { fieldName, isEffectMethod } from '../effect-method.ts'

const rule: Rule = {
  create(context) {
    const { sourceCode } = context
    const report = (node: ESTree.Node) =>
      context.report({
        message:
          'Make `cause` required when wrapping another failure. Use a separate tagged error for failures without a cause.',
        node,
      })
    const checkClass = (node: ESTree.Class) => {
      const base = node.superClass
      if (base?.type !== 'CallExpression') {
        return
      }
      if (isEffectMethod(sourceCode, base.callee, 'Data', 'TaggedError')) {
        const fields = node.superTypeArguments?.params[0]
        if (fields?.type === 'TSTypeLiteral') {
          for (const member of fields.members) {
            if (
              member.type === 'TSPropertySignature' &&
              member.optional &&
              !member.computed &&
              fieldName(member.key) === 'cause'
            ) {
              report(member)
            }
          }
        }
      }
      if (
        base.callee.type !== 'CallExpression' ||
        !(
          isEffectMethod(sourceCode, base.callee.callee, 'Schema', 'TaggedErrorClass') ||
          isEffectMethod(sourceCode, base.callee.callee, 'Schema', 'TaggedError')
        )
      ) {
        return
      }
      const fields = base.arguments[1]
      if (fields?.type === 'ObjectExpression') {
        for (const field of fields.properties) {
          if (
            field.type === 'Property' &&
            !field.computed &&
            fieldName(field.key) === 'cause' &&
            field.value.type === 'CallExpression' &&
            (isEffectMethod(sourceCode, field.value.callee, 'Schema', 'optional') ||
              isEffectMethod(sourceCode, field.value.callee, 'Schema', 'optionalKey'))
          ) {
            report(field)
          }
        }
      }
    }
    return { ClassDeclaration: checkClass, ClassExpression: checkClass }
  },
  meta: { type: 'problem' },
}

export default rule
