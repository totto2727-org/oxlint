import { createPreset, effectRules, typescriptRules } from './preset-builder.ts'

export default createPreset({ ...typescriptRules, ...effectRules })
