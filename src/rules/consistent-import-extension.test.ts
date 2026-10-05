import { runRuleTest } from '../__fixtures__/run-rule-test.ts'
import rule from './consistent-import-extension.ts'

runRuleTest('consistent-import-extension', rule, {
  invalid: [
    { code: "import './foo.js'", errors: 1, output: "import './foo.ts'" },
    { code: "import './foo.jsx'", errors: 1, output: "import './foo.tsx'" },
    { code: "export { foo } from '../foo.js?raw#part'", errors: 1, output: "export { foo } from '../foo.ts?raw#part'" },
    { code: "export * from '#@/foo.jsx#part?raw'", errors: 1, output: "export * from '#@/foo.tsx#part?raw'" },
    { code: 'import("./foo.js?raw")', errors: 1, output: 'import("./foo.ts?raw")' },
    { code: "import './foo.js'", options: [{}], errors: 1, output: "import './foo.ts'" },
    { code: "import './foo.jsx'", options: [{ mode: 'ts' }], errors: 1, output: "import './foo.tsx'" },
    ...['jsx', 'ts', 'tsx'].map((extension) => ({
      code: `import './foo.${extension}?raw#part'`,
      errors: 1,
      options: [{ mode: 'js' }],
      output: "import './foo.js?raw#part'",
    })),
    { code: "export * from '#/foo.tsx'", options: [{ mode: 'js' }], errors: 1, output: "export * from '#/foo.js'" },
    { code: "import('../foo.ts')", options: [{ mode: 'js' }], errors: 1, output: "import('../foo.js')" },
    { code: "import './it\\'s.js'", errors: 1, output: "import './it\\'s.ts'" },
    { code: "import './foo\\u002ejs'", errors: 1, output: "import './foo.ts'" },
    { code: 'import("./it\\\"s.js")', errors: 1, output: 'import("./it\\\"s.ts")' },
  ],
  valid: [
    "import './foo.ts'",
    "import './foo.tsx?raw#part'",
    { code: "import './foo.js?raw'", options: [{ mode: 'js' }] },
    "import './foo'",
    "import './foo/'",
    "import './asset.svg?name=foo.js'",
    "import './data.json'",
    "import './foo.mjs'",
    "import './foo.cjs'",
    "import './foo.mts'",
    "import 'package/file.js'",
    "import '##storybook/foo.js'",
    "import '/absolute/foo.js'",
    'import(variable)',
    'import(`./foo.js`)',
    'export const foo = 1',
  ],
})
