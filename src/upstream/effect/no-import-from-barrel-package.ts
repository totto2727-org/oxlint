// oxlint-disable-next-line rules/no-node-imports -- The synchronous Oxlint visitor must probe the filesystem before returning.
import * as fs from 'node:fs'
// oxlint-disable-next-line rules/no-node-imports -- Relative barrel resolution needs host filesystem path semantics.
import path from 'node:path'

// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
import type { CreateRule, ESTree } from '@oxlint/plugins'
import { Array, Predicate } from 'effect'

interface RuleOptions {
  checkRelativeIndexImports: boolean
  patterns: RegExp[]
}

const extensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']

const getModuleName = (specifier: ESTree.ImportSpecifier): string =>
  specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value

const isRelativeImport = (source: string): boolean => source.startsWith('./') || source.startsWith('../')

const resolvesToBarrel = (importSource: string, currentFile: string): boolean => {
  const basename = path.basename(importSource)
  const resolved = path.resolve(path.dirname(currentFile), importSource)
  return (
    basename === 'index' ||
    extensions.some((extension) => basename === `index${extension}`) ||
    extensions.some((extension) =>
      // oxlint-disable-next-line node/no-sync -- Oxlint only accepts synchronous visitors.
      fs.existsSync(path.join(resolved, `index${extension}`)),
    )
  )
}

const parseOptions = (input: unknown): RuleOptions => {
  if (!Predicate.isObject(input)) {
    return { checkRelativeIndexImports: true, patterns: [] }
  }
  const checkPatterns: unknown = input['checkPatterns']
  const patterns = (Array.isArray(checkPatterns) ? checkPatterns : [])
    .filter((pattern) => Predicate.isString(pattern))
    .map(
      (pattern) =>
        // oxlint-disable-next-line eslint/require-unicode-regexp -- Existing user regex patterns use legacy RegExp syntax.
        new RegExp(pattern),
    )
  return {
    checkRelativeIndexImports: input['checkRelativeIndexImports'] !== false,
    patterns,
  }
}

const namedImportMessage = (specifier: ESTree.ImportSpecifier, source: string): string => {
  const moduleName = getModuleName(specifier)
  return isRelativeImport(source)
    ? `Do not import "${moduleName}" from barrel file "${source}", import from specific module instead`
    : `Use import * as ${specifier.local.name} from "${source}/${moduleName}" instead`
}

const matchesBarrel = (source: string, filename: string, options: RuleOptions): boolean =>
  isRelativeImport(source)
    ? options.checkRelativeIndexImports && resolvesToBarrel(source, filename)
    : options.patterns.some((pattern) => pattern.test(source))

export const noImportFromBarrelPackage: CreateRule = {
  create(context) {
    const currentFile = context.filename
    const options = parseOptions(context.options[0])
    return {
      ImportDeclaration(node: ESTree.ImportDeclaration) {
        const importSource = node.source.value
        if (node.importKind === 'type' || !matchesBarrel(importSource, currentFile, options)) {
          return
        }
        Array.forEach(
          node.specifiers.filter((item) => item.type === 'ImportNamespaceSpecifier'),
          (specifier) => {
            context.report({
              message: `Do not use namespace import from barrel file "${importSource}", import from specific modules instead`,
              node: specifier,
            })
          },
        )
        Array.forEach(
          node.specifiers.filter((item) => item.type === 'ImportSpecifier'),
          (specifier) => {
            if (specifier.importKind !== 'type') {
              context.report({ message: namedImportMessage(specifier, importSource), node: specifier })
            }
          },
        )
      },
    }
  },
  meta: {
    docs: {
      description: 'Disallow importing from barrel files (index.ts), encourage importing specific modules instead',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          checkPatterns: {
            description: 'Regex patterns to match barrel imports',
            items: { type: 'string' },
            type: 'array',
          },
          checkRelativeIndexImports: {
            description: 'Whether to check relative imports that resolve to index files',
            type: 'boolean',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
}
