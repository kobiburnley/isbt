import { build, BuildOptions, Platform } from 'esbuild'
import path from 'path'
import * as process from 'process'
import globby from 'globby'
import express from 'express'
import ReactDOM from 'react-dom/server'
import React from 'react'
import { SPA } from './SPA'
import { AddressInfo } from 'net'
import { openBrowser } from './openBrowser'

interface BuildVariant {
  env: string
  ext: string
  minify: boolean
  watch: boolean
}

export async function bundle({
  dev,
  serve,
}: {
  dev?: boolean
  serve: Set<string>
}) {
  const platforms: Platform[] = ['browser', 'node']

  const bundlesDir = path.join(process.cwd(), 'src', 'bundles')
  const outdirBase = path.join('dist', 'bundles')

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

          const outdir = path.join(outdirBase, platform, name)

          if (dev && serve.has(name)) {
            const app = express()
            app.use(express.static(outdir))

            app.use((req, res) => {
              res.send(
                ReactDOM.renderToString(
                  React.createElement(SPA, {
                    src: `${name}.development.js`,
                  }),
                ),
              )
            })

            const server = app.listen(0, '0.0.0.0', () => {
              const { port } = server.address() as AddressInfo
              const url = `http://localhost:${port}`
              console.log('Serving SPA for', outdir, url)
              openBrowser(url)
            })
          }

          const createBuildOptions = ({
            minify,
            ext,
            watch,
          }: BuildVariant): BuildOptions => {
            return {
              entryPoints: [path.join(platformBundlesDir, bundleFile)],
              entryNames:
                platform === 'browser' && !dev
                  ? `[dir]/[name]${ext}.[hash]`
                  : `[dir]/[name]${ext}`,
              bundle: true,
              platform,
              target: [platform === 'node' ? 'node12' : 'es6'],
              outdir,
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
              dev
                ? {
                    env: 'development',
                    ext: '.development',
                    minify: false,
                    watch: true,
                  }
                : {
                    env: 'production',
                    ext: '',
                    minify: true,
                    watch: false,
                  },
            ),
          )
        }),
      )
    }),
  )
}
