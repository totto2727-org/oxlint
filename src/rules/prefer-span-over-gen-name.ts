import type { ESTree, Rule } from '@oxlint/plugins'

import { isEffectMethod } from '../effect-method.ts'

const rule: Rule = {
  create(context) {
    const { sourceCode } = context
    return {
      CallExpression(node: ESTree.CallExpression) {
        const callback = node.arguments.length === 1 ? node.arguments[0] : node.arguments[1]
        if (callback?.type !== 'FunctionExpression' || !callback.generator || !callback.id) {
          return
        }
        if (!isEffectMethod(sourceCode, node.callee, 'Effect', 'gen')) {
          return
        }
        context.report({
          message:
            'Keep the `Effect.gen` callback anonymous. For a trace name, use `Effect.withSpan` on the returned effect.',
          node: callback.id,
        })
      },
    }
  },
  meta: { type: 'suggestion' },
}

export default rule
