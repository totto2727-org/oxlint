import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noIndexFilename as rule } from './no-index-filename.ts'

runRuleTest('no-index-filename', rule, {
  invalid: [
    { code: '', errors: 1, filename: 'index.ts' },
    { code: 'export const feature = true', errors: 1, filename: 'src/feature/index.ts' },
    { code: 'export const view = <div />', errors: 1, filename: 'src/feature/index.tsx' },
  ],
  valid: [
    { code: 'export const feature = true', filename: 'src/feature.ts' },
    { code: '', filename: 'src/index.test.ts' },
    { code: '', filename: 'src/index.d.ts' },
    { code: '', filename: 'src/index.js' },
    { code: '', filename: 'src/index/route.tsx' },
    { code: '', filename: 'src/search-index.ts' },
  ],
})
