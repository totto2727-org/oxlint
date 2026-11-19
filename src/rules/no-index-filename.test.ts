import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule from './no-index-filename.ts'

runRuleTest('no-index-filename', rule, {
  valid: [
    { filename: 'src/feature.ts', code: 'export const feature = true' },
    { filename: 'src/index.test.ts', code: '' },
    { filename: 'src/index.d.ts', code: '' },
    { filename: 'src/index.js', code: '' },
    { filename: 'src/index/route.tsx', code: '' },
    { filename: 'src/search-index.ts', code: '' },
  ],
  invalid: [
    { filename: 'index.ts', code: '', errors: 1, output: null },
    { filename: 'src/feature/index.ts', code: 'export const feature = true', errors: 1, output: null },
    { filename: 'src/feature/index.tsx', code: 'export const view = <div />', errors: 1, output: null },
  ],
})
