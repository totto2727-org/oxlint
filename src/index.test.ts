import { expect, test } from 'vite-plus/test'

import * as library from './index.ts'

test('the initialized package does not expose template APIs', () => {
  expect(Object.keys(library)).toEqual([])
})
