import type { ESTree } from '@oxlint/plugins'

export const isTagKey = (key: ESTree.Node, computed: boolean): boolean => {
  if (key.type === 'Identifier') {
    return !computed && key.name === '_tag'
  }
  if (key.type === 'Literal') {
    return key.value === '_tag'
  }
  return key.type === 'TemplateLiteral' && key.expressions.length === 0 && key.quasis[0]?.value.cooked === '_tag'
}
