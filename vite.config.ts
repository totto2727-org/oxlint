import { generateIgnorePatterns } from '@totto2727/gitignore-patterns'
import { defineConfig } from 'vite-plus'

import libraryPreset from './src/library.ts'

const ignorePatterns = await generateIgnorePatterns(new URL('.', import.meta.url))

// oxlint-disable-next-line import/no-default-export -- Vite+ reads its configuration from the default export.
export default defineConfig({
  fmt: {
    arrowParens: 'always',
    experimentalSortImports: {
      ignoreCase: true,
      newlinesBetween: true,
      order: 'asc',
    },
    experimentalSortPackageJson: true,
    ignorePatterns,
    jsxSingleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    semi: false,
    singleQuote: true,
  },
  lint: {
    ...libraryPreset,
    env: { node: true },
    ignorePatterns,
    jsPlugins: ['./src/plugin.ts'],
    options: { ...libraryPreset.options, typeCheck: true },
  },
  pack: {
    clean: true,
    dts: true,
    entry: ['src/plugin.ts', 'src/preset.ts', 'src/application.ts', 'src/library.ts'],
    format: ['esm'],
    platform: 'neutral',
  },
  run: {
    tasks: {
      build: {
        cache: {
          input: [{ auto: true }, '!dist/**'],
          output: ['dist/**'],
        },
        command: 'vp pack',
      },
      check: {
        command: 'vp check',
      },
      ci: {
        command: '',
        dependsOn: ['check', 'test', 'package'],
      },
      fix: {
        command: 'vp check --fix',
      },
      package: {
        command: 'npm pack --dry-run',
        dependsOn: ['build'],
      },
      test: {
        command: 'vp test run && sh src/__fixtures__/test-void-statements.sh',
      },
    },
  },
  test: { dir: 'src', setupFiles: ['./src/__fixtures__/rule-tester-setup.ts'] },
})
