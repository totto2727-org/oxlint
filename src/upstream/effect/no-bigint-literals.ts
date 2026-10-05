// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import type { CreateRule, Visitor } from '@oxlint/plugins'

const rule: CreateRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow bigint literals' },
    fixable: 'code',
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'bigint') {
          const fixedSource = `BigInt("${node.value}")`
          context.report({
            node,
            message: 'BigInt literals are not allowed',
            fix: (fixer) => fixer.replaceText(node, fixedSource),
          })
        }
      },
    } as Visitor
  },
}

export default rule
