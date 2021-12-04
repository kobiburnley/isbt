import { promises as fs } from 'fs'
import { build } from 'esbuild'

export async function yarnMaintain() {
  console.log('Maintaining...')
  await fs.readFile('yarn.lock')

  await build({})
}
