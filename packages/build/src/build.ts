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
import { bundle } from './bundle'

export interface BuildParams extends Partial<WorkspacesStateParams> {
  dev?: boolean
}

export async function build(params: Partial<BuildParams> = {}) {
  const state = new WorkspacesState({
    filesStorage: new FilesStorageNode(),
    environmentStorage: new EnvironmentStorageNode(),
    packageJSONStorage: new PackageJSONStorageNode(),
    tsconfigStorage: new TSConfigStorageNode(),
    ...params,
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
  ].join(' ')

  const cwd = state.rootWorkspace?.dir ?? process.cwd()

  console.log(`Building from directory ${cwd}`)
  console.log(`> ${tscCommand}`)

  const tscPromise = new Promise<void>((resolve, reject) => {
    const tscProcess = exec(
      tscCommand,
      {
        cwd,
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
    tscProcess.stderr?.pipe(process.stderr)
  })

  await tscPromise
  const bundlePromise = bundle({
    state
  })

  await bundlePromise;
}
