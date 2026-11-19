import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { getImportSource, hasProperty, isReportable } from '#src/helpers.ts'

const EFFECT_IMPORT_RE = /^@?effect(?:\/|$)/u

export const isEffectEcosystemImport = (sourceValue: string): boolean => EFFECT_IMPORT_RE.test(sourceValue)

const readName = (node: unknown): string | undefined => {
  if (Predicate.isObject(node) && hasProperty(node, 'name') && Predicate.isString(node.name)) {
    return node.name
  }
  return undefined
}

const checkSpecifierForAs = (
  spec: Record<string, unknown>,
  context: Context,
  reportNode: Record<string, unknown> & { range: [number, number] },
): boolean => {
  const localName = hasProperty(spec, 'local') ? readName(spec.local) : undefined
  if (spec['type'] === 'ImportNamespaceSpecifier') {
    context.report({
      message: `Avoid namespace import (\`import * as ${localName ?? ''}\`) from the effect ecosystem. Use named imports directly.`,
      node: reportNode,
    })
    return true
  }

  const importedName = hasProperty(spec, 'imported') ? readName(spec.imported) : undefined
  if (
    spec['type'] !== 'ImportSpecifier' ||
    Predicate.isNullish(importedName) ||
    Predicate.isNullish(localName) ||
    importedName === localName
  ) {
    return false
  }
  context.report({
    message: `Avoid aliased import (\`${importedName} as ${localName}\`) from the effect ecosystem. Import \`${importedName}\` directly without aliasing.`,
    node: reportNode,
  })
  return true
}

export const noEffectImportAs: Rule = {
  create(context: Context) {
    return {
      ImportDeclaration(node: unknown) {
        const sourceValue = getImportSource(node)
        if (Predicate.isNullish(sourceValue) || !isEffectEcosystemImport(sourceValue) || !isReportable(node)) {
          return
        }
        const specifiers = Predicate.isObject(node) && hasProperty(node, 'specifiers') ? node['specifiers'] : undefined
        if (!Array.isArray(specifiers)) {
          return
        }
        specifiers.some((spec) => Predicate.isObject(spec) && checkSpecifierForAs(spec, context, node))
      },
    }
  },
  meta: {
    type: 'problem',
  },
}
