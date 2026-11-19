import type { Ranged } from '@oxlint/plugins'
import { Predicate, Schema } from 'effect'

interface ReportableNode extends Ranged, Record<string, unknown> {
  range: [number, number]
}

const Reportable: Schema.Schema<ReportableNode> = Schema.Struct({
  range: Schema.mutable(Schema.Tuple([Schema.Number, Schema.Number])),
})

const { hasProperty } = Predicate

const isReportable = Schema.is(Reportable)

const isEqualityOperator: Predicate.Refinement<unknown, '==' | '!=' | '===' | '!=='> = (op: unknown) =>
  op === '==' || op === '!=' || op === '===' || op === '!=='

const getLiteralNumber = (node: unknown): number | undefined => {
  if (Predicate.isObject(node) && node['type'] === 'Literal' && Predicate.isNumber(node['value'])) {
    return node['value']
  }
  return undefined
}

const isSchemaMethodCall = (node: unknown, methodName: string): boolean => {
  if (
    Predicate.isObject(node) &&
    node['type'] === 'CallExpression' &&
    Predicate.isObject(node['callee']) &&
    node['callee']['type'] === 'MemberExpression' &&
    !Predicate.isTruthy(node['callee']['computed']) &&
    Predicate.isObject(node['callee']['object']) &&
    node['callee']['object']['type'] === 'Identifier' &&
    node['callee']['object']['name'] === 'Schema' &&
    Predicate.isObject(node['callee']['property']) &&
    node['callee']['property']['type'] === 'Identifier' &&
    node['callee']['property']['name'] === methodName
  ) {
    return true
  }
  return false
}

const getImportSource = (node: unknown): string | undefined => {
  if (
    Predicate.isObject(node) &&
    hasProperty(node, 'source') &&
    Predicate.isObject(node['source']) &&
    hasProperty(node['source'], 'value') &&
    Predicate.isString(node['source']['value'])
  ) {
    return node['source']['value']
  }
  return undefined
}

export { getImportSource, getLiteralNumber, hasProperty, isEqualityOperator, isReportable, isSchemaMethodCall }
