import { build, BuildOptions, Platform } from 'esbuild'
import path from 'path'
import * as process from 'process'
import globby from 'globby'

interface BuildVariant {
  env: string
  ext: string
  minify: boolean
}

export async function bundle({ dev }: { dev?: boolean } = {}) {
  const platforms: Platform[] = ['browser', 'node']

  const bundlesDir = path.join(process.cwd(), 'src', 'bundles')

  await Promise.all(
    platforms.map(async (platform) => {
      const platformBundlesDir = path.join(bundlesDir, platform)

      const bundleFiles = await globby(['**/*.ts', '**/*.tsx'], {
        absolute: false,
        cwd: platformBundlesDir,
      })

      await Promise.all(
        bundleFiles.map(async (bundleFile) => {
          const { name } = path.parse(bundleFile)

          const createBuildOptions = ({
            minify,
            ext,
          }: BuildVariant): BuildOptions => {
            return {
              entryPoints: [path.join(platformBundlesDir, bundleFile)],
              entryNames:
                platform === 'browser'
                  ? `[dir]/[name]${ext}.[hash]`
                  : `[dir]/[name]${ext}`,
              bundle: true,
              platform,
              target: [platform === 'node' ? 'node12' : 'es6'],
              outdir: path.join('dist', 'bundles', platform, name),
              sourcemap: true,
              sourcesContent: false,
              minify,
              treeShaking: true,
              splitting: platform !== 'node',
              format: platform === 'browser' ? 'esm' : 'cjs',
              watch,
            }
          }

          await build(
            createBuildOptions(
              watch
                ? {
                    env: 'development',
                    ext: '.development',
                    minify: false,
                  }
                : {
                    env: 'production',
                    ext: '',
                    minify: true,
                  },
            ),
          )
        }),
      )
    }),
  )
}
