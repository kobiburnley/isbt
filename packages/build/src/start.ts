import {
  EnvironmentStorageNode,
  FilesStorageNode,
  PackageJSONStorageNode,
  TSConfigStorageNode,
  WorkspacesState,
  WorkspacesStateParams,
} from '@isbt/workspaces-meta'
import { exec } from 'child_process'
import { throwLeft } from 'fp-error'
import { resolveBin } from './resolveBin'
import { defaultCustomization } from './defaultCustomization'

export async function start(params: Partial<WorkspacesStateParams> = {}) {
  const state = new WorkspacesState({
    filesStorage: new FilesStorageNode(),
    environmentStorage: new EnvironmentStorageNode(),
    packageJSONStorage: new PackageJSONStorageNode(),
    tsconfigStorage: new TSConfigStorageNode(),
    customization: {
      ...defaultCustomization,
      ...params.customization,
    },
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
    '--watch',
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