import type { ESTree, Rule, Visitor } from '@oxlint/plugins'

import { isTagKey } from '../tag-key.ts'

const rule: Rule = {
  create(context): Visitor {
    const check = (key: ESTree.Node, computed: boolean): void => {
      if (isTagKey(key, computed)) {
        context.report({
          node: key,
          message:
            'Do not define `_tag` by hand. Use Effect tagged constructors such as `Data.TaggedClass`, `Data.taggedEnum`, `Schema.TaggedClass`, `Schema.TaggedStruct`, or the tagged error APIs.',
        })
      }
    }
    const checkMember = (node: ESTree.Node): void => {
      if ('key' in node && 'computed' in node) {
        check(node.key, node.computed)
      }
    }
    return {
      Property(node) {
        if (node.parent.type === 'ObjectExpression') {
          checkMember(node)
        }
      },
      PropertyDefinition: checkMember,
      MethodDefinition: checkMember,
      AccessorProperty: checkMember,
      TSAbstractPropertyDefinition: checkMember,
      TSAbstractMethodDefinition: checkMember,
      TSAbstractAccessorProperty: checkMember,
      TSPropertySignature: checkMember,
      TSMethodSignature: checkMember,
      TSParameterProperty({ parameter }) {
        check(parameter.type === 'AssignmentPattern' ? parameter.left : parameter, false)
      },
    }
  },
  meta: { type: 'problem' },
}

export default rule
