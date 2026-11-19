import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins'
import { Predicate } from 'effect'

const fieldName = (node: ESTree.Node): unknown => {
  if (node.type === 'Identifier') {
    return node.name
  }
  return node.type === 'Literal' ? node.value : undefined
}

const findBinding = (scope: Scope | null, name: string): Variable | undefined =>
  Predicate.isNullish(scope) ? undefined : (scope.set.get(name) ?? findBinding(scope.upper, name))

const isEffectMethod = (
  source: SourceCode,
  callee: ESTree.Expression,
  { module, name }: { module: string; name: string },
): boolean => {
  const receiver = callee.type === 'MemberExpression' ? callee.object : callee
  if (receiver.type !== 'Identifier') {
    return false
  }
  const variable = findBinding(source.getScope(receiver), receiver.name)
  return (variable?.defs ?? []).some(({ node, parent }) => {
    if (parent?.type !== 'ImportDeclaration' || parent.importKind === 'type') {
      return false
    }
    const path = parent.source.value
    if (callee.type === 'Identifier') {
      return path === `effect/${module}` && node.type === 'ImportSpecifier' && fieldName(node.imported) === name
    }
    return (
      callee.type === 'MemberExpression' &&
      (!callee.computed || callee.property.type === 'Literal') &&
      fieldName(callee.property) === name &&
      ((path === `effect/${module}` && node.type === 'ImportNamespaceSpecifier') ||
        (path === 'effect' && node.type === 'ImportSpecifier' && fieldName(node.imported) === module))
    )
  })
}

export { fieldName, findBinding, isEffectMethod }
