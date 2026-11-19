import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { getLiteralNumber, isReportable } from '#src/helpers.ts'

const isLengthMember = (node: unknown): boolean =>
  Predicate.isObject(node) &&
  node['type'] === 'MemberExpression' &&
  node['computed'] !== true &&
  Predicate.isObject(node['property']) &&
  node['property']['type'] === 'Identifier' &&
  node['property']['name'] === 'length'

type EmptyKind = 'empty' | 'non-empty'

type LiteralPosition = 'left' | 'right'

const emptyLength = 0
const minimumNonEmptyLength = 1

// Normalize to the size on the left, then keep only exact empty or non-empty checks.
const reverseOperators: ReadonlyMap<string, string> = new Map([
  ['<', '>'],
  ['<=', '>='],
  ['>', '<'],
  ['>=', '<='],
])
const compareWithZero: ReadonlyMap<string, EmptyKind> = new Map([
  ['!=', 'non-empty'],
  ['!==', 'non-empty'],
  ['<=', 'empty'],
  ['==', 'empty'],
  ['===', 'empty'],
  ['>', 'non-empty'],
])
const compareWithOne: ReadonlyMap<string, EmptyKind> = new Map([
  ['<', 'empty'],
  ['>=', 'non-empty'],
])

const classifyLengthComparison = (
  operator: string,
  literalPosition: LiteralPosition,
  literal: number,
): EmptyKind | undefined => {
  const normalizedOperator = literalPosition === 'left' ? (reverseOperators.get(operator) ?? operator) : operator
  if (literal === emptyLength) {
    return compareWithZero.get(normalizedOperator)
  }
  if (literal === minimumNonEmptyLength) {
    return compareWithOne.get(normalizedOperator)
  }
  return undefined
}

const classifySizeComparison = (
  node: Record<string, unknown>,
  isSize: (operand: unknown) => boolean,
): EmptyKind | undefined => {
  const { left, operator, right } = node
  if (!Predicate.isString(operator)) {
    return undefined
  }
  const literalPosition = isSize(left) ? 'right' : 'left'
  if (literalPosition === 'left' && !isSize(right)) {
    return undefined
  }
  const literal = getLiteralNumber(literalPosition === 'right' ? right : left)
  return Predicate.isNullish(literal) ? undefined : classifyLengthComparison(operator, literalPosition, literal)
}

const rule: Rule = {
  create(context: Context) {
    return {
      BinaryExpression(node: unknown) {
        if (!isReportable(node)) {
          return
        }
        const kind = classifySizeComparison(node, isLengthMember)
        if (Predicate.isNullish(kind)) {
          return
        }
        const message =
          kind === 'empty'
            ? 'Use Array.isArrayEmpty()/Array.isReadonlyArrayEmpty() instead of .length comparison'
            : 'Use Array.isArrayNonEmpty()/Array.isReadonlyArrayNonEmpty() instead of .length comparison'
        context.report({
          message,
          node,
        })
      },
    }
  },
  meta: {
    type: 'problem',
  },
}

export { classifyLengthComparison, classifySizeComparison, rule as forceArrayEmpty }
