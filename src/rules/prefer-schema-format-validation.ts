import type { ESTree, Rule } from '@oxlint/plugins'

const rejectsInput = (statement: ESTree.Statement): boolean => {
  if (statement.type === 'BlockStatement') {
    return statement.body.some((item) => rejectsInput(item))
  }
  if (statement.type === 'ThrowStatement') {
    return true
  }
  if (statement.type !== 'ReturnStatement') {
    return false
  }
  const result = statement.argument
  return result?.type === 'YieldExpression' && result.delegate && result.argument?.type === 'NewExpression'
}

const regexTest = (expression: ESTree.Expression): ESTree.CallExpression | undefined => {
  if (expression.type === 'UnaryExpression' && expression.operator === '!') {
    return regexTest(expression.argument)
  }
  if (expression.type === 'LogicalExpression' && expression.operator === '||') {
    return regexTest(expression.left) ?? regexTest(expression.right)
  }
  if (expression.type !== 'CallExpression') {
    return undefined
  }
  const { callee } = expression
  return callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'test' &&
    callee.object.type === 'Literal' &&
    'regex' in callee.object
    ? expression
    : undefined
}

export const preferSchemaFormatValidation: Rule = {
  create(context) {
    return {
      IfStatement(node) {
        const test = regexTest(node.test)
        if (test && rejectsInput(node.consequent)) {
          context.report({
            message:
              'Declare this input format as a named Effect Schema. Keep related length or range constraints in the same schema.',
            node: test,
          })
        }
      },
    }
  },
  meta: { type: 'suggestion' },
}
