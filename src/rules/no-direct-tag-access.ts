import type { ESTree, Rule } from '@oxlint/plugins'

import { isTagKey } from '#src/tag-key.ts'

export const noDirectTagAccess: Rule = {
  create(context) {
    const report = (node: ESTree.Node): void => {
      context.report({
        message:
          'Do not access `_tag` directly. Use `Option.isSome`/`isNone`, `Result.isSuccess`/`isFailure`, or `Exit.isSuccess`/`isFailure` for those types. Use `Match.tag` or `Match.tagsExhaustive` for tagged domain values.',
        node,
      })
    }
    return {
      BinaryExpression(node) {
        if (node.operator === 'in' && isTagKey(node.left, true)) {
          report(node.left)
        }
      },
      MemberExpression(node) {
        if (isTagKey(node.property, node.computed)) {
          report(node.property)
        }
      },
      Property(node) {
        if (node.parent.type === 'ObjectPattern' && isTagKey(node.key, node.computed)) {
          report(node.key)
        }
      },
    }
  },
  meta: { type: 'problem' },
}
