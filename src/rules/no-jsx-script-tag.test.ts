import { describe, expect, test } from 'vite-plus/test'

import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { isScriptJsxElement, noJsxScriptTag as rule } from './no-jsx-script-tag.ts'

describe('jsx script tag detection', () => {
  describe('matches', () => {
    test('script JSXOpeningElement', () => {
      expect(
        isScriptJsxElement({
          name: { name: 'script', type: 'JSXIdentifier' },
          type: 'JSXOpeningElement',
        }),
      ).toBe(true)
    })
  })

  describe('does not match', () => {
    test('non-script JSXOpeningElement (div)', () => {
      expect(
        isScriptJsxElement({
          name: { name: 'div', type: 'JSXIdentifier' },
          type: 'JSXOpeningElement',
        }),
      ).toBe(false)
    })

    test('capitalized Script component (custom component)', () => {
      expect(
        isScriptJsxElement({
          name: { name: 'Script', type: 'JSXIdentifier' },
          type: 'JSXOpeningElement',
        }),
      ).toBe(false)
    })

    test('non-JSX node type', () => {
      expect(
        isScriptJsxElement({
          name: 'script',
          type: 'Identifier',
        }),
      ).toBe(false)
    })

    test('missing name property', () => {
      expect(
        isScriptJsxElement({
          type: 'JSXOpeningElement',
        }),
      ).toBe(false)
    })
  })
})

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('no-jsx-script-tag', rule, {
  invalid: [
    {
      code: 'const el = <script>alert(1)</script>',
      errors: 1,
      filename: 'test.tsx',
      name: 'lowercase script JSX element is reported',
    },
    {
      code: "const el = <script src='/x.js'></script>",
      errors: 1,
      filename: 'test.tsx',
      name: 'self-attributed script JSX element is reported',
    },
  ],
  valid: [
    { code: 'const el = <div>hello</div>', filename: 'test.tsx', name: 'plain div element is allowed' },
    {
      code: "const el = <Script src='/x.js' />",
      filename: 'test.tsx',
      name: 'capitalised Script component is allowed (not the lowercase script HTML tag)',
    },
  ],
})
