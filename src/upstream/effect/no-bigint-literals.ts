// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import type { CreateRule } from '@oxlint/plugins'
import { Predicate } from 'effect'

export const noBigintLiterals: CreateRule = {
  create(context) {
    return {
      Literal(node) {
        if (Predicate.isBigInt(node.value)) {
          const fixedSource = `BigInt("${node.value}")`
          context.report({
            fix: (fixer) => fixer.replaceText(node, fixedSource),
            message: 'BigInt literals are not allowed',
            node,
          })
        }
      },
    }
  },
  meta: {
    docs: { description: 'Disallow bigint literals' },
    fixable: 'code',
    type: 'problem',
  },
}
