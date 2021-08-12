#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'

import {
  EnvironmentStorageNode,
  FilesStorageNode,
  PackageJSONStorageNode,
  TSConfigStorageNode,
  WorkspacesState,
} from 'isbt-workspaces-meta'
import { exec } from 'child_process'

;(async () => {
  try {
    const state = new WorkspacesState({
      customization: {
        tsconfig: {
          extends: 'isbt-ts/tsconfig.base.json',
          base: 'tsconfig.json',
          outDir: 'dist',
          rootDir: 'src',
          include: ['src', 'test'],
          cjsName: 'cjs',
          esmName: 'esm',
        },
      },
      filesStorage: new FilesStorageNode(),
      environmentStorage: new EnvironmentStorageNode(),
      packageJSONStorage: new PackageJSONStorageNode(),
      tsconfigStorage: new TSConfigStorageNode(),
    })

    await state.init()
    await state.submitTSConfig()

    const tsPackageJSONPath = require.resolve('typescript/package.json', {
      paths: [process.cwd()],
    })

    const tsPackagePath = path.dirname(tsPackageJSONPath)
    const { bin } = JSON.parse(
      (await fs.readFile(tsPackageJSONPath)).toString(),
    )

    const tscBin = require.resolve(bin.tsc, {
      paths: [tsPackagePath],
    })

    await Promise.all(
      [
        state.customization.tsconfig.cjsName,
        state.customization.tsconfig.esmName,
      ].map(async (type) => {
        const tscCommand = [
          process.execPath,
          tscBin,
          `--build tsconfig.${type}.json`,
        ].join(' ')

        console.log(`> ${tscCommand}`)

        await new Promise<void>((resolve, reject) => {
          const tscProcess = exec(
            tscCommand,
            {
              cwd: process.cwd(),
            },
            (error) => {
              if (error) {
                reject(new Error(error.message))
              } else {
                resolve()
              }
            },
          )

          tscProcess.stdout?.pipe(process.stdout)
        })
      }),
    )
  } catch (e) {
    console.error('isbt error')
    console.error(e)
    process.exitCode = 1
  }
})()
