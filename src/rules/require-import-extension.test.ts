import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { requireImportExtension as rule } from './require-import-extension.ts'

runRuleTest('require-import-extension', rule, {
  invalid: [
    { code: "import './foo'", errors: 1 },
    { code: "export { foo } from '../foo'", errors: 1 },
    { code: "export * from './foo?raw#part'", errors: 1 },
    { code: "import('#@/foo')", errors: 1 },
    { code: "import('./foo/')", errors: 1 },
    { code: "import './'", errors: 1 },
    { code: "import '../'", errors: 1 },
    { code: "import './dir.name/child'", errors: 1 },
    { code: "import './dir.name/..'", errors: 1 },
  ],
  valid: [
    "import './foo.js'",
    "import './foo.jsx'",
    "import './foo.ts'",
    "import './foo.tsx'",
    "export * from './data.json?raw'",
    "import('./style.css#theme')",
    "import '#@/icon.svg?url'",
    "import 'package'",
    "import 'package/subpath'",
    "import '##storybook/utils'",
    "import '/absolute/path'",
    "import 'node:fs'",
    "import 'https://example.com/mod'",
    'import(variable)',
    `import(\`./\${name}\`)`,
    'export const foo = 1',
  ],
})
