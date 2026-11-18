import type { ESTree, Rule, SourceCode } from '@oxlint/plugins'
import { Array, Predicate } from 'effect'

import { fieldName, findBinding, isEffectMethod } from '../effect-method.ts'

type CauseField = ESTree.TSPropertySignature | true | undefined

const findCauseField = (members: readonly ESTree.TSSignature[]): CauseField => {
  for (const member of members) {
    if (
      member.type === 'TSPropertySignature' &&
      (!member.computed || member.key.type === 'Literal') &&
      fieldName(member.key) === 'cause'
    ) {
      return member.optional ? member : true
    }
  }
  return undefined
}

const mergeFields = (fields: readonly CauseField[]): CauseField =>
  Array.some(fields, (field) => field === true)
    ? true
    : Array.findFirst(fields, Predicate.isNotUndefined).valueOrUndefined

const findTypeCause = (source: SourceCode, root: ESTree.TSType): CauseField => {
  const expanding = new Set<ESTree.Node>()
  const inspectReference = (reference: ESTree.IdentifierReference): CauseField => {
    const binding = findBinding(source.getScope(reference), reference.name)
    return mergeFields(Array.map(binding?.defs ?? [], ({ node }) => inspect(node)))
  }
  const inspect = (node: ESTree.Node): CauseField => {
    if (expanding.has(node)) {
      return undefined
    }
    expanding.add(node)
    try {
      switch (node.type) {
        case 'TSTypeLiteral':
          return findCauseField(node.members)
        case 'TSParenthesizedType':
        case 'TSTypeAliasDeclaration':
          return inspect(node.typeAnnotation)
        case 'TSIntersectionType':
          return mergeFields(Array.map(node.types, inspect))
        case 'TSInterfaceDeclaration':
          return findCauseField(node.body.body) ?? mergeFields(Array.map(node.extends, inspect))
        case 'TSInterfaceHeritage':
          return node.expression.type === 'Identifier' ? inspectReference(node.expression) : undefined
        case 'TSTypeReference':
          return node.typeName.type === 'Identifier' ? inspectReference(node.typeName) : undefined
        default:
          return undefined
      }
    } finally {
      expanding.delete(node)
    }
  }
  return inspect(root)
}

const schemaFields = (
  source: SourceCode,
  expression: ESTree.Node | undefined,
  seen = new Set<ESTree.Node>(),
): ESTree.ObjectExpression | undefined => {
  if (!expression || seen.has(expression)) {
    return undefined
  }
  seen.add(expression)
  switch (expression.type) {
    case 'ObjectExpression':
      return expression
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      return schemaFields(source, expression.expression, seen)
    case 'CallExpression':
      return isEffectMethod(source, expression.callee, 'Schema', 'Struct')
        ? schemaFields(source, expression.arguments[0], seen)
        : undefined
    case 'Identifier': {
      const binding = findBinding(source.getScope(expression), expression.name)
      const definition = binding?.defs[0]
      return definition?.node.type === 'VariableDeclarator' &&
        definition.parent?.type === 'VariableDeclaration' &&
        definition.parent.kind === 'const' &&
        definition.node.init
        ? schemaFields(source, definition.node.init, seen)
        : undefined
    }
    default:
      return undefined
  }
}

const rule: Rule = {
  create(context) {
    const { sourceCode } = context
    const reported = new Set<ESTree.Node>()
    const report = (node: ESTree.Node) => {
      if (reported.has(node)) {
        return
      }
      reported.add(node)
      context.report({
        message:
          'Make `cause` required when wrapping another failure. Use a separate tagged error for failures without a cause.',
        node,
      })
    }
    const checkClass = (node: ESTree.Class) => {
      const base = node.superClass
      if (base?.type !== 'CallExpression') {
        return
      }
      const isDataError = isEffectMethod(sourceCode, base.callee, 'Data', 'TaggedError')
      const isSchemaError =
        base.callee.type === 'CallExpression' &&
        (isEffectMethod(sourceCode, base.callee.callee, 'Schema', 'TaggedError') ||
          isEffectMethod(sourceCode, base.callee.callee, 'Schema', 'TaggedErrorClass'))
      if (!isDataError && !isSchemaError) {
        return
      }
      for (const field of node.body.body) {
        if (
          field.type === 'PropertyDefinition' &&
          !field.static &&
          field.optional &&
          (!field.computed || field.key.type === 'Literal') &&
          fieldName(field.key) === 'cause'
        ) {
          report(field)
        }
      }
      if (isDataError) {
        const fields = node.superTypeArguments?.params[0]
        if (Predicate.isNotUndefined(fields)) {
          const cause = findTypeCause(sourceCode, fields)
          if (Predicate.isNotUndefined(cause) && cause !== true) {
            report(cause)
          }
        }
      }
      if (!isSchemaError) {
        return
      }
      const fields = schemaFields(sourceCode, base.arguments[1])
      if (fields) {
        for (const field of fields.properties) {
          if (
            field.type === 'Property' &&
            (!field.computed || field.key.type === 'Literal') &&
            fieldName(field.key) === 'cause' &&
            field.value.type === 'CallExpression' &&
            (isEffectMethod(sourceCode, field.value.callee, 'Schema', 'optional') ||
              isEffectMethod(sourceCode, field.value.callee, 'Schema', 'optionalKey'))
          ) {
            report(field)
          }
        }
      }
    }
    return { ClassDeclaration: checkClass, ClassExpression: checkClass }
  },
  meta: { type: 'problem' },
}

export default rule
