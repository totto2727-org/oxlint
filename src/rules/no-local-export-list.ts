import type { Rule } from '@oxlint/plugins'
import { Array, Predicate } from 'effect'

export const noLocalExportList: Rule = {
  create({ report }) {
    return {
      ExportNamedDeclaration(node) {
        if (Predicate.isNotNullish(node.source) || Array.isReadonlyArrayEmpty(node.specifiers)) {
          return
        }
        report({
          message:
            'Export local bindings at their declarations. For bindings from another module, use `export { … } from`. If a separate export list is required, disable this rule on that line and explain why.',
          node,
        })
      },
    }
  },
  meta: { type: 'suggestion' },
}
