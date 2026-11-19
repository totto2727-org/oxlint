// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import type { CreateRule, ESTree } from '@oxlint/plugins'

const SCHEMA_SOURCES = new Set(['effect', 'effect/Schema'])
const SCHEMA_NAMESPACE_SOURCES = new Set(['effect/Schema'])

interface SchemaBindings {
  opaque: Set<string>
  schema: Set<string>
}

const trackSpecifier = (
  bindings: SchemaBindings,
  source: string,
  specifier: ESTree.ImportDeclaration['specifiers'][number],
): void => {
  if (specifier.type === 'ImportNamespaceSpecifier' && SCHEMA_NAMESPACE_SOURCES.has(source)) {
    bindings.schema.add(specifier.local.name)
  } else if (
    specifier.type === 'ImportSpecifier' &&
    specifier.importKind !== 'type' &&
    specifier.imported.type === 'Identifier'
  ) {
    if (specifier.imported.name === 'Schema') {
      bindings.schema.add(specifier.local.name)
    } else if (specifier.imported.name === 'Opaque') {
      bindings.opaque.add(specifier.local.name)
    }
  }
}

const extendsSchemaOpaque = (bindings: SchemaBindings, node: ESTree.Class): boolean => {
  const superclass = node.superClass
  if (superclass?.type !== 'CallExpression' || superclass.callee.type !== 'CallExpression') {
    return false
  }
  const { callee } = superclass.callee
  if (callee.type === 'Identifier') {
    return bindings.opaque.has(callee.name)
  }
  return (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'Opaque' &&
    callee.object.type === 'Identifier' &&
    bindings.schema.has(callee.object.name)
  )
}

export const noOpaqueInstanceFields: CreateRule = {
  create(context) {
    const bindings: SchemaBindings = { opaque: new Set(), schema: new Set() }
    const checkClass = (node: ESTree.Class): void => {
      if (!extendsSchemaOpaque(bindings, node)) {
        return
      }
      for (const element of node.body.body) {
        if ((element.type === 'PropertyDefinition' || element.type === 'MethodDefinition') && !element.static) {
          context.report({ message: 'Classes extending Schema.Opaque must not have instance members', node: element })
        }
      }
    }
    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
      ImportDeclaration(node) {
        if (node.importKind !== 'type' && SCHEMA_SOURCES.has(node.source.value)) {
          for (const specifier of node.specifiers) {
            trackSpecifier(bindings, node.source.value, specifier)
          }
        }
      },
    }
  },
  meta: {
    docs: { description: 'Disallow instance members in Schema.Opaque classes' },
    type: 'problem',
  },
}
