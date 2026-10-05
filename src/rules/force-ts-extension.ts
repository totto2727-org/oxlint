import type { Context, Rule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { isReportable } from '../helpers.ts'

export interface ImportPath {
  start: string
  path: string
  suffix: string
  extension: string
  directory: boolean
}

/** Bare specifiers and absolute paths are outside this rule family's scope. */
export const matchImportPath = (value: string): ImportPath | null => {
  const prefix = /^(\.+|#(?!#)[^/?#]*)(?=\/)/u.exec(value)
  const start = prefix?.[1]
  if (start === undefined) {
    return null
  }
  const remainder = value.slice(start.length)
  const suffixIndex = remainder.search(/[?#]/u)
  const pathname = suffixIndex === -1 ? remainder : remainder.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : remainder.slice(suffixIndex)
  const basename = pathname.slice(pathname.lastIndexOf('/') + 1)
  const dot = basename.lastIndexOf('.')
  return {
    start,
    path: pathname,
    suffix,
    extension: dot > 0 ? basename.slice(dot) : '',
    directory: basename === '' || basename === '.' || basename === '..',
  }
}

/** Retained for callers of the original compatibility helper. */
export const matchJsImport = (value: string): { path: string; start: string; x: string } | null => {
  const match = matchImportPath(value)
  if (match === null || (match.extension !== '.js' && match.extension !== '.jsx')) {
    return null
  }
  return {
    path: match.path.slice(0, -match.extension.length),
    start: match.start,
    x: match.extension === '.jsx' ? 'x' : '',
  }
}

export type ImportExtensionMode = 'js' | 'ts'

export const importExtensionSchema = [
  {
    additionalProperties: false,
    properties: { mode: { enum: ['js', 'ts'], type: 'string' } },
    type: 'object',
  },
]

export const getImportExtensionMode = (option: unknown): ImportExtensionMode =>
  typeof option === 'object' && option !== null && 'mode' in option && option.mode === 'js' ? 'js' : 'ts'

/** Normalize only the four supported code extensions, never asset extensions. */
export const normalizeImportExtension = (value: string, mode: ImportExtensionMode): string | null => {
  const match = matchImportPath(value)
  if (match === null || !['.js', '.jsx', '.ts', '.tsx'].includes(match.extension)) {
    return null
  }
  const extension = mode === 'js' ? '.js' : match.extension.endsWith('x') ? '.tsx' : '.ts'
  if (extension === match.extension) {
    return null
  }
  return `${match.start}${match.path.slice(0, -match.extension.length)}${extension}${match.suffix}`
}

const quoteLiteral = (value: string, quote: string): string => {
  const encoded = JSON.stringify(value)
  if (quote === "'") {
    return `'${encoded.slice(1, -1).replace(/\\"/gu, '"').replace(/'/gu, "\\'")}'`
  }
  return encoded
}

/** Shared import boundary: null ignores, unchanged text reports without an unsafe fix. */
export const createImportExtensionListeners = (
  context: Context,
  replacement: (value: string) => string | null,
  message: string,
): ReturnType<NonNullable<Rule['create']>> => {
  const check = (node: unknown): void => {
    if (!Predicate.isObject(node) || !Predicate.isObject(node['source'])) {
      return
    }
    const source = node['source']
    if (
      source['type'] !== 'Literal' ||
      typeof source['value'] !== 'string' ||
      typeof source['raw'] !== 'string' ||
      !isReportable(source)
    ) {
      return
    }
    const fixed = replacement(source['value'])
    if (fixed === null) {
      return
    }
    const quote = source['raw'][0] ?? '"'
    context.report({
      ...(fixed === source['value'] ? {} : { fix: (fixer) => fixer.replaceText(source, quoteLiteral(fixed, quote)) }),
      message,
      node: source,
    })
  }
  return {
    ExportAllDeclaration: check,
    ExportNamedDeclaration: check,
    ImportDeclaration: check,
    ImportExpression: check,
  }
}

const rule: Rule = {
  create(context) {
    const mode = getImportExtensionMode(context.options[0])
    return createImportExtensionListeners(
      context,
      (value) => {
        const match = matchImportPath(value)
        if (match !== null && (match.extension === '' || match.directory)) {
          return value
        }
        return normalizeImportExtension(value, mode)
      },
      mode === 'js'
        ? 'Use an explicit .js import extension for code modules'
        : 'Use an explicit TypeScript import extension (.ts or .tsx) for code modules',
    )
  },
  meta: {
    fixable: 'code',
    schema: importExtensionSchema,
    type: 'problem',
  },
}

export default rule
