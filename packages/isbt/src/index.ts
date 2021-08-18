#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'

import {
  EnvironmentStorageNode,
  FilesStorageNode,
  PackageJSONStorageNode,
  TSConfigStorageNode,
  WorkspacesState,
} from '@isbt/workspaces-meta'
import { exec } from 'child_process'
import { isLeft } from 'fp-ts/Either'
import { tryCatch } from 'fp-error'

;(async () => {
  try {
    const state = new WorkspacesState({
      customization: {
        tsconfig: {
          extends: '@isbt/core/tsconfig.base.json',
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

    const { customization } = state
    const { tsconfig } = customization

    await state.init()
    await state.submitTSConfig()

    const tsPackageJSONPathEither = tryCatch(() =>
      require.resolve('typescript/package.json', {
        paths: [process.cwd()],
      }),
    )

    if (isLeft(tsPackageJSONPathEither)) {
      throw tsPackageJSONPathEither.left
    }

    const { right: tsPackageJSONPath } = tsPackageJSONPathEither

    const tsPackagePath = path.dirname(tsPackageJSONPath)
    const { bin } = JSON.parse(
      (await fs.readFile(tsPackageJSONPath)).toString(),
    )

    const tscBin = require.resolve(bin.tsc, {
      paths: [tsPackagePath],
    })

    const tscCommand = [
      process.execPath,
      tscBin,
      `--build tsconfig.${tsconfig.esmName}.json`,
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
  } catch (e) {
    console.error('isbt error')
    console.error(e)
    process.exitCode = 1
  }
})()
