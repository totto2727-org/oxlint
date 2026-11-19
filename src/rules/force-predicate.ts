import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isEqualityOperator, isReportable } from '#src/helpers.ts'

const typeofToPredicateMap: Record<string, string> = {
  bigint: 'Predicate.isBigInt',
  boolean: 'Predicate.isBoolean',
  function: 'Predicate.isFunction',
  number: 'Predicate.isNumber',
  object: 'Predicate.isObject',
  string: 'Predicate.isString',
  symbol: 'Predicate.isSymbol',
  undefined: 'Predicate.isUndefined',
}

const isNullLiteral = (node: unknown): boolean =>
  Predicate.isObject(node) && node['type'] === 'Literal' && Predicate.isNullish(node['value'])

const isUndefinedIdentifier = (node: unknown): boolean =>
  Predicate.isObject(node) && node['type'] === 'Identifier' && node['name'] === 'undefined'

const getNullishSide = (node: unknown): 'null' | 'undefined' | undefined => {
  if (isNullLiteral(node)) {
    return 'null'
  }
  if (isUndefinedIdentifier(node)) {
    return 'undefined'
  }
  return undefined
}

const getTypeofType = (node: unknown): 'typeof' | undefined => {
  if (Predicate.isObject(node) && node['type'] === 'UnaryExpression' && node['operator'] === 'typeof') {
    return 'typeof'
  }
  return undefined
}

const getStringValue = (node: unknown): string | undefined => {
  if (Predicate.isObject(node) && node['type'] === 'Literal' && Predicate.isString(node['value'])) {
    return node['value']
  }
  return undefined
}

const resolveTypeStr = (left: unknown, right: unknown): string | undefined => {
  if (Predicate.isNotNullish(getTypeofType(left))) {
    return getStringValue(right)
  }
  if (Predicate.isNotNullish(getTypeofType(right))) {
    return getStringValue(left)
  }
  return undefined
}

const comparisonMessage = (left: unknown, right: unknown): string | undefined => {
  const kind = getNullishSide(left) ?? getNullishSide(right)
  if (Predicate.isNotNullish(kind)) {
    const predicate = kind === 'null' ? 'Predicate.isNull' : 'Predicate.isUndefined'
    return `Use ${predicate}() instead of direct ${kind} comparison`
  }
  const type = resolveTypeStr(left, right)
  const predicate = Predicate.isNullish(type) ? undefined : typeofToPredicateMap[type]
  return Predicate.isNullish(predicate) ? undefined : `Use ${predicate}() instead of typeof comparison`
}

const rule: Rule = {
  create(context: Context) {
    return {
      BinaryExpression(node: unknown) {
        if (!isReportable(node) || !isEqualityOperator(node['operator'])) {
          return
        }
        const message = comparisonMessage(node['left'], node['right'])
        if (Predicate.isString(message)) {
          context.report({ message, node })
        }
      },
    }
  },
  meta: {
    type: 'problem',
  },
}

export { getNullishSide, getStringValue, getTypeofType, rule as forcePredicate }
