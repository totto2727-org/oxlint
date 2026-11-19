import type { Rule } from '@oxlint/plugins'

const exception = 'If a for loop is necessary, disable this rule on the loop line and explain why.'

const rule: Rule = {
  create({ report }) {
    return {
      ForInStatement(node) {
        report({
          message: `Use Object.keys or Object.entries for own properties instead of for...in. ${exception}`,
          node,
        })
      },
      ForOfStatement(node) {
        const guidance = node.await
          ? 'Use Stream.runForEach for asynchronous iteration instead of for await...of.'
          : 'Use Array or Iterable combinators, or Effect.forEach for effectful iteration, instead of for...of.'
        report({ message: `${guidance} ${exception}`, node })
      },
      ForStatement(node) {
        report({ message: `Use Array combinators or Effect.forEach instead of a classic for loop. ${exception}`, node })
      },
    }
  },
  meta: { type: 'suggestion' },
}

export { rule as noForLoops }
