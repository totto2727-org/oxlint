import type { Rule } from '@oxlint/plugins'
import { RuleTester } from 'oxlint/plugins-dev'

export const runRuleTest = (ruleName: string, rule: Rule, tests: RuleTester.TestCases): void => {
  const tester = new RuleTester()
  tester.run(ruleName, rule, tests)
}
