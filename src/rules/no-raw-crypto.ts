import type { Context, ESTree, Rule, SourceCode, Visitor } from '@oxlint/plugins'
import { Array } from 'effect'

import { fieldName } from '#src/effect-method.ts'

const GLOBAL_RECEIVERS = new Set(['globalThis', 'global', 'self', 'window'])
const TYPE_REFERENCE_PARENTS = new Set([
  'TSClassImplements',
  'TSInterfaceHeritage',
  'TSMethodSignature',
  'TSPropertySignature',
  'TSQualifiedName',
  'TSTypeQuery',
  'TSTypeReference',
])
const GUIDANCE_MESSAGE =
  'Use services from `effect/crypto` for cryptography. For digests, use `Digest.Digest` with `Digest.layerWebCrypto`. For secure randomness, use `SecureRandom.SecureRandom` with `SecureRandom.layerWebCrypto`.'

const isCryptoProperty = (key: ESTree.Node, computed: boolean): boolean =>
  (!computed || key.type === 'Literal') && fieldName(key) === 'crypto'

const globalReferences = (source: SourceCode, name: string): Set<ESTree.Node> => {
  const { globalScope } = source.scopeManager
  const variable = globalScope?.set.get(name)
  // The scope manager leaves references unresolved when the host global is not configured.
  const references = variable && Array.isArrayEmpty(variable.defs) ? variable.references : (globalScope?.through ?? [])
  return new Set(references.filter(({ identifier }) => identifier.name === name).map(({ identifier }) => identifier))
}

const createGlobalLookup = (source: SourceCode) => {
  const globals = new Map<string, Set<ESTree.Node>>()
  return (node: ESTree.Node): boolean => {
    if (node.type !== 'Identifier') {
      return false
    }
    const references = globals.get(node.name) ?? globalReferences(source, node.name)
    globals.set(node.name, references)
    return references.has(node)
  }
}

const isTypeReference = (parent: ESTree.Node): boolean =>
  TYPE_REFERENCE_PARENTS.has(parent.type) ||
  (parent.type === 'ExportSpecifier' &&
    (parent.exportKind === 'type' ||
      (parent.parent.type === 'ExportNamedDeclaration' && parent.parent.exportKind === 'type')))

const reportCrypto = (context: Context, node: ESTree.Node): void => {
  context.report({ message: GUIDANCE_MESSAGE, node })
}

const createWebCryptoVisitors = (context: Context, isGlobal: ReturnType<typeof createGlobalLookup>): Visitor => {
  const isGlobalReceiver = (node: ESTree.Node | null): boolean =>
    node?.type === 'Identifier' && GLOBAL_RECEIVERS.has(node.name) && isGlobal(node)

  const reportDestructuredCrypto = (pattern: ESTree.Node, value: ESTree.Node | null): void => {
    if (pattern.type !== 'ObjectPattern' || !isGlobalReceiver(value)) {
      return
    }
    const property = pattern.properties.find(
      (entry) => entry.type === 'Property' && isCryptoProperty(entry.key, entry.computed),
    )
    if (property?.type === 'Property') {
      reportCrypto(context, property.key)
    }
  }

  return {
    AssignmentExpression(node) {
      reportDestructuredCrypto(node.left, node.right)
    },
    Identifier(node) {
      if (node.name === 'crypto' && !isTypeReference(node.parent) && isGlobal(node)) {
        reportCrypto(context, node)
      }
    },
    MemberExpression(node) {
      if (
        isCryptoProperty(node.property, node.computed) &&
        !isTypeReference(node.parent) &&
        isGlobalReceiver(node.object)
      ) {
        reportCrypto(context, node)
      }
    },
    VariableDeclarator(node) {
      reportDestructuredCrypto(node.id, node.init)
    },
  }
}

const createNodeCryptoVisitors = (context: Context, isGlobal: ReturnType<typeof createGlobalLookup>): Visitor => {
  const reportCryptoModule = (node: ESTree.Node, source: ESTree.Node | null | undefined): void => {
    if (source?.type === 'Literal' && (source.value === 'node:crypto' || source.value === 'crypto')) {
      reportCrypto(context, node)
    }
  }

  return {
    CallExpression(node) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'require' && isGlobal(node.callee)) {
        reportCryptoModule(node, node.arguments[0])
      }
    },
    ExportAllDeclaration(node) {
      if (node.exportKind !== 'type') {
        reportCryptoModule(node, node.source)
      }
    },
    ExportNamedDeclaration(node) {
      if (
        node.exportKind !== 'type' &&
        (Array.isArrayEmpty(node.specifiers) || node.specifiers.some((specifier) => specifier.exportKind !== 'type'))
      ) {
        reportCryptoModule(node, node.source)
      }
    },
    ImportDeclaration(node) {
      if (
        node.importKind !== 'type' &&
        (Array.isArrayEmpty(node.specifiers) ||
          node.specifiers.some((specifier) => specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type'))
      ) {
        reportCryptoModule(node, node.source)
      }
    },
    ImportExpression(node) {
      reportCryptoModule(node, node.source)
    },
    TSImportEqualsDeclaration(node) {
      if (node.importKind !== 'type' && node.moduleReference.type === 'TSExternalModuleReference') {
        reportCryptoModule(node, node.moduleReference.expression)
      }
    },
  }
}

export const noRawCrypto: Rule = {
  create(context) {
    const isGlobal = createGlobalLookup(context.sourceCode)
    return { ...createWebCryptoVisitors(context, isGlobal), ...createNodeCryptoVisitors(context, isGlobal) }
  },
  meta: { type: 'problem' },
}
