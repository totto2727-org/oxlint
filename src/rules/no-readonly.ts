import type { ESTree, Rule, Visitor } from '@oxlint/plugins'

const rule: Rule = {
  create(context): Visitor {
    const report = (node: ESTree.Node): void => {
      context.report({
        node,
        message:
          'Do not write the TypeScript `readonly` modifier. Derive immutable data types from Effect Schema. If an external contract requires the modifier, disable this rule on that line and explain why.',
      })
    }

    const checkModifier = (node: ESTree.Node): void => {
      if ('readonly' in node && node.readonly) {
        report(node)
      }
    }

    return {
      PropertyDefinition: checkModifier,
      TSAbstractPropertyDefinition: checkModifier,
      TSIndexSignature: checkModifier,
      TSMappedType: checkModifier,
      TSParameterProperty: checkModifier,
      TSPropertySignature: checkModifier,
      TSTypeOperator(node) {
        if (node.operator === 'readonly') {
          report(node)
        }
      },
    }
  },
  meta: { type: 'problem' },
}

export default rule
