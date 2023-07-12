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
import { EventEmitter } from 'events'

export interface StartParams extends Partial<WorkspacesStateParams> {
  dev?: boolean
}

export async function start(params: Partial<StartParams> = {}) {
  const events = new EventEmitter()

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
    '--watch',
  ].join(' ')

  const cwd = state.rootWorkspace?.dir ?? process.cwd()

  console.log(`Building from directory ${cwd}`)
  console.log(`> ${tscCommand}`)

  const tscDidFirstBuildPromise = new Promise<void>((resolve) => {
    events.once('tscDidFirstBuild', resolve)
  })

  new Promise<void>((resolve, reject) => {
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

    tscProcess.stdout?.on('data', (data) => {
      if (data.includes('Watching for file changes')) {
        events.emit('tscDidFirstBuild')
        console.log(`tsc: ${data.trim()}`)
      }
    })
  })

  await tscDidFirstBuildPromise
  bundle({
    dev: true,
    state,
  })
}
