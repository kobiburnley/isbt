import {
  EnvironmentStorageNode,
  FilesStorageNode,
  PackageJSONStorageNode,
  TSConfigStorageNode,
  WorkspacesState,
} from '@isbt/workspaces-meta'
import { exec } from 'child_process'
import { throwLeft } from '@isbt/standard'
import { resolveBin } from './resolveBin'

export async function build() {
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

  const tscBin = await throwLeft(() =>
    resolveBin('typescript', { script: 'tsc' }),
  )

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
}
