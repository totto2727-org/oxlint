// oxlint-disable-next-line rules/no-node-imports -- The integration test observes the installed CLI's exit status.
import { spawnSync } from 'node:child_process'
// oxlint-disable-next-line rules/no-node-imports -- Oxlint reads its fixture and configuration from disk.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
// oxlint-disable-next-line rules/no-node-imports -- Resolve the CLI entry point relative to its installed package.
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vite-plus/test'

import preset from './preset.ts'

const cli = fileURLToPath(new URL('bin/oxlint', import.meta.resolve('oxlint/package.json')))
const config = { rules: { 'eslint/no-void': preset.rules['eslint/no-void'] } }

describe('shared no-void rule', () => {
  test('accepts a standalone statement and reports both void expressions', async () => {
    await mkdir('tmp', { recursive: true })
    const cwd = await mkdtemp('tmp/void-statements-')
    try {
      await writeFile(`${cwd}/config.json`, JSON.stringify(config))
      await writeFile(
        `${cwd}/actions.ts`,
        [
          'declare const upload: () => Promise<void>',
          'export const onDrop = () => { void upload() }',
          'export const onClick = () => void upload()',
          'export const discarded = void upload()',
        ].join('\n'),
      )
      // oxlint-disable-next-line node/no-sync -- Capture output and exit status from the same CLI invocation.
      const result = spawnSync(
        process.execPath,
        [cli, '--threads=1', '--config', 'config.json', '--format=json', 'actions.ts'],
        { cwd, encoding: 'utf8' },
      )
      expect(result.error).toBeUndefined()
      expect(result.status).toBe(1)
      expect(JSON.parse(result.stdout)).toMatchObject({
        diagnostics: [
          { code: 'eslint(no-void)', labels: [{ span: { line: 3 } }] },
          { code: 'eslint(no-void)', labels: [{ span: { line: 4 } }] },
        ],
      })
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })
})
