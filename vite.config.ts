import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    arrowParens: 'always',
    experimentalSortImports: {
      ignoreCase: true,
      newlinesBetween: true,
      order: 'asc',
    },
    experimentalSortPackageJson: true,
    jsxSingleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    semi: false,
    singleQuote: true,
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  test: { include: ['src/**/*.test.ts'], setupFiles: ['./src/__fixtures__/rule-tester-setup.ts'] },
  pack: {
    entry: ['src/index.ts', 'src/preset.ts', 'src/typescript.ts', 'src/effect.ts'],
    format: ['esm'],
    platform: 'neutral',
    dts: true,
    clean: true,
  },
  run: {
    tasks: {
      build: {
        command: 'vp pack',
        cache: {
          input: [{ auto: true }, '!dist/**'],
          output: ['dist/**'],
        },
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
        command: 'vp test run',
      },
    },
  },
})
