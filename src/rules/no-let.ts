import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isReportable } from '#src/helpers.ts'

export const isLetDeclaration = (node: unknown): boolean => Predicate.isObject(node) && node['kind'] === 'let'

export const noLet: Rule = {
  create(context: Context) {
    return {
      VariableDeclaration(node: unknown) {
        if (!isReportable(node)) {
          return
        }
        if (isLetDeclaration(node)) {
          context.report({
            message: 'Use const with shadowing instead of let. Reassignment via let is prohibited.',
            node,
          })
        }
      },
    }
  },
  meta: {
    type: 'problem',
  },
}
