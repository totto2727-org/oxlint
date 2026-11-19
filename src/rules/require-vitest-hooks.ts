import type { ESTree, Rule, SourceCode } from '@oxlint/plugins'

import { fieldName, findBinding } from '../effect-method.ts'

const suiteNames = new Set(['describe', 'suite', 'describeWrapped', 'layer'])
const testNames = new Set(['test', 'it', 'effect', 'live', 'prop'])
const hookNames = new Set(['beforeAll', 'afterAll', 'beforeEach', 'afterEach'])
const mockRegistrations = new Set(['mock', 'unmock', 'doMock', 'doUnmock', 'hoisted'])
const testModules = new Set(['vitest', '@effect/vitest', 'vite-plus/test'])

const calleePath = (expression: ESTree.Expression): { root: ESTree.IdentifierReference; members: string[] } | null => {
  if (expression.type === 'Identifier') {
    return { root: expression, members: [] }
  }
  if (expression.type === 'CallExpression') {
    return calleePath(expression.callee)
  }
  if (expression.type === 'MemberExpression') {
    const member = expression.computed
      ? expression.property.type === 'Literal'
        ? expression.property.value
        : null
      : fieldName(expression.property)
    const path = calleePath(expression.object)
    if (path !== null && typeof member === 'string') {
      return { root: path.root, members: [...path.members, member] }
    }
  }
  return null
}

// Recognize aliases and chained calls such as suite.each(data)(name, callback).
const vitestCallName = (source: SourceCode, callee: ESTree.Expression): string | null => {
  const path = calleePath(callee)
  if (path === null) {
    return null
  }
  const { root, members } = path
  const binding = findBinding(source.getScope(root), root.name)
  for (const { node, parent } of binding?.defs ?? []) {
    if (parent?.type !== 'ImportDeclaration' || parent.importKind === 'type' || !testModules.has(parent.source.value)) {
      continue
    }
    if (node.type === 'ImportNamespaceSpecifier' || (node.type === 'ImportSpecifier' && node.importKind !== 'type')) {
      const api = node.type === 'ImportNamespaceSpecifier' ? members[0] : fieldName(node.imported)
      const method = members[node.type === 'ImportNamespaceSpecifier' ? 1 : 0]
      if (api === 'vi') {
        return method !== undefined && mockRegistrations.has(method) ? 'vi' : null
      }
      return typeof api === 'string' ? api : null
    }
  }
  return null
}

const callName = (source: SourceCode, statement: ESTree.Node): string | null =>
  statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression'
    ? vitestCallName(source, statement.expression.callee)
    : null

const registersTests = (name: string | null): boolean =>
  name !== null && (suiteNames.has(name) || testNames.has(name) || hookNames.has(name))

const isEffectSuiteTest = (statement: ESTree.Node, parameter: ESTree.Node | undefined): boolean => {
  if (
    parameter?.type !== 'Identifier' ||
    statement.type !== 'ExpressionStatement' ||
    statement.expression.type !== 'CallExpression'
  ) {
    return false
  }
  const path = calleePath(statement.expression.callee)
  return path?.root.name === parameter.name && (path.members.length === 0 || testNames.has(path.members[0] ?? ''))
}

const rule: Rule = {
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
      Program(node) {
        if (node.body.some((statement) => registersTests(callName(sourceCode, statement)))) {
          node.body.forEach(check)
        }
      },
      CallExpression(node) {
        const name = vitestCallName(sourceCode, node.callee)
        if (name === null || !suiteNames.has(name)) {
          return
        }
        const callback = node.arguments.at(-1)
        if (callback?.type !== 'ArrowFunctionExpression' && callback?.type !== 'FunctionExpression') {
          return
        }
        if (callback.body?.type === 'BlockStatement') {
          const scopedTests = name === 'describeWrapped' || name === 'layer' ? callback.params[0] : undefined
          for (const statement of callback.body.body) {
            if (!isEffectSuiteTest(statement, scopedTests)) {
              check(statement)
            }
          }
        }
      },
    }
  },
  meta: { type: 'problem' },
}

export default rule
