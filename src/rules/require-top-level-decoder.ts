import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { hasProperty, isReportable } from '#src/helpers.ts'

const TOP_LEVEL_DECODER_MESSAGE =
  'Hoist fixed schema decoder construction to module top level so it is not repeated on every call. If the schema must be built from runtime input, or a factory builds the decoder only once per instance, disable this rule on the decoder line and explain why.'

const matchMemberCallByPrefix = (node: unknown, namespace: string, prefix: string): boolean => {
  if (
    !Predicate.isObject(node) ||
    node['type'] !== 'CallExpression' ||
    !Predicate.isObject(node['callee']) ||
    node['callee']['type'] !== 'MemberExpression' ||
    Predicate.isTruthy(node['callee']['computed'])
  ) {
    return false
  }
  const { object, property } = node['callee']
  if (
    !Predicate.isObject(object) ||
    object['type'] !== 'Identifier' ||
    !hasProperty(object, 'name') ||
    object.name !== namespace
  ) {
    return false
  }
  if (
    !Predicate.isObject(property) ||
    property['type'] !== 'Identifier' ||
    !hasProperty(property, 'name') ||
    !Predicate.isString(property.name)
  ) {
    return false
  }
  return property.name.startsWith(prefix)
}

export const isHoistableDecoderCall = (node: unknown): boolean =>
  matchMemberCallByPrefix(node, 'Schema', 'decode') || matchMemberCallByPrefix(node, 'HttpClientResponse', 'schema')

export const requireTopLevelDecoder: Rule = {
  create(context: Context) {
    const functionStack: true[] = []
    const enterFunction = (): void => {
      functionStack.push(true)
    }
    const exitFunction = (): void => {
      functionStack.pop()
    }
    return {
      ArrowFunctionExpression: enterFunction,
      'ArrowFunctionExpression:exit': exitFunction,
      CallExpression(node: unknown) {
        if (Predicate.isNullish(functionStack[0]) || !isReportable(node)) {
          return
        }
        if (isHoistableDecoderCall(node)) {
          context.report({
            message: TOP_LEVEL_DECODER_MESSAGE,
            node,
          })
        }
      },
      FunctionDeclaration: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      FunctionExpression: enterFunction,
      'FunctionExpression:exit': exitFunction,
    }
  },
  meta: {
    type: 'problem',
  },
}
