import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { preferSchemaFormatValidation as rule } from './prefer-schema-format-validation.ts'

runRuleTest('prefer-schema-format-validation', rule, {
  invalid: [
    { code: `if (!/^[a-z]+$/u.test(input)) throw new InvalidInput()`, errors: 1 },
    {
      code: `function* f() { if (input.length > LIMIT || /[?#]/u.test(input)) { return yield* new InvalidInput() } }`,
      errors: 1,
    },
  ],
  valid: [
    `const Input = Schema.String.check(Schema.isPattern(/^[a-z]+$/u), Schema.isMaxLength(LIMIT)); if (!Schema.is(Input)(input)) throw new InvalidInput()`,
    `function f(input) { if (/^[a-z]+$/u.test(input)) return 'word'; return 'other' }`,
    `if (!matcher.test(input)) throw new Mismatch()`,
    `if (queue.length > limit) throw new CapacityError()`,
    `if (ruleIsEnabled && /[?#]/u.test(input)) throw new NotAllowed()`,
  ],
})
