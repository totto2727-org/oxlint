import type { ESTree } from '@oxlint/plugins'
import { Array } from 'effect'

export const isTagKey = (key: ESTree.Node, computed: boolean): boolean => {
  if (key.type === 'Identifier') {
    return !computed && key.name === '_tag'
  }
  if (key.type === 'Literal') {
    return key.value === '_tag'
  }
  return (
    key.type === 'TemplateLiteral' &&
    Array.isReadonlyArrayEmpty(key.expressions) &&
    key.quasis[0]?.value.cooked === '_tag'
  )
}
