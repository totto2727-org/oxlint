import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isReportable, isSchemaMethodCall } from '#src/helpers.ts'

const BANNED_DECODE_METHODS: Record<string, string> = {
  decodePromise: 'decodeEffect',
  decodeSync: 'decodeEffect',
  decodeUnknownPromise: 'decodeUnknownEffect',
  decodeUnknownSync: 'decodeUnknownEffect',
}

export const isSchemaBannedDecodeCall = (node: unknown): string | undefined =>
  Object.keys(BANNED_DECODE_METHODS).find((method) => isSchemaMethodCall(node, method))

export const noSyncDecode: Rule = {
  create(context: Context) {
    return {
      CallExpression(node: unknown) {
        if (!isReportable(node)) {
          return
        }
        const method = isSchemaBannedDecodeCall(node)
        if (Predicate.isNotNullish(method)) {
          const recommended = BANNED_DECODE_METHODS[method]
          context.report({
            message: `Use Schema.${recommended} or Schema.decodeExit instead of Schema.${method}.`,
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
