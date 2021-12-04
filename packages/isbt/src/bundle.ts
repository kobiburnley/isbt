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
        absolute: false,
        cwd: platformBundlesDir,
      })

      await Promise.all(
        bundleFiles.map(async (bundleFile) => {
          const { name } = path.parse(bundleFile)

          await build({
            entryPoints: [path.join(platformBundlesDir, bundleFile)],
            bundle: true,
            platform,
            target: [platform === 'node' ? 'node12' : 'es5'],
            outfile: path.join('dist', 'bundles', platform, `${name}.js`),
            sourcemap: true,
          })
        }),
      )
    }),
  )
}
