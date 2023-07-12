import { context as esbuildContext, BuildOptions, Platform } from 'esbuild'
import path from 'path'
import globby from 'globby'
import express from 'express'
import ReactDOM from 'react-dom/server'
import React from 'react'
import { SPA } from './SPA'
import { AddressInfo } from 'net'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'
import { WorkspacesState } from '@isbt/workspaces-meta'

interface BuildVariant {
  env: string
  ext: string
  minify: boolean
}

export async function bundle({
  dev,
  hash,
  state,
}: {
  dev?: boolean
  hash?: boolean
  state: WorkspacesState
}) {
  const platforms: Platform[] = ['browser', 'node']

  const outDirs = await Promise.all(
    state.effectiveWorkspaces.map(async (workspace) => {
      const bundlesDir = path.join(workspace.dir, 'dist', 'esm', 'bundles')
      const outdirBase = path.join(workspace.dir, 'dist', 'bundles')

      const bundlesSrc = await Promise.all(
        platforms.map(async (platform) => {
          const platformBundlesDir = path.join(bundlesDir, platform)

          const bundleFiles = await globby(['**/*.js'], {
            absolute: false,
            cwd: platformBundlesDir,
          })

          await Promise.all(
            bundleFiles.map(async (bundleFile) => {
              const { name } = path.parse(bundleFile)

              const outdir = path.join(outdirBase, platform, name)

              const createBuildOptions = ({
                minify,
                ext,
              }: BuildVariant): BuildOptions => {
                return {
                  entryPoints: [path.join(platformBundlesDir, bundleFile)],
                  entryNames:
                    platform === 'browser' && !dev
                      ? `[dir]/[name]${ext}${hash ? '.[hash]' : ''}`
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
                  ...(platform === 'browser' && {
                    banner: {
                      js: `window['${workspace.packageJSON.name}/${name}'] = function() {`,
                    },
                    footer: {
                      js: '}',
                    },
                  }),

                  plugins: [
                    ...(platform === 'browser'
                      ? [
                          globalExternals({
                            tslib: {
                              varName: 'tslib',
                              namedExports: [
                                '__values',
                                '__assign',
                                '__awaiter',
                                '__generator',
                                '__extends',
                                '__async',
                                '__spreadProps',
                                '__spreadValues',
                                '__makeTemplateObject',
                              ],
                            },
                            react: 'React',
                            'react-dom': 'ReactDOM',
                          }),
                        ]
                      : []),
                    {
                      name: 'log-build-end',
                      setup(build) {
                        const count = 0
                        build.onEnd((result) => {
                          console.log(
                            `esbuild: Found ${result.errors.length} errors. Watching for file changes.`,
                          )
                        })
                      },
                    },
                  ],
                }
              }

              const context = await esbuildContext(
                createBuildOptions(
                  dev
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

              if (dev) {
                context.watch()
              } else {
                await context.rebuild()
                await context.dispose()
              }

              return bundleFiles
            }),
          )
        }),
      )

      return {
        workspace,
        outdirBase,
        bundlesSrc,
      }
    }),
  )

  if (dev) {
    const app = express()

    const nonEmptyOutDirs = outDirs.filter(
      ({ bundlesSrc }) => bundlesSrc.length > 0,
    )

    for (const { outdirBase } of nonEmptyOutDirs) {
      app.use(express.static(outdirBase))
    }

    app.use((req, res) => {
      res.send(ReactDOM.renderToString(React.createElement(SPA)))
    })

    const server = app.listen(0, '0.0.0.0', () => {
      const { port } = server.address() as AddressInfo
      const url = `http://localhost:${port}`
      console.log(
        'Serving',
        JSON.stringify(
          nonEmptyOutDirs.map((e) => path.join(e.workspace.name, e.outdirBase)),
        ),
        url,
      )
      // openBrowser(url)
    })
  }
}
