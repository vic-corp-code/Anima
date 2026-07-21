import { defineWorkspace } from 'vitest/config'
import { resolve } from 'node:path'

export default defineWorkspace([
  resolve(__dirname, 'packages/domain'),
  resolve(__dirname, 'packages/backend'),
  resolve(__dirname, 'apps/shelter')
])
