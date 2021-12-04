import { build } from './build'
import { bundle } from './bundle'

export async function buildAndBundle() {
  await Promise.all([build(), bundle()])
}
