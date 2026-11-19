import type { Context, Rule } from '@oxlint/plugins'
import { Predicate, String } from 'effect'

import { isReportable } from './helpers.ts'

interface ImportPath {
  start: string
  path: string
  suffix: string
  extension: string
  directory: boolean
}

const splitSuffix = (path: string): { pathname: string; suffix: string } => {
  const index = path.search(/[?#]/u)
  return index === -1 ? { pathname: path, suffix: '' } : { pathname: path.slice(0, index), suffix: path.slice(index) }
}

const matchImportPath = (value: string): ImportPath | undefined => {
  // Bare specifiers and absolute paths are outside the import rules' scope.
  const start = /^(?<prefix>\.+|#(?!#)[^/?#]*)(?=\/)/u.exec(value)?.groups?.['prefix']
  if (Predicate.isNullish(start)) {
    return undefined
  }
  const { pathname, suffix } = splitSuffix(value.slice(start.length))
  const basename = pathname.slice(pathname.lastIndexOf('/') + 1)
  const dot = basename.lastIndexOf('.')
  return {
    directory: String.isEmpty(basename) || basename === '.' || basename === '..',
    extension: dot > 0 ? basename.slice(dot) : '',
    path: pathname,
    start,
    suffix,
  }
}

type ImportExtensionMode = 'js' | 'ts'

const importExtensionSchema = [
  {
    additionalProperties: false,
    properties: { mode: { enum: ['js', 'ts'], type: 'string' } },
    type: 'object',
  },
]

const getImportExtensionMode = (option: unknown): ImportExtensionMode =>
  Predicate.isObject(option) && option['mode'] === 'js' ? 'js' : 'ts'

const extensionTargets: Readonly<Record<string, Readonly<Record<ImportExtensionMode, string>>>> = {
  '.cjs': { js: '.cjs', ts: '.cts' },
  '.cts': { js: '.cjs', ts: '.cts' },
  '.js': { js: '.js', ts: '.ts' },
  '.jsx': { js: '.js', ts: '.tsx' },
  '.mjs': { js: '.mjs', ts: '.mts' },
  '.mts': { js: '.mjs', ts: '.mts' },
  '.ts': { js: '.js', ts: '.ts' },
  '.tsx': { js: '.js', ts: '.tsx' },
}

const normalizeImportExtension = (value: string, mode: ImportExtensionMode): string | undefined => {
  const match = matchImportPath(value)
  if (Predicate.isNullish(match)) {
    return undefined
  }
  const extension = extensionTargets[match.extension]?.[mode]
  if (Predicate.isNullish(extension) || extension === match.extension) {
    return undefined
  }
  return `${match.start}${match.path.slice(0, -match.extension.length)}${extension}${match.suffix}`
}

const quoteLiteral = (value: string, quote: string): string => {
  const encoded = JSON.stringify(value)
  if (quote === "'") {
    return `'${encoded
      .slice(1, -1)
      .replaceAll(globalThis.String.raw`\"`, '"')
      .replaceAll("'", globalThis.String.raw`\'`)}'`
  }
  return encoded
}

const createImportExtensionListeners = (
  context: Context,
  replacement: (value: string) => string | undefined,
  message: string,
): ReturnType<NonNullable<Rule['create']>> => {
  const check = (node: unknown): void => {
    if (!Predicate.isObject(node) || !Predicate.isObject(node['source'])) {
      return
    }
    const { source } = node
    if (
      source['type'] !== 'Literal' ||
      !Predicate.isString(source['value']) ||
      !Predicate.isString(source['raw']) ||
      !isReportable(source)
    ) {
      return
    }
    const fixed = replacement(source['value'])
    if (Predicate.isNullish(fixed)) {
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

export {
  createImportExtensionListeners,
  getImportExtensionMode,
  importExtensionSchema,
  matchImportPath,
  normalizeImportExtension,
}
