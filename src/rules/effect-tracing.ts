import type { ESTree, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isEffectMethod } from '#src/effect-method.ts'

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

export const effectTracing: Rule = {
  create(context) {
    const { sourceCode } = context
    const [mode] = context.options
    const policies = mode === 'application' ? Object.entries(application) : []
    const activePolicies = mode === 'library' ? Object.entries(library) : policies
    return {
      CallExpression(node: ESTree.CallExpression) {
        const policy = activePolicies.find(([method]) =>
          isEffectMethod(sourceCode, node.callee, { module: 'Effect', name: method }),
        )
        if (Predicate.isNotNullish(policy)) {
          const [, message] = policy
          context.report({ message, node: node.callee })
          return
        }
        const [generator, boundGenerator] = node.arguments
        const callback = boundGenerator ?? generator
        if (
          callback?.type === 'FunctionExpression' &&
          callback.generator &&
          callback.id &&
          isEffectMethod(sourceCode, node.callee, { module: 'Effect', name: 'gen' })
        ) {
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
  meta: { schema: [{ enum: ['application', 'library'], type: 'string' }], type: 'suggestion' },
}
