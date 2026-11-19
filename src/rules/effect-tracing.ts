import type { ESTree, Rule } from '@oxlint/plugins'

import { isEffectMethod } from '../effect-method.ts'

const application = {
  fnUntraced:
    'Use `Effect.fn` in application code. If an untraced function is necessary on a performance-critical path, disable this rule on the call line and explain why.',
  fnUntracedEager:
    'Use `Effect.fn` in application code. If eager untraced execution is required, disable this rule on the call line and explain why.',
}

const librarySpan =
  'Leave span creation to the application. If this library must create a span, disable this rule on the call line and explain why.'
const library = {
  fn: 'Use `Effect.fnUntraced` in library code. If library tracing is required, disable this rule on the call line and explain why.',
  withSpan: librarySpan,
  withSpanScoped: librarySpan,
}

const rule: Rule = {
  create(context) {
    const { sourceCode } = context
    const mode = context.options[0]
    const policies = Object.entries(mode === 'application' ? application : mode === 'library' ? library : {})
    return {
      CallExpression(node: ESTree.CallExpression) {
        for (const [method, message] of policies) {
          if (isEffectMethod(sourceCode, node.callee, 'Effect', method)) {
            context.report({ message, node: node.callee })
            return
          }
        }
        const callback = node.arguments.length === 1 ? node.arguments[0] : node.arguments[1]
        if (callback?.type !== 'FunctionExpression' || !callback.generator || !callback.id) {
          return
        }
        if (isEffectMethod(sourceCode, node.callee, 'Effect', 'gen')) {
          context.report({
            message:
              mode === 'library'
                ? 'Keep the `Effect.gen` callback anonymous. Leave span creation to the application.'
                : 'Keep the `Effect.gen` callback anonymous. For a trace name, use `Effect.withSpan` on the returned effect.',
            node: callback.id,
          })
        }
      },
    }
  },
  meta: { schema: [{ type: 'string', enum: ['application', 'library'] }], type: 'suggestion' },
}

export default rule
