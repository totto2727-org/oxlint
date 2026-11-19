// Vendored from Effect-TS/effect at b1d200c40a1dad69def51ebdbf0a1a612a12b8ac.
// MIT, Copyright (c) 2023 Effectful Technologies Inc. See THIRD-PARTY-NOTICES.md.
// oxlint-disable-next-line rules/no-node-imports -- The visitor analyzes real TypeScript workspace files.
import * as fs from 'node:fs'
// oxlint-disable-next-line rules/no-node-imports -- Workspace and module resolution use host filesystem paths.
import path from 'node:path'

import { Predicate } from 'effect'

const normalizePathName = (filename: string): string => path.resolve(filename).split(path.sep).join('/')

// oxlint-disable-next-line node/no-sync -- Complete path probes before returning visitor diagnostics.
const pathExists = (filename: string): boolean => fs.existsSync(filename)
// oxlint-disable-next-line node/no-sync -- Complete filesystem traversal before returning visitor diagnostics.
const readDirectory = (directory: string): fs.Dirent[] => fs.readdirSync(directory, { withFileTypes: true })
// oxlint-disable-next-line node/no-sync -- Complete TypeScript parsing before returning visitor diagnostics.
const readText = (filename: string): string => fs.readFileSync(filename, 'utf8')

const isSourceFile = (fileName: string): boolean => path.extname(fileName) === '.ts' && !fileName.endsWith('.d.ts')

const isWorkspaceDirectory = (entry: fs.Dirent): boolean =>
  entry.isDirectory() && entry.name !== 'dist' && entry.name !== 'build' && entry.name !== 'node_modules'

const findSourceFiles = (cwd: string): string[] => {
  const packagesDir = path.join(cwd, 'packages')
  if (!pathExists(packagesDir)) {
    return []
  }
  const files: string[] = []
  const visit = (directory: string): void => {
    for (const entry of readDirectory(directory)) {
      const entryPath = path.join(directory, entry.name)
      if (isWorkspaceDirectory(entry)) {
        visit(entryPath)
      } else if (entry.isFile() && isSourceFile(entryPath) && normalizePathName(entryPath).includes('/src/')) {
        files.push(entryPath)
      }
    }
  }
  visit(packagesDir)
  return files
}

const findWorkspacePackages = (cwd: string): Map<string, string> => {
  const packagesDir = path.join(cwd, 'packages')
  const packages = new Map<string, string>()
  if (!pathExists(packagesDir)) {
    return packages
  }
  const visit = (directory: string): void => {
    const packageJson = path.join(directory, 'package.json')
    if (pathExists(packageJson)) {
      try {
        const json: unknown = JSON.parse(readText(packageJson))
        if (Predicate.isObject(json) && Predicate.isString(json['name'])) {
          packages.set(json['name'], directory)
        }
      } catch {
        // Ignore malformed package metadata; TypeScript will report that elsewhere.
      }
      return
    }
    for (const entry of readDirectory(directory)) {
      if (isWorkspaceDirectory(entry)) {
        visit(path.join(directory, entry.name))
      }
    }
  }
  visit(packagesDir)
  return packages
}

const resolveSourceFile = (basePath: string): string | undefined => {
  const candidates =
    path.extname(basePath) === '.ts' ? [basePath] : [basePath, `${basePath}.ts`, path.join(basePath, 'index.ts')]
  for (const candidate of candidates) {
    if (pathExists(candidate) && isSourceFile(candidate)) {
      return normalizePathName(candidate)
    }
  }
  return undefined
}

const longestPackageMatch = (source: string, packages: ReadonlyMap<string, string>): string | undefined =>
  [...packages.keys()]
    .filter((name) => source === name || source.startsWith(`${name}/`))
    .toSorted((first, second) => second.length - first.length)[0]

const resolveModule = (
  source: string,
  containingFile: string,
  workspacePackages: ReadonlyMap<string, string>,
): string | undefined => {
  if (source.startsWith('./') || source.startsWith('../')) {
    return resolveSourceFile(path.resolve(path.dirname(containingFile), source))
  }
  const packageName = longestPackageMatch(source, workspacePackages)
  if (Predicate.isNullish(packageName)) {
    return undefined
  }
  const packageRoot = workspacePackages.get(packageName)
  if (Predicate.isNullish(packageRoot)) {
    return undefined
  }
  const subpath = source === packageName ? 'index.ts' : source.slice(packageName.length + 1)
  return resolveSourceFile(path.join(packageRoot, 'src', subpath))
}

export { findSourceFiles, findWorkspacePackages, normalizePathName, readText, resolveModule }
