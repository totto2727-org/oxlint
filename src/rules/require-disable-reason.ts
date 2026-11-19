import type { Rule } from '@oxlint/plugins'

const OXLINT_DISABLE_DIRECTIVE_RE = /\boxlint-disable\b/u
const DISABLE_REASON_RE = /\s--\s+\S/u

const isOxlintDisableDirective = (value: string): boolean => OXLINT_DISABLE_DIRECTIVE_RE.test(value)

const hasDisableReason = (value: string): boolean => DISABLE_REASON_RE.test(value)

const rule: Rule = {
  create(context) {
    return {
      'Program:exit'() {
        const comments = context.sourceCode.getAllComments()
        for (const comment of comments) {
          const { value } = comment
          if (isOxlintDisableDirective(value) && !hasDisableReason(value)) {
            context.report({
              message: 'oxlint-disable comments must include a reason in the form `<disable directive> -- <reason>`.',
              node: comment,
            })
          }
        }
      },
    }
  },
  meta: {
    type: 'problem',
  },
}

export { hasDisableReason, isOxlintDisableDirective, rule as requireDisableReason }
