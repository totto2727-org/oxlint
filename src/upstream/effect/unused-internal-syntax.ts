// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import { Array, Predicate } from 'effect'
import ts from 'typescript-api'

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)

export const hasExportModifier = (node: ts.Node): boolean => hasModifier(node, ts.SyntaxKind.ExportKeyword)

export const hasPrivateOrProtectedModifier = (node: ts.Node): boolean =>
  hasModifier(node, ts.SyntaxKind.PrivateKeyword) || hasModifier(node, ts.SyntaxKind.ProtectedKeyword)

export const hasInternalJSDoc = (node: ts.Node): boolean =>
  ts.getJSDocTags(node).some((tag) => tag.tagName.getText() === 'internal')

export const hasInternalApiJSDoc = (node: ts.Node): boolean => {
  if (hasInternalJSDoc(node)) {
    return true
  }
  if (ts.isVariableDeclaration(node)) {
    return hasInternalJSDoc(node.parent.parent)
  }
  if (ts.isBindingElement(node) && ts.isVariableDeclaration(node.parent.parent)) {
    return hasInternalJSDoc(node.parent.parent.parent)
  }
  return false
}

const collectBindingNames = (name: ts.BindingName, out: ts.Identifier[]): void => {
  if (ts.isIdentifier(name)) {
    out.push(name)
    return
  }
  Array.forEach(name.elements, (element) => {
    if (ts.isBindingElement(element)) {
      collectBindingNames(element.name, out)
    }
  })
}

export const getTopLevelDeclarationNameNodes = (node: ts.Node): ts.Identifier[] => {
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isModuleDeclaration(node)) &&
    Predicate.isNotNullish(node.name) &&
    ts.isIdentifier(node.name)
  ) {
    return [node.name]
  }
  if (ts.isVariableStatement(node)) {
    const names: ts.Identifier[] = []
    Array.forEach(node.declarationList.declarations, (declaration) => {
      collectBindingNames(declaration.name, names)
    })
    return names
  }
  return []
}

export const getDeclarationForName = (node: ts.Node, name: ts.Identifier): ts.Node => {
  if (!ts.isVariableStatement(node)) {
    return node
  }
  const visit = (current: ts.Node): ts.Node | undefined => {
    if (ts.isVariableDeclaration(current) || ts.isBindingElement(current)) {
      const names: ts.Identifier[] = []
      collectBindingNames(current.name, names)
      if (names.includes(name)) {
        return current
      }
    }
    return ts.forEachChild(current, visit)
  }
  return visit(node.declarationList) ?? node
}

const isImportOrExportBinding = (identifier: ts.Identifier): boolean => {
  const { parent } = identifier
  return (
    (ts.isImportSpecifier(parent) && (parent.name === identifier || parent.propertyName === identifier)) ||
    (ts.isImportClause(parent) && parent.name === identifier) ||
    (ts.isNamespaceImport(parent) && parent.name === identifier) ||
    (ts.isExportSpecifier(parent) && (parent.name === identifier || parent.propertyName === identifier))
  )
}

const isDeclarationName = (identifier: ts.Identifier): boolean => {
  const { parent } = identifier
  return (
    (ts.isVariableDeclaration(parent) && parent.name === identifier) ||
    (ts.isBindingElement(parent) && parent.name === identifier) ||
    (ts.isParameter(parent) && parent.name === identifier) ||
    (ts.isFunctionDeclaration(parent) && parent.name === identifier) ||
    (ts.isClassDeclaration(parent) && parent.name === identifier) ||
    (ts.isInterfaceDeclaration(parent) && parent.name === identifier) ||
    (ts.isTypeAliasDeclaration(parent) && parent.name === identifier) ||
    (ts.isEnumDeclaration(parent) && parent.name === identifier) ||
    (ts.isEnumMember(parent) && parent.name === identifier) ||
    (ts.isModuleDeclaration(parent) && parent.name === identifier)
  )
}

export const isNonReferenceName = (identifier: ts.Identifier): boolean => {
  const { parent } = identifier
  return (
    isImportOrExportBinding(identifier) ||
    isDeclarationName(identifier) ||
    (ts.isPropertyAccessExpression(parent) && parent.name === identifier) ||
    (ts.isPropertyAssignment(parent) && parent.name === identifier) ||
    (ts.isPropertyDeclaration(parent) && parent.name === identifier) ||
    (ts.isPropertySignature(parent) && parent.name === identifier) ||
    (ts.isMethodDeclaration(parent) && parent.name === identifier) ||
    (ts.isMethodSignature(parent) && parent.name === identifier) ||
    (ts.isGetAccessorDeclaration(parent) && parent.name === identifier) ||
    (ts.isSetAccessorDeclaration(parent) && parent.name === identifier)
  )
}

export const isInside = (node: ts.Node, container: ts.Node): boolean => {
  if (node.getSourceFile() !== container.getSourceFile()) {
    return false
  }
  return node.getStart() >= container.getStart() && node.getEnd() <= container.getEnd()
}
