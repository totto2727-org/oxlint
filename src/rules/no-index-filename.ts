import type { Rule } from '@oxlint/plugins'

export const noIndexFilename: Rule = {
  create(context) {
    if (!/(?:^|[/\\])index\.tsx?$/u.test(context.physicalFilename)) {
      return {}
    }

    return {
      Program() {
        context.report({
          loc: { column: 0, line: 1 },
          message: 'Rename this file. Use a name that describes the module instead of index.ts or index.tsx.',
        })
      },
    }
  },
  meta: { type: 'suggestion' },
}
