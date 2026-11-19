// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import { Array, Predicate } from 'effect'
import ts from 'typescript-api'

import {
  getDeclarationForName,
  getTopLevelDeclarationNameNodes,
  hasExportModifier,
  hasInternalApiJSDoc,
  isInside,
  isNonReferenceName,
} from './unused-internal-syntax.ts'
import {
  findSourceFiles,
  findWorkspacePackages,
  normalizePathName,
  readText,
  resolveModule,
} from './unused-internal-workspace.ts'

export interface InternalExport {
  fileName: string
  declaration: ts.Node
  name: string
  range: Readonly<[number, number]>
  used: boolean
}

interface ImportBinding {
  fileName: string
  importedName: string
}

export interface FileInfo {
  fileName: string
  sourceFile: ts.SourceFile
  imports: Map<string, ImportBinding>
  namespaceImports: Map<string, string>
  internalExports: Map<string, InternalExport[]>
  publicDeclarations: ts.Node[]
}

export interface WorkspaceGraph {
  files: ReadonlyMap<string, FileInfo>
  packages: ReadonlyMap<string, string>
}

const isInternalPath = (fileName: string): boolean => /\/src\/(?:.*\/)?internal\//u.test(normalizePathName(fileName))

export const getExports = (
  fileInfos: ReadonlyMap<string, FileInfo>,
  fileName: string | undefined,
  exportName: string,
): Readonly<InternalExport[]> => {
  if (Predicate.isNullish(fileName)) {
    return []
  }
  return fileInfos.get(fileName)?.internalExports.get(exportName) ?? []
}

export const getReExportedInternals = (
  graph: WorkspaceGraph,
  fileInfo: FileInfo,
  specifier: ts.ExportSpecifier,
): Readonly<InternalExport[]> => {
  const exportDeclaration = specifier.parent.parent
  const importedName = (specifier.propertyName ?? specifier.name).text
  if (
    Predicate.isNotNullish(exportDeclaration.moduleSpecifier) &&
    ts.isStringLiteral(exportDeclaration.moduleSpecifier)
  ) {
    const importedFile = resolveModule(
      exportDeclaration.moduleSpecifier.text,
      fileInfo.sourceFile.fileName,
      graph.packages,
    )
    return getExports(graph.files, importedFile, importedName)
  }
  const imported = fileInfo.imports.get(importedName)
  return [
    ...(fileInfo.internalExports.get(importedName) ?? []),
    ...getExports(graph.files, imported?.fileName, imported?.importedName ?? ''),
  ]
}

const markUsed = (exports: Readonly<InternalExport[]>, node: ts.Node): void => {
  Array.forEach(exports, (internal) => {
    if (!isInside(node, internal.declaration)) {
      internal.used = true
    }
  })
}

const addInternalExport = (fileInfo: FileInfo, internal: InternalExport): void => {
  const exports = fileInfo.internalExports.get(internal.name) ?? []
  exports.push(internal)
  fileInfo.internalExports.set(internal.name, exports)
}

const collectNamedImports = (fileInfo: FileInfo, importedFile: string, bindings: ts.NamedImportBindings): void => {
  if (ts.isNamespaceImport(bindings)) {
    fileInfo.namespaceImports.set(bindings.name.text, importedFile)
  } else {
    Array.forEach(bindings.elements, (specifier) => {
      const importedName = (specifier.propertyName ?? specifier.name).text
      fileInfo.imports.set(specifier.name.text, { fileName: importedFile, importedName })
    })
  }
}

const collectImports = (
  fileInfo: FileInfo,
  statement: ts.ImportDeclaration,
  packages: ReadonlyMap<string, string>,
): void => {
  const { importClause, moduleSpecifier } = statement
  if (Predicate.isNullish(importClause) || !ts.isStringLiteral(moduleSpecifier)) {
    return
  }
  const importedFile = resolveModule(moduleSpecifier.text, fileInfo.sourceFile.fileName, packages)
  if (Predicate.isNullish(importedFile)) {
    return
  }
  if (Predicate.isNotNullish(importClause.name)) {
    fileInfo.imports.set(importClause.name.text, { fileName: importedFile, importedName: 'default' })
  }
  if (Predicate.isNotNullish(importClause.namedBindings)) {
    collectNamedImports(fileInfo, importedFile, importClause.namedBindings)
  }
}

const collectExportNames = (fileInfo: FileInfo, publicDeclarations: Set<ts.Node>, statement: ts.Statement): void => {
  const statementIsInternal = hasInternalApiJSDoc(statement)
  Array.forEach(getTopLevelDeclarationNameNodes(statement), (name) => {
    const declaration = getDeclarationForName(statement, name)
    if (statementIsInternal || hasInternalApiJSDoc(declaration)) {
      addInternalExport(fileInfo, {
        declaration,
        fileName: fileInfo.sourceFile.fileName,
        name: name.text,
        range: [name.getStart(fileInfo.sourceFile), name.getEnd()],
        used: false,
      })
    } else if (!isInternalPath(fileInfo.fileName)) {
      publicDeclarations.add(statement)
    }
  })
}

const collectFileInfo = (sourceFile: ts.SourceFile, packages: ReadonlyMap<string, string>): FileInfo => {
  const fileInfo: FileInfo = {
    fileName: normalizePathName(sourceFile.fileName),
    imports: new Map(),
    internalExports: new Map(),
    namespaceImports: new Map(),
    publicDeclarations: [],
    sourceFile,
  }
  const publicDeclarations = new Set<ts.Node>()
  Array.forEach(sourceFile.statements, (statement) => {
    if (ts.isImportDeclaration(statement)) {
      collectImports(fileInfo, statement, packages)
    } else if (
      !isInternalPath(fileInfo.fileName) &&
      ts.isExportDeclaration(statement) &&
      !hasInternalApiJSDoc(statement) &&
      Predicate.isNotNullish(statement.exportClause) &&
      ts.isNamedExports(statement.exportClause)
    ) {
      publicDeclarations.add(statement)
    } else if (hasExportModifier(statement)) {
      collectExportNames(fileInfo, publicDeclarations, statement)
    }
  })
  fileInfo.publicDeclarations.push(...publicDeclarations)
  return fileInfo
}

export const scanUsage = (graph: WorkspaceGraph, fileInfo: FileInfo): void => {
  const markNamespaceReference = (namespace: ts.Identifier, name: ts.Identifier): void => {
    const importedFile = fileInfo.namespaceImports.get(namespace.text)
    markUsed(getExports(graph.files, importedFile, name.text), name)
  }
  const visit = (node: ts.Node): void => {
    if (ts.isExportSpecifier(node)) {
      markUsed(getReExportedInternals(graph, fileInfo, node), node)
    } else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && ts.isIdentifier(node.name)) {
      markNamespaceReference(node.expression, node.name)
    } else if (ts.isQualifiedName(node) && ts.isIdentifier(node.left)) {
      markNamespaceReference(node.left, node.right)
    } else if (ts.isIdentifier(node) && !isNonReferenceName(node)) {
      markUsed(fileInfo.internalExports.get(node.text) ?? [], node)
      const imported = fileInfo.imports.get(node.text)
      markUsed(getExports(graph.files, imported?.fileName, imported?.importedName ?? ''), node)
    }
    ts.forEachChild(node, visit)
  }
  visit(fileInfo.sourceFile)
}

export const collectWorkspace = (cwd: string): WorkspaceGraph => {
  const workspacePackages = findWorkspacePackages(cwd)
  const fileInfos = new Map<string, FileInfo>()
  Array.forEach(findSourceFiles(cwd), (fileName) => {
    const sourceFile = ts.createSourceFile(fileName, readText(fileName), ts.ScriptTarget.Latest, true)
    const fileInfo = collectFileInfo(sourceFile, workspacePackages)
    fileInfos.set(fileInfo.fileName, fileInfo)
  })
  return { files: fileInfos, packages: workspacePackages }
}
