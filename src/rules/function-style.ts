import type { Context, ESTree, Rule, Settings, SourceCode } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { findBinding } from '#src/effect-method.ts'

type Callable = ESTree.ArrowFunctionExpression | ESTree.Function
type ComponentPosition = 'declaration' | 'binding' | 'inline'

const LAST = -1
const PREVIOUS = 1

const isComponentName = (name: string): boolean => /^[A-Z]/u.test(name)

const wrappedValue = (node: ESTree.Node): ESTree.Expression | undefined => {
  if (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSInstantiationExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSTypeAssertion'
  ) {
    return node.expression
  }
  return undefined
}

const outerExpression = (node: ESTree.Node): ESTree.Node => {
  const { parent } = node
  if (
    Predicate.isNotNullish(parent) &&
    (wrappedValue(parent) === node || (parent.type === 'SequenceExpression' && parent.expressions.at(LAST) === node))
  ) {
    return outerExpression(parent)
  }
  return node
}

const calleeName = (node: ESTree.Node): string | undefined => {
  if (node.type === 'Identifier') {
    return node.name
  }
  if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
    return `${calleeName(node.object) ?? ''}.${node.property.name}`
  }
  return undefined
}

const isComponentWrapper = (name: string | undefined, settings: Settings): boolean => {
  if (name === 'memo' || name === 'forwardRef' || name === 'React.memo' || name === 'React.forwardRef') {
    return true
  }
  const { react } = settings
  const wrappers = Predicate.isObject(react) ? react['componentWrapperFunctions'] : undefined
  return (
    globalThis.Array.isArray(wrappers) &&
    wrappers.some((wrapper: unknown) => {
      if (Predicate.isString(wrapper)) {
        return wrapper === name
      }
      if (Predicate.isObject(wrapper) && Predicate.isString(wrapper['property'])) {
        const receiver = wrapper['object']
        return Predicate.isString(receiver)
          ? `${receiver}.${wrapper['property']}` === name
          : wrapper['property'] === name
      }
      return false
    })
  )
}

const isComponentAssignment = (target: ESTree.Node): boolean => {
  const qualified = calleeName(target)
  const last = qualified?.split('.').at(LAST)
  return qualified === 'module.exports' || (Predicate.isNotNullish(last) && isComponentName(last))
}

const isInlineComponent = (expression: ESTree.Node, parent: ESTree.Node, settings: Settings): boolean => {
  if (parent.type === 'CallExpression') {
    return parent.arguments[0] === expression && isComponentWrapper(calleeName(parent.callee), settings)
  }
  if (parent.type === 'AssignmentExpression') {
    return isComponentAssignment(parent.left)
  }
  return (
    parent.type === 'ReturnStatement' ||
    parent.type === 'ArrowFunctionExpression' ||
    parent.type === 'ExportDefaultDeclaration'
  )
}

const componentPosition = (node: Callable, settings: Settings): ComponentPosition | undefined => {
  if (node.type === 'FunctionDeclaration') {
    return Predicate.isNullish(node.id) || isComponentName(node.id.name) ? 'declaration' : undefined
  }
  const expression = outerExpression(node)
  const { parent } = expression
  if (parent?.type === 'VariableDeclarator') {
    return parent.id.type === 'Identifier' && isComponentName(parent.id.name) ? 'binding' : undefined
  }
  return Predicate.isNotNullish(parent) && isInlineComponent(expression, parent, settings) ? 'inline' : undefined
}

const isDirectComponentValue = (node: ESTree.Node): boolean => {
  if (node.type === 'CallExpression') {
    const name = calleeName(node.callee)
    return name === 'createElement' || name === 'React.createElement'
  }
  return (
    node.type === 'JSXElement' ||
    node.type === 'JSXFragment' ||
    (node.type === 'Literal' && Predicate.isNullish(node.value))
  )
}

const nestedValues = (node: ESTree.Node): ESTree.Expression[] => {
  if (node.type === 'ConditionalExpression') {
    return [node.consequent, node.alternate]
  }
  if (node.type === 'LogicalExpression') {
    return [node.left, node.right]
  }
  const value = node.type === 'SequenceExpression' ? node.expressions.at(LAST) : wrappedValue(node)
  return Predicate.isNullish(value) ? [] : [value]
}

const returnsComponent = (source: SourceCode, node: ESTree.Node, visited: Set<ESTree.Node>): boolean => {
  if (isDirectComponentValue(node)) {
    return true
  }
  if (node.type === 'Identifier') {
    const binding = findBinding(source.getScope(node), node.name)
    const declaration = binding?.defs.find((definition) => definition.type === 'Variable')?.node
    if (
      declaration?.type !== 'VariableDeclarator' ||
      Predicate.isNullish(declaration.init) ||
      visited.has(declaration)
    ) {
      return false
    }
    visited.add(declaration)
    return returnsComponent(source, declaration.init, visited)
  }
  return nestedValues(node).some((value) => returnsComponent(source, value, visited))
}

const hasOverload = (node: ESTree.Function): boolean => {
  const statement = node.parent.type === 'ExportNamedDeclaration' ? node.parent : node
  const container = statement.parent
  if (container.type !== 'Program' && container.type !== 'BlockStatement' && container.type !== 'TSModuleBlock') {
    return false
  }
  const statements: ESTree.Node[] = container.body
  const index = statements.indexOf(statement)
  const previous = statements[index - PREVIOUS]
  const signature = previous?.type === 'ExportNamedDeclaration' ? previous.declaration : previous
  return signature?.type === 'TSDeclareFunction' && signature.id?.name === node.id?.name
}

interface FunctionFrame {
  position: ComponentPosition | undefined
  hasComponentReturn: boolean
}

const reportFunctionStyle = (context: Context, node: Callable, frame: FunctionFrame | undefined): void => {
  if (frame?.hasComponentReturn === true) {
    if (frame.position === 'binding') {
      context.report({ message: 'Declare this named JSX component with the function keyword.', node })
    } else if (frame.position === 'inline' && node.type === 'ArrowFunctionExpression') {
      context.report({ message: 'Use a function expression for this inline JSX component.', node })
    }
    return
  }
  if (
    node.type === 'FunctionDeclaration' &&
    Predicate.isNotNullish(node.body) &&
    node.parent.type !== 'ExportDefaultDeclaration' &&
    !hasOverload(node)
  ) {
    context.report({ message: 'Bind this ordinary function as an expression.', node })
  }
}

export const functionStyle: Rule = {
  create(context) {
    const { settings, sourceCode } = context
    const frames: FunctionFrame[] = []

    const enterFunction = (node: Callable): void => {
      const position = componentPosition(node, settings)
      const hasComponentReturn =
        Predicate.isNotNullish(position) &&
        node.type === 'ArrowFunctionExpression' &&
        returnsComponent(sourceCode, node.body, new Set())
      frames.push({ hasComponentReturn, position })
    }
    const exitFunction = (node: Callable): void => {
      reportFunctionStyle(context, node, frames.pop())
    }

    return {
      ArrowFunctionExpression: enterFunction,
      'ArrowFunctionExpression:exit': exitFunction,
      FunctionDeclaration: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      FunctionExpression: enterFunction,
      'FunctionExpression:exit': exitFunction,
      ReturnStatement(node) {
        const frame = frames.at(LAST)
        if (
          Predicate.isNotNullish(frame?.position) &&
          Predicate.isNotNullish(node.argument) &&
          !frame.hasComponentReturn
        ) {
          frame.hasComponentReturn = returnsComponent(sourceCode, node.argument, new Set())
        }
      },
    }
  },
  meta: { type: 'suggestion' },
}
