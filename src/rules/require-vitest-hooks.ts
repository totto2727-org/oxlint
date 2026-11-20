import type { ESTree, Rule, SourceCode } from '@oxlint/plugins'
import { Array, Option, Predicate } from 'effect'

import { fieldName, findBinding } from '#src/effect-method.ts'

const suiteNames = new Set(['describe', 'suite', 'describeWrapped', 'layer'])
const testNames = new Set(['test', 'it', 'effect', 'live', 'prop'])
const hookNames = new Set(['beforeAll', 'afterAll', 'beforeEach', 'afterEach'])
const mockRegistrations = new Set(['mock', 'unmock', 'doMock', 'doUnmock', 'hoisted'])
const testModules = new Set(['vitest', '@effect/vitest', 'vite-plus/test'])

interface CalleePath {
  members: string[]
  root: ESTree.IdentifierReference
}

const memberName = (expression: ESTree.MemberExpression): unknown => {
  if (!expression.computed) {
    return fieldName(expression.property)
  }
  return expression.property.type === 'Literal' ? expression.property.value : undefined
}

const calleePath = (expression: ESTree.Expression): CalleePath | undefined => {
  if (expression.type === 'Identifier') {
    return { members: [], root: expression }
  }
  if (expression.type === 'CallExpression') {
    return calleePath(expression.callee)
  }
  if (expression.type === 'MemberExpression') {
    const member = memberName(expression)
    const path = calleePath(expression.object)
    if (Predicate.isNotNullish(path) && Predicate.isString(member)) {
      return { members: [...path.members, member], root: path.root }
    }
  }
  return undefined
}

const importedApiName = (
  { members }: CalleePath,
  node: ESTree.ImportSpecifier | ESTree.ImportNamespaceSpecifier,
): string | undefined => {
  const namespace = node.type === 'ImportNamespaceSpecifier'
  const [firstMember, secondMember] = members
  const api = namespace ? firstMember : fieldName(node.imported)
  if (api === 'vi') {
    const method = namespace ? secondMember : firstMember
    return Predicate.isNotNullish(method) && mockRegistrations.has(method) ? 'vi' : undefined
  }
  return Predicate.isString(api) ? api : undefined
}

// Recognize aliases and chained calls such as suite.each(data)(name, callback).
const vitestCallName = (source: SourceCode, callee: ESTree.Expression): string | undefined => {
  const path = calleePath(callee)
  if (Predicate.isNullish(path)) {
    return undefined
  }
  const { root } = path
  const binding = findBinding(source.getScope(root), root.name)
  const definition = binding?.defs.find(
    ({ node, parent }) =>
      parent?.type === 'ImportDeclaration' &&
      parent.importKind !== 'type' &&
      testModules.has(parent.source.value) &&
      (node.type === 'ImportNamespaceSpecifier' || (node.type === 'ImportSpecifier' && node.importKind !== 'type')),
  )
  const node = definition?.node
  return node?.type === 'ImportNamespaceSpecifier' || node?.type === 'ImportSpecifier'
    ? importedApiName(path, node)
    : undefined
}

const callName = (source: SourceCode, statement: ESTree.Node): string | undefined =>
  statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression'
    ? vitestCallName(source, statement.expression.callee)
    : undefined

const registersTests = (name: string | undefined): boolean =>
  Predicate.isNotNullish(name) && (suiteNames.has(name) || testNames.has(name) || hookNames.has(name))

const isEffectSuiteTest = (statement: ESTree.Node, parameter: ESTree.Node | undefined): boolean => {
  if (
    parameter?.type !== 'Identifier' ||
    statement.type !== 'ExpressionStatement' ||
    statement.expression.type !== 'CallExpression'
  ) {
    return false
  }
  const path = calleePath(statement.expression.callee)
  return (
    path?.root.name === parameter.name && (Array.isArrayEmpty(path.members) || testNames.has(path.members[0] ?? ''))
  )
}

export const requireVitestHooks: Rule = {
  create({ sourceCode, report }) {
    const check = (statement: ESTree.Node): void => {
      if (statement.type !== 'ExpressionStatement' || statement.expression.type === 'Literal') {
        return
      }
      const name = callName(sourceCode, statement)
      if (!registersTests(name) && name !== 'vi') {
        report({
          message:
            'Put shared test setup or cleanup in a Vitest hook. Create values used by a test with const inside that test.',
          node: statement,
        })
      }
    }

    return {
      CallExpression(node) {
        const name = vitestCallName(sourceCode, node.callee)
        if (Predicate.isNullish(name) || !suiteNames.has(name)) {
          return
        }
        const callback = Option.getOrUndefined(Array.last(node.arguments))
        if (callback?.type !== 'ArrowFunctionExpression' && callback?.type !== 'FunctionExpression') {
          return
        }
        const scopedTests = name === 'describeWrapped' || name === 'layer' ? callback.params[0] : undefined
        const statements = callback.body?.type === 'BlockStatement' ? callback.body.body : []
        Array.forEach(statements, (statement) => {
          if (!isEffectSuiteTest(statement, scopedTests)) {
            check(statement)
          }
        })
      },
      Program(node) {
        if (node.body.some((statement) => registersTests(callName(sourceCode, statement)))) {
          Array.forEach(node.body, check)
        }
      },
    }
  },
  meta: { type: 'problem' },
}
