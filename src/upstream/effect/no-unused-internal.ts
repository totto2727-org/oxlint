// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import type { CreateRule } from '@oxlint/plugins'
import { Predicate } from 'effect'
import ts from 'typescript-api'

import type { FileInfo, InternalExport, WorkspaceGraph } from './unused-internal-graph.ts'
import { collectWorkspace, getExports, getReExportedInternals, scanUsage } from './unused-internal-graph.ts'
import { hasInternalJSDoc, hasPrivateOrProtectedModifier, isNonReferenceName } from './unused-internal-syntax.ts'
import { normalizePathName } from './unused-internal-workspace.ts'

interface Diagnostic {
  fileName: string
  range: Readonly<[number, number]>
  message: string
}

interface Analysis {
  diagnosticsByFile: ReadonlyMap<string, Readonly<Diagnostic[]>>
}

const cache = new Map<string, Analysis>()

const getCwd = (context: { cwd?: string; getCwd?: () => string }): string =>
  context.cwd ?? context.getCwd?.() ?? process.cwd()

interface SignatureScan {
  diagnostics: Diagnostic[]
  fileInfo: FileInfo
  graph: WorkspaceGraph
}

const findInternalReferences = ({ diagnostics, fileInfo, graph }: SignatureScan, node: ts.Node): void => {
  const reportReferences = (references: Readonly<InternalExport[]>, name: ts.Node): void => {
    for (const internal of references) {
      diagnostics.push({
        fileName: fileInfo.fileName,
        message: `Do not reference @internal export "${internal.name}" in a public exported type signature`,
        range: [name.getStart(), name.getEnd()],
      })
    }
  }
  const visit = (current: ts.Node): void => {
    if (ts.isPropertyAccessExpression(current) && ts.isIdentifier(current.expression)) {
      const importedFile = fileInfo.namespaceImports.get(current.expression.text)
      reportReferences(getExports(graph.files, importedFile, current.name.text), current.name)
    } else if (ts.isQualifiedName(current) && ts.isIdentifier(current.left)) {
      const importedFile = fileInfo.namespaceImports.get(current.left.text)
      reportReferences(getExports(graph.files, importedFile, current.right.text), current.right)
    } else if (ts.isIdentifier(current) && !isNonReferenceName(current)) {
      const localExports = fileInfo.internalExports.get(current.text) ?? []
      const imported = fileInfo.imports.get(current.text)
      const importedExports = getExports(graph.files, imported?.fileName, imported?.importedName ?? '')
      reportReferences([...localExports, ...importedExports], current)
    }
    ts.forEachChild(current, visit)
  }
  visit(node)
}

const scanTypeParameters = (
  scan: SignatureScan,
  typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined,
): void => {
  if (Predicate.isNullish(typeParameters)) {
    return
  }
  for (const typeParameter of typeParameters) {
    if (Predicate.isNotNullish(typeParameter.constraint)) {
      findInternalReferences(scan, typeParameter.constraint)
    }
    if (Predicate.isNotNullish(typeParameter.default)) {
      findInternalReferences(scan, typeParameter.default)
    }
  }
}

const scanParameterTypes = (scan: SignatureScan, parameters: ts.NodeArray<ts.ParameterDeclaration>): void => {
  for (const parameter of parameters) {
    if (Predicate.isNotNullish(parameter.type)) {
      findInternalReferences(scan, parameter.type)
    }
  }
}

const scanFunctionLikeSignature = (scan: SignatureScan, node: ts.SignatureDeclarationBase): void => {
  scanTypeParameters(scan, node.typeParameters)
  scanParameterTypes(scan, node.parameters)
  if (Predicate.isNotNullish(node.type)) {
    findInternalReferences(scan, node.type)
  }
}

const scanClassMemberSignature = (scan: SignatureScan, member: ts.ClassElement): void => {
  if (hasInternalJSDoc(member) || hasPrivateOrProtectedModifier(member)) {
    return
  }
  if (
    ts.isMethodDeclaration(member) ||
    ts.isConstructorDeclaration(member) ||
    ts.isGetAccessorDeclaration(member) ||
    ts.isSetAccessorDeclaration(member)
  ) {
    scanFunctionLikeSignature(scan, member)
  } else if (ts.isPropertyDeclaration(member) && Predicate.isNotNullish(member.type)) {
    findInternalReferences(scan, member.type)
  }
}

const scanInterfaceMemberSignature = (scan: SignatureScan, member: ts.TypeElement): void => {
  if (hasInternalJSDoc(member)) {
    return
  }
  if (
    ts.isMethodSignature(member) ||
    ts.isCallSignatureDeclaration(member) ||
    ts.isConstructSignatureDeclaration(member) ||
    ts.isIndexSignatureDeclaration(member)
  ) {
    scanFunctionLikeSignature(scan, member)
  } else if (ts.isPropertySignature(member) && Predicate.isNotNullish(member.type)) {
    findInternalReferences(scan, member.type)
  }
}

const scanVariableTypes = (scan: SignatureScan, node: ts.VariableStatement): void => {
  for (const declaration of node.declarationList.declarations) {
    if (Predicate.isNotNullish(declaration.type)) {
      findInternalReferences(scan, declaration.type)
    }
  }
}

const scanHeritage = (scan: SignatureScan, node: ts.ClassDeclaration | ts.InterfaceDeclaration): void => {
  scanTypeParameters(scan, node.typeParameters)
  for (const heritage of node.heritageClauses ?? []) {
    for (const type of heritage.types) {
      findInternalReferences(scan, type)
    }
  }
}

const scanMembers = (scan: SignatureScan, node: ts.ClassDeclaration | ts.InterfaceDeclaration): void => {
  scanHeritage(scan, node)
  if (ts.isClassDeclaration(node)) {
    for (const member of node.members) {
      scanClassMemberSignature(scan, member)
    }
  } else {
    for (const member of node.members) {
      scanInterfaceMemberSignature(scan, member)
    }
  }
}

const reportReExports = ({ diagnostics, fileInfo, graph }: SignatureScan, node: ts.NamedExports): void => {
  for (const specifier of node.elements) {
    for (const internal of getReExportedInternals(graph, fileInfo, specifier)) {
      const name = specifier.propertyName ?? specifier.name
      diagnostics.push({
        fileName: fileInfo.fileName,
        message: `Do not re-export @internal export "${internal.name}" from a public module`,
        range: [name.getStart(), name.getEnd()],
      })
    }
  }
}

const scanPublicSignature = (scan: SignatureScan, node: ts.Node): void => {
  if (ts.isFunctionDeclaration(node)) {
    scanFunctionLikeSignature(scan, node)
  } else if (ts.isVariableStatement(node)) {
    scanVariableTypes(scan, node)
  } else if (ts.isTypeAliasDeclaration(node)) {
    scanTypeParameters(scan, node.typeParameters)
    findInternalReferences(scan, node.type)
  } else if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
    scanMembers(scan, node)
  } else if (
    ts.isExportDeclaration(node) &&
    Predicate.isNotNullish(node.exportClause) &&
    ts.isNamedExports(node.exportClause)
  ) {
    reportReExports(scan, node.exportClause)
  }
}

const addFileDiagnostic = (diagnosticsByFile: Map<string, Diagnostic[]>, diagnostic: Diagnostic): void => {
  const normalized = normalizePathName(diagnostic.fileName)
  const diagnostics = diagnosticsByFile.get(normalized) ?? []
  diagnostics.push(diagnostic)
  diagnosticsByFile.set(normalized, diagnostics)
}

const collectFileDiagnostics = (graph: WorkspaceGraph, fileInfo: FileInfo): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  for (const declaration of fileInfo.publicDeclarations) {
    scanPublicSignature({ diagnostics, fileInfo, graph }, declaration)
  }
  for (const exportsForName of fileInfo.internalExports.values()) {
    for (const internal of exportsForName) {
      if (!internal.used) {
        diagnostics.push({
          fileName: internal.fileName,
          message: `@internal export "${internal.name}" is not used by production sources`,
          range: internal.range,
        })
      }
    }
  }
  return diagnostics
}

const analyzeWorkspace = (graph: WorkspaceGraph): Analysis => {
  for (const fileInfo of graph.files.values()) {
    scanUsage(graph, fileInfo)
  }
  const diagnosticsByFile = new Map<string, Diagnostic[]>()
  for (const fileInfo of graph.files.values()) {
    for (const diagnostic of collectFileDiagnostics(graph, fileInfo)) {
      addFileDiagnostic(diagnosticsByFile, diagnostic)
    }
  }
  for (const diagnostics of diagnosticsByFile.values()) {
    diagnostics.sort((self, that) => self.range[0] - that.range[0])
  }
  return { diagnosticsByFile }
}

const analyze = (cwd: string): Analysis => {
  const normalizedCwd = normalizePathName(cwd)
  const cached = cache.get(normalizedCwd)
  if (Predicate.isNotNullish(cached)) {
    return cached
  }
  const analysis = analyzeWorkspace(collectWorkspace(cwd))
  cache.set(normalizedCwd, analysis)
  return analysis
}

export const noUnusedInternal: CreateRule = {
  create(context) {
    const analysis = analyze(getCwd(context))
    const diagnostics = analysis.diagnosticsByFile.get(normalizePathName(context.filename)) ?? []
    return {
      Program() {
        for (const {
          message,
          range: [start, end],
        } of diagnostics) {
          context.report({ message, node: { range: [start, end] } })
        }
      },
    }
  },
  meta: {
    docs: {
      description: 'Disallow unused @internal exports, public re-exports, and references from public type signatures',
    },
    type: 'problem',
  },
}
