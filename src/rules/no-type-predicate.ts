import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isReportable } from '#src/helpers.ts'

const NO_TYPE_PREDICATE_MESSAGE =
  'Do not use TypeScript type predicate annotations (`value is Type`). Model the value with Effect Schema and use `Schema.is(...)` instead.'

export const isTypePredicateAnnotation = (node: unknown): boolean =>
  Predicate.isObject(node) && node['type'] === 'TSTypePredicate'

export const noTypePredicate: Rule = {
  create(context: Context) {
    return {
      TSTypePredicate(node: unknown) {
        if (!isReportable(node) || !isTypePredicateAnnotation(node)) {
          return
        }
        context.report({ message: NO_TYPE_PREDICATE_MESSAGE, node })
      },
    }
  },
  meta: {
    type: 'problem',
  },
}
