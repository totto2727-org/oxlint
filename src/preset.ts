import { createPreset } from './preset-builder.ts'
import { effectRuleNames, typescriptRuleNames } from './rule-groups.ts'

export default createPreset([...typescriptRuleNames, ...effectRuleNames])
