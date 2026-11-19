import { RuleTester } from 'oxlint/plugins-dev'
import { describe, it } from 'vite-plus/test'

RuleTester.describe = (title, run) => {
  describe(title, run)
}
RuleTester.it = it
