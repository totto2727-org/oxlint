// oxlint-disable-next-line rules/no-node-imports -- The maintenance CLI reports a structural diff when rule IDs differ.
import assert from 'node:assert/strict'
// oxlint-disable-next-line rules/no-node-imports -- Documentation provenance comes from the local Git executable.
import { execFile } from 'node:child_process'
// oxlint-disable-next-line rules/no-node-imports -- This repository-only generator reads and writes local skill files.
import { copyFile, readdir, writeFile } from 'node:fs/promises'
// oxlint-disable-next-line rules/no-node-imports -- The supplied checkout path follows the host filesystem semantics.
import path from 'node:path'
// oxlint-disable-next-line rules/no-node-imports -- Dynamic imports require a file URL for the trusted checkout.
import { pathToFileURL } from 'node:url'
// oxlint-disable-next-line rules/no-node-imports -- Adapt the Git subprocess callback to the asynchronous generation flow.
import { parseArgs, promisify } from 'node:util'

import { Predicate, String } from 'effect'

import plugin from './src/plugin.ts'

interface Article {
  name: string
  purpose: [string, string]
}
const {
  positionals: [checkout, excess],
} = parseArgs({ allowPositionals: true })
assert.ok(
  Predicate.isString(checkout) && String.isNonEmpty(checkout) && Predicate.isNullish(excess),
  'Usage: node sync-oxlint-skill.ts <trusted oxlint-docs checkout>',
)
const docs = path.resolve(checkout)
// oxlint-disable-next-line typescript/strict-void-return -- Node supplies the promise-based execFile overload through its custom promisifier.
const exec = promisify(execFile)
const git = async (...args: string[]): Promise<string> => {
  const { stdout } = await exec('git', ['-C', docs, ...args])
  return stdout.trim()
}
assert.equal(
  await git('status', '--porcelain', '--', 'src/content', 'LICENSE'),
  '',
  'Use committed documentation sources',
)
const revision = await git('rev-parse', 'HEAD')
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The CLI imports executable code from the maintainer's trusted checkout, whose static types are not installed here.
const { ruleArticles, ruleMarkdown } = (await import(pathToFileURL(path.join(docs, 'src/content/rules.ts')).href)) as {
  ruleArticles: Article[]
  ruleMarkdown: (article: Article, locale: 'en') => string
}
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The external checkout declares this export and the full set of IDs is verified below.
const { externalEffectRuleNames } = (await import(pathToFileURL(path.join(docs, 'src/content/policies.ts')).href)) as {
  externalEffectRuleNames: string[]
}
const localRuleNames = new Set(['consistent-import-extension', 'effect-tracing', 'no-raw-crypto'])
const importedArticles = ruleArticles.filter(({ name }) => !localRuleNames.has(name))
const maintainedRuleNames = [...externalEffectRuleNames, ...localRuleNames]
const ids = Object.keys(plugin.rules).toSorted()
assert.deepEqual(
  [...importedArticles.map(({ name }) => name), ...maintainedRuleNames].toSorted(),
  ids,
  'Imported and local references must cover the same rule IDs as the plugin',
)
const skill = new URL('skills/oxlint/', import.meta.url)
const refs = new URL('references/', skill)
const existing = await readdir(refs)
maintainedRuleNames.forEach((name) => {
  assert.ok(existing.includes(`${name}.md`), `Write the missing rule reference: ${name}`)
})
existing.forEach((file) => {
  assert.ok(
    ids.some((id) => file === `${id}.md`),
    `Review and remove retired rule reference: ${file}`,
  )
})
await Promise.all(
  importedArticles.map(async (article) => {
    const markdown = ruleMarkdown(article, 'en')
      .replaceAll(/^(?<heading>## .+?) \{#[\w-]+\}$/gmu, '$<heading>')
      .replaceAll(/\]\(\/rules\/(?<rule>[\w-]+)\)/gu, (_match, id: string) => {
        assert.ok(ids.includes(id), `Unknown linked rule: ${id}`)
        return `](${id}.md)`
      })
    await writeFile(
      new URL(`${article.name}.md`, refs),
      `# rules/${article.name}\n\n${article.purpose[0]}\n\n${markdown}\n`,
    )
  }),
)
await copyFile(path.join(docs, 'LICENSE'), new URL('LICENSE', skill))
const links = ids.map((id) => `- [${id}](references/${id}.md)`).join('\n')
await writeFile(
  new URL('SKILL.md', skill),
  `---
name: oxlint
description: >-
  Resolve rules/<id> diagnostics from @totto2727/oxlint in JavaScript or TypeScript.
---

# Oxlint rule index

Open the page matching the reported ID. Fix the code first and rerun the project's lint command. Use a documented exception only when the required behavior rules out the normal correction.
For preset selection, see the [package documentation](https://github.com/totto2727-org/oxlint#setup). The index covers the plugin's own namespace, not every built-in rule enabled by a preset.

## Rules

${links}

[Source for imported references](https://github.com/totto2727-org/oxlint-docs/blob/${revision}/src/content/rules.ts) · [License](LICENSE)
`,
)
