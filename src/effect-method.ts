import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins'
import { Array, Predicate } from 'effect'

export const fieldName = (node: ESTree.Node): unknown =>
  node.type === 'Identifier' ? node.name : node.type === 'Literal' ? node.value : null

export const findBinding = (scope: Scope | null, name: string): Variable | undefined =>
  Predicate.isNull(scope) ? undefined : (scope.set.get(name) ?? findBinding(scope.upper, name))

export const isEffectMethod = (
  source: SourceCode,
  callee: ESTree.Expression,
  module: string,
  method: string,
): boolean => {
  const receiver = callee.type === 'MemberExpression' ? callee.object : callee
  if (receiver.type !== 'Identifier') {
    return false
  }
  const variable = findBinding(source.getScope(receiver), receiver.name)
  return Array.some(variable?.defs ?? [], ({ node, parent }) => {
    if (parent?.type !== 'ImportDeclaration' || parent.importKind === 'type') {
      return false
    }
    const path = parent.source.value
    if (callee.type === 'Identifier') {
      return path === `effect/${module}` && node.type === 'ImportSpecifier' && fieldName(node.imported) === method
    }
    return (
      callee.type === 'MemberExpression' &&
      (!callee.computed || callee.property.type === 'Literal') &&
      fieldName(callee.property) === method &&
      ((path === `effect/${module}` && node.type === 'ImportNamespaceSpecifier') ||
        (path === 'effect' && node.type === 'ImportSpecifier' && fieldName(node.imported) === module))
    )
  })
}
