import type { ESTree, Rule } from '@oxlint/plugins'

import { isTagKey } from '../tag-key.ts'

const rule: Rule = {
  create(context) {
    const report = (node: ESTree.Node): void => {
      context.report({
        node,
        message:
          'Do not access `_tag` directly. Use `Option.isSome`/`isNone`, `Result.isSuccess`/`isFailure`, or `Exit.isSuccess`/`isFailure` for those types. Use `Match.tag` or `Match.tagsExhaustive` for tagged domain values.',
      })
    }
    return {
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
      BinaryExpression(node) {
        if (node.operator === 'in' && isTagKey(node.left, true)) {
          report(node.left)
        }
      },
    }
  },
  meta: { type: 'problem' },
}

export default rule
