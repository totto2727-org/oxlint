import type { Rule } from '@oxlint/plugins'

const rule: Rule = {
  create(context) {
    if (!/(?:^|[/\\])index\.tsx?$/u.test(context.physicalFilename)) {
      return {}
    }

    return {
      Program() {
        context.report({
          loc: { line: 1, column: 0 },
          message: 'Rename this file. Use a name that describes the module instead of index.ts or index.tsx.',
        })
      },
    }
  },
  meta: { type: 'suggestion' },
}

export default rule
