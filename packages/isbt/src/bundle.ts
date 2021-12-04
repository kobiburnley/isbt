import { build, Platform } from 'esbuild'
import path from 'path'
import * as process from 'process'
import globby from 'globby'

export async function bundle() {
  const platforms: Platform[] = ['neutral', 'browser', 'node']
  const bundlesDir = path.join(process.cwd(), 'src', 'bundles')

  await Promise.all(
    platforms.map(async (platform) => {
      const platformBundlesDir = path.join(bundlesDir, platform)

      const bundleFiles = await globby('**/*.ts', {
        absolute: true,
        cwd: platformBundlesDir,
      })

      await build({
        entryPoints: bundleFiles,
        platform: 'node',
      })
    }),
  )
}
