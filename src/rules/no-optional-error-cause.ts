import type { Context, ESTree, Rule, SourceCode, Visitor } from '@oxlint/plugins'
import { Array, Predicate } from 'effect'

import { fieldName, findBinding, isEffectMethod } from '#src/effect-method.ts'

type CauseField = ESTree.TSPropertySignature | true | undefined

const findCauseField = (members: ESTree.TSSignature[]): CauseField => {
  const member = members.find(
    (field) =>
      field.type === 'TSPropertySignature' &&
      (!field.computed || field.key.type === 'Literal') &&
      fieldName(field.key) === 'cause',
  )
  if (member?.type !== 'TSPropertySignature') {
    return undefined
  }
  return member.optional ? member : true
}

const mergeFields = (fields: CauseField[]): CauseField =>
  fields.some((field) => field === true) ? true : Array.findFirst(fields, Predicate.isNotNullish).valueOrUndefined

const findTypeCause = (source: SourceCode, root: ESTree.TSType): CauseField => {
  const expanding = new Set<ESTree.Node>()
  const inspectReference = (node: ESTree.Node, inspect: (node: ESTree.Node) => CauseField): CauseField => {
    if (node.type !== 'TSInterfaceHeritage' && node.type !== 'TSTypeReference') {
      return undefined
    }
    const reference = node.type === 'TSInterfaceHeritage' ? node.expression : node.typeName
    if (reference.type !== 'Identifier') {
      return undefined
    }
    const binding = findBinding(source.getScope(reference), reference.name)
    return mergeFields((binding?.defs ?? []).map(({ node: definition }) => inspect(definition)))
  }
  const inspectNode = (node: ESTree.Node, inspect: (node: ESTree.Node) => CauseField): CauseField => {
    if (node.type === 'TSTypeLiteral') {
      return findCauseField(node.members)
    }
    if (node.type === 'TSParenthesizedType' || node.type === 'TSTypeAliasDeclaration') {
      return inspect(node.typeAnnotation)
    }
    if (node.type === 'TSIntersectionType') {
      return mergeFields(node.types.map((type) => inspect(type)))
    }
    if (node.type === 'TSInterfaceDeclaration') {
      return findCauseField(node.body.body) ?? mergeFields(node.extends.map((type) => inspect(type)))
    }
    return inspectReference(node, inspect)
  }
  const inspect = (node: ESTree.Node): CauseField => {
    if (expanding.has(node)) {
      return undefined
    }
    expanding.add(node)
    try {
      return inspectNode(node, inspect)
    } finally {
      expanding.delete(node)
    }
  }
  return inspect(root)
}

const constInitializer = (source: SourceCode, identifier: { name: string } & ESTree.Node): ESTree.Node | undefined => {
  const definition = findBinding(source.getScope(identifier), identifier.name)?.defs[0]
  if (
    definition?.node.type === 'VariableDeclarator' &&
    definition.parent?.type === 'VariableDeclaration' &&
    definition.parent.kind === 'const'
  ) {
    return definition.node.init ?? undefined
  }
  return undefined
}

const schemaFields = (
  source: SourceCode,
  expression: ESTree.Node | undefined,
  seen = new Set<ESTree.Node>(),
): ESTree.ObjectExpression | undefined => {
  if (Predicate.isNullish(expression) || seen.has(expression)) {
    return undefined
  }
  seen.add(expression)
  if (expression.type === 'ObjectExpression') {
    return expression
  }
  if (expression.type === 'TSAsExpression' || expression.type === 'TSSatisfiesExpression') {
    return schemaFields(source, expression.expression, seen)
  }
  if (
    expression.type === 'CallExpression' &&
    isEffectMethod(source, expression.callee, { module: 'Schema', name: 'Struct' })
  ) {
    return schemaFields(source, expression.arguments[0], seen)
  }
  return expression.type === 'Identifier' ? schemaFields(source, constInitializer(source, expression), seen) : undefined
}

const reportMatchingFields = <Field extends ESTree.Node>(
  fields: Field[],
  matches: (field: Field) => boolean,
  report: (node: ESTree.Node) => void,
): void => {
  Array.forEach(fields, (field) => {
    if (matches(field)) {
      report(field)
    }
  })
}

const isOptionalInstanceCause = (field: ESTree.ClassElement): boolean =>
  field.type === 'PropertyDefinition' &&
  !field.static &&
  field.optional === true &&
  (!field.computed || field.key.type === 'Literal') &&
  fieldName(field.key) === 'cause'

const isOptionalSchemaCause = (source: SourceCode, field: ESTree.ObjectExpression['properties'][number]): boolean =>
  field.type === 'Property' &&
  (!field.computed || field.key.type === 'Literal') &&
  fieldName(field.key) === 'cause' &&
  field.value.type === 'CallExpression' &&
  (isEffectMethod(source, field.value.callee, { module: 'Schema', name: 'optional' }) ||
    isEffectMethod(source, field.value.callee, { module: 'Schema', name: 'optionalKey' }))

const isSchemaError = (source: SourceCode, base: ESTree.CallExpression): boolean =>
  base.callee.type === 'CallExpression' &&
  (isEffectMethod(source, base.callee.callee, { module: 'Schema', name: 'TaggedError' }) ||
    isEffectMethod(source, base.callee.callee, { module: 'Schema', name: 'TaggedErrorClass' }))

const createReporter = (context: Context): ((node: ESTree.Node) => void) => {
  const reported = new Set<ESTree.Node>()
  return (node): void => {
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
}

const reportDataCause = (source: SourceCode, node: ESTree.Class, report: (node: ESTree.Node) => void): void => {
  const fields = node.superTypeArguments?.params[0]
  if (Predicate.isNotNullish(fields)) {
    const cause = findTypeCause(source, fields)
    if (Predicate.isNotNullish(cause) && cause !== true) {
      report(cause)
    }
  }
}

const matchingTaggedErrorBase = (
  source: SourceCode,
  base: ESTree.CallExpression,
): { data: boolean; schema: boolean } => ({
  data: isEffectMethod(source, base.callee, { module: 'Data', name: 'TaggedError' }),
  schema: isSchemaError(source, base),
})

export const noOptionalErrorCause: Rule = {
  create(context): Visitor {
    const { sourceCode } = context
    const report = createReporter(context)
    const checkClass = (node: ESTree.Class): void => {
      const base = node.superClass
      if (base?.type !== 'CallExpression') {
        return
      }
      const { data, schema } = matchingTaggedErrorBase(sourceCode, base)
      if (!data && !schema) {
        return
      }
      reportMatchingFields(node.body.body, isOptionalInstanceCause, report)
      if (data) {
        reportDataCause(sourceCode, node, report)
      }
      reportMatchingFields(
        schema ? (schemaFields(sourceCode, base.arguments[1])?.properties ?? []) : [],
        (field) => isOptionalSchemaCause(sourceCode, field),
        report,
      )
    }
    return { ClassDeclaration: checkClass, ClassExpression: checkClass }
  },
  meta: { type: 'problem' },
}
