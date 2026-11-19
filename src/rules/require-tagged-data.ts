import type { ESTree, Rule, Visitor } from '@oxlint/plugins'

import { isTagKey } from '#src/tag-key.ts'

const rule: Rule = {
  create(context): Visitor {
    const check = (key: ESTree.Node, computed: boolean): void => {
      if (isTagKey(key, computed)) {
        context.report({
          message:
            'Do not define `_tag` by hand. Use Effect tagged constructors such as `Data.TaggedClass`, `Data.taggedEnum`, `Schema.TaggedClass`, `Schema.TaggedStruct`, or the tagged error APIs.',
          node: key,
        })
      }
    }
    const checkMember = (node: ESTree.Node): void => {
      if ('key' in node && 'computed' in node) {
        check(node.key, node.computed)
      }
    }
    return {
      AccessorProperty: checkMember,
      MethodDefinition: checkMember,
      Property(node) {
        if (node.parent.type === 'ObjectExpression') {
          checkMember(node)
        }
      },
      PropertyDefinition: checkMember,
      TSAbstractAccessorProperty: checkMember,
      TSAbstractMethodDefinition: checkMember,
      TSAbstractPropertyDefinition: checkMember,
      TSMethodSignature: checkMember,
      TSParameterProperty({ parameter }) {
        check(parameter.type === 'AssignmentPattern' ? parameter.left : parameter, false)
      },
      TSPropertySignature: checkMember,
    }
  },
  meta: { type: 'problem' },
}

export { rule as requireTaggedData }
