import { WorkspacesConfigState } from './workspacesConfigState'
import { computed, makeObservable, observable, runInAction } from 'mobx'
import {
  EnvironmentStorage,
  FilesStorage,
  PackageJSONStorage,
  TSConfigStorage,
} from '../storage'
import { WorkspaceState } from './workspaceState'
import { Customization } from '../model'

export interface WorkspacesStateParams {
  readonly customization: Customization
  readonly tsconfigStorage: TSConfigStorage
  readonly packageJSONStorage: PackageJSONStorage
  readonly environmentStorage: EnvironmentStorage
  readonly filesStorage: FilesStorage
}

export class WorkspacesState {
  readonly customization: Customization
  readonly tsconfigStorage: TSConfigStorage
  readonly packageJSONStorage: PackageJSONStorage
  readonly environmentStorage: EnvironmentStorage
  readonly filesStorage: FilesStorage

  config: WorkspacesConfigState
  readonly workspacesMap = observable.map<string, WorkspaceState>([], {
    deep: false,
  })

  cwd = ''

  constructor(params: WorkspacesStateParams) {
    this.customization = params.customization
    this.tsconfigStorage = params.tsconfigStorage
    this.packageJSONStorage = params.packageJSONStorage
    this.environmentStorage = params.environmentStorage
    this.filesStorage = params.filesStorage

    this.config = new WorkspacesConfigState({
      envState: this,
      packageJSONStorage: this.packageJSONStorage,
    })

    makeObservable(this, {
      cwd: observable.ref,
      workspaces: computed,
    })
  }

  get workspaces() {
    return Array.from(this.workspacesMap.values())
  }

  async init() {
    const {
      environmentStorage,
      filesStorage,
      config,
      workspacesMap,
      packageJSONStorage,
    } = this

    this.cwd = await environmentStorage.getCwd()

    await config.init()

    const dirs = await filesStorage.getPatternDirs(config.patterns, {
      cwd: this.cwd,
    })

    const workspacesMapEntries = await Promise.all(
      dirs.map(async (dir) => {
        const workspace = new WorkspaceState({
          customization: this.customization,
          filesStorage: this.filesStorage,
          tsconfigStorage: this.tsconfigStorage,
          workspacesState: this,
          dir,
          packageJSONStorage,
        })

        await workspace.init()

        return [workspace.name, workspace] as [string, WorkspaceState]
      }),
    )

    runInAction(() => {
      workspacesMap.replace(new Map(workspacesMapEntries))
    })

    await Promise.all(
      this.workspaces.map((workspace) => workspace.initDependencies()),
    )
  }

  async submitRootTSConfig() {
    const { tsconfigStorage, customization } = this
    const { tsconfig: tsconfigCustomization } = customization
    const { outDir, esmName } = tsconfigCustomization

    const tsconfigDefaults = {
      compilerOptions: {
        outDir,
      },
      include: undefined,
      references: this.workspaces.map((workspace) => ({
        path: workspace.dir,
      })),
    }

    await tsconfigStorage.updateOrCreate(
      this.cwd,
      [
        tsconfigDefaults,
        {
          extends: tsconfigCustomization.extends,
          exclude: ['node_modules', ...this.config.patterns],
        },
      ],
      {
        ...tsconfigCustomization,
        path: `tsconfig.${esmName}.json`,
      },
    )
  }

  async submitTSConfig() {
    await Promise.all([
      this.submitRootTSConfig(),
      ...this.workspaces.map((workspace) => workspace.submitTSConfig()),
    ])
  }
}
