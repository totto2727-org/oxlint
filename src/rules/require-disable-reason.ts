import type { Rule } from '@oxlint/plugins'
import { Array } from 'effect'

const OXLINT_DISABLE_DIRECTIVE_RE = /\boxlint-disable\b/u
const DISABLE_REASON_RE = /\s--\s+\S/u

export const isOxlintDisableDirective = (value: string): boolean => OXLINT_DISABLE_DIRECTIVE_RE.test(value)

export const hasDisableReason = (value: string): boolean => DISABLE_REASON_RE.test(value)

export const requireDisableReason: Rule = {
  create(context) {
    return {
      'Program:exit'() {
        const comments = context.sourceCode.getAllComments()
        Array.forEach(comments, (comment) => {
          const { value } = comment
          if (isOxlintDisableDirective(value) && !hasDisableReason(value)) {
            context.report({
              message: 'oxlint-disable comments must include a reason in the form `<disable directive> -- <reason>`.',
              node: comment,
            })
          }
        })
      },
    }
  },
  meta: {
    type: 'problem',
  },
}
